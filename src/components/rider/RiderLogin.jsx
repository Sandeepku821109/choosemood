import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { Bike, Mail, Lock, LogIn } from 'lucide-react'
import { riderLogin, clearRiderError } from '../../store/slices/riderSlice'

export default function RiderLogin() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { token, loading, error } = useSelector((state) => state.rider)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (token) navigate('/rider/dashboard', { replace: true })
  }, [token, navigate])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.includes('@') || password.length < 1) return
    dispatch(riderLogin({ email: email.trim(), password }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F5] to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E72744] to-black shadow-lg mb-4">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Rider Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your deliveries</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 space-y-5"
        >
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="rider-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" size={18} />
              <input
                id="rider-email"
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) dispatch(clearRiderError()) }}
                placeholder="rider@fly.com"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#E72744] focus:ring-2 focus:ring-[#E72744]/20 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rider-password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="rider-password"
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) dispatch(clearRiderError()) }}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#E72744] focus:ring-2 focus:ring-[#E72744]/20 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#E72744] to-black text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60 transition"
          >
            {loading ? 'Signing in…' : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Rider accounts are created by the store admin.{' '}
          <Link to="/" className="underline hover:text-gray-600">Back to store</Link>
        </p>
      </div>
    </div>
  )
}
