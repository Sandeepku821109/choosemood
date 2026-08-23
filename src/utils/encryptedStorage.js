/*
  EncryptedStorage - async wrapper using Web Crypto (AES-GCM).
  Usage: await EncryptedStorage.setItem('authToken', token)
         const token = await EncryptedStorage.getItem('authToken')
  Notes:
    - Security depends on the secrecy of the passphrase. Here we derive key from an existing auth token / token if present.
    - This improves local-at-rest protection but cannot protect against attackers with full control of the user machine.
*/
const encoder = new TextEncoder()
const decoder = new TextDecoder()

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary)
}
const fromBase64 = (b64) => {
  const binary = atob(b64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

const getPassphrase = () => {
  // Prefer an existing token as passphrase; fallback to app salt (less secure)
  return localStorage.getItem('authToken') || localStorage.getItem('token') || 'app_fallback_secret_v1'
}

const deriveKey = async (passphrase, salt) => {
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 120000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

const encrypt = async (plain) => {
  const passphrase = getPassphrase()
  const salt = localStorage.getItem('userId') || 'app_default_salt_v1'
  const key = await deriveKey(passphrase, salt)
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const ct = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plain))
  return `${toBase64(iv)}:${toBase64(ct)}`
}

const decrypt = async (data) => {
  try {
    const passphrase = getPassphrase()
    const salt = localStorage.getItem('userId') || 'app_default_salt_v1'
    const key = await deriveKey(passphrase, salt)
    const [ivB64, ctB64] = String(data || '').split(':')
    if (!ivB64 || !ctB64) return null
    const iv = new Uint8Array(fromBase64(ivB64))
    const ct = fromBase64(ctB64)
    const plainBuf = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
    return decoder.decode(plainBuf)
  } catch (e) {
    console.debug('EncryptedStorage.decrypt error', e)
    return null
  }
}

const EncryptedStorage = {
  async setItem(key, value) {
    try {
      const json = typeof value === 'string' ? value : JSON.stringify(value)
      const payload = await encrypt(json)
      localStorage.setItem(key, payload)
      return true
    } catch (e) {
      console.error('EncryptedStorage.setItem error', e)
      return false
    }
  },

  async getItem(key) {
    try {
      const data = localStorage.getItem(key)
      if (!data) return null
      const decrypted = await decrypt(data)
      if (decrypted === null) return null
      try { return JSON.parse(decrypted) } catch { return decrypted }
    } catch (e) {
      console.error('EncryptedStorage.getItem error', e)
      return null
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },

  clear() {
    localStorage.clear()
  }
}

export default EncryptedStorage