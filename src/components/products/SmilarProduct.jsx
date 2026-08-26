import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

import config from '../../config'

const SmilarProduct = ({ productCode, subcategory, excludeId = null, limit = 10 }) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const baseUrl = config.backendUrl
  const cloudBase = config.cloudinaryBase
  const navigate = useNavigate()

  const placeholder =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="#f3f4f6"/><text x="200" y="255" font-family="sans-serif" font-size="24" fill="#9ca3af" text-anchor="middle">No Image</text></svg>`
    )

  const normalizeImage = (img) => {
    if (!img) return null

    // string url
    if (typeof img === 'string') {
      if (img.startsWith('http') || img.startsWith('data:')) return img
      return baseUrl.replace(/\/$/, '') + (img.startsWith('/') ? img : `/${img}`)
    }

    // array -> first
    if (Array.isArray(img) && img.length) return normalizeImage(img[0])

    // common object fields
    const candidates = [
      img.secure_url,
      img.secureUrl,
      img.url,
      img.src,
      img.imageUrl,
      img.path,
      img.pathname,
      img.file?.url,
      img.asset?.url,
      img.public_url
    ]
    for (const c of candidates) {
      if (typeof c === 'string' && c.length) {
        if (c.startsWith('http') || c.startsWith('data:')) return c
        return baseUrl.replace(/\/$/, '') + (c.startsWith('/') ? c : `/${c}`)
      }
    }

    // Cloudinary public id
    const publicId = img.public_id || img.publicId || img.public || img.cloudinary?.public_id || img.file?.public_id
    if (publicId && cloudBase) {
      const format = img.format ? `.${img.format}` : ''
      return `${cloudBase}/${publicId}${format}`
    }

    return null
  }

  useEffect(() => {
    const fetchSimilar = async () => {
      setLoading(true)
      setError('')
      try {
        const reqLimit = Math.max(1, Number(limit || 10))

        // 1) fetch a candidate set (server-side filters are helpful but not required)
        const paramsPrimary = {}
        if (productCode) paramsPrimary.productCode = productCode
        if (subcategory) paramsPrimary.subCategory = subcategory
        paramsPrimary.limit = Math.max(10, reqLimit * 3)

        const candRes = await axios.get(`${baseUrl}/api/products`, { params: paramsPrimary })
        const candidates = candRes.data?.data || candRes.data?.products || candRes.data || []

        // helper normalizers
        const pickFirst = (v) => (Array.isArray(v) ? (v.length ? v[0] : null) : v)
        const normalizeProduct = (p) => {
          const id = p._id || p.id || p.productId || String(p.code || p.sku || Math.random())
          const candidate =
            pickFirst(p.images) ||
            pickFirst(p.image) ||
            p.thumbnail ||
            p.imageUrl ||
            p.filepath ||
            p.file?.url ||
            p.asset?.url ||
            (Array.isArray(p.media) ? p.media[0] : p.media) ||
            p.imageObject ||
            null
          const image = normalizeImage(candidate) || normalizeImage(p) || placeholder
          return {
            ...p,
            id,
            image,
            name: p.name || p.title || p.productName || 'Unnamed product',
            price: p.price ?? p.finalPrice ?? p.discountedPrice ?? 0,
            discount: p.discount ?? 0,
            rating: p.rating ?? 0
          }
        }

        // 2) try exact code match (case-insensitive) if productCode provided
        let matched = []
        const code = productCode ? String(productCode).trim().toLowerCase() : null
        const subcat = subcategory ? String(subcategory).trim().toLowerCase() : null

        if (code) {
          matched = (Array.isArray(candidates) ? candidates : []).filter(p => {
            const pid = p._id || p.id || p.productId
            if (!pid || (excludeId && String(pid) === String(excludeId))) return false
            const pcode = String(p.productCode ?? p.code ?? p.sku ?? '').trim().toLowerCase()
            return pcode === code
          })
        }

        // 3) if no exact code matches, try subcategory match (if provided)
        if ((!matched || matched.length === 0) && subcat) {
          matched = (Array.isArray(candidates) ? candidates : []).filter(p => {
            const pid = p._id || p.id || p.productId
            if (!pid || (excludeId && String(pid) === String(excludeId))) return false
            const psub = String(p.subCategory ?? p.subcategory ?? '').trim().toLowerCase()
            return psub === subcat
          })
        }

        // 4) if still no matches, fetch a small fallback list (popular/recent)
        let finalList = matched && matched.length ? matched : []
        if (!finalList.length) {
          const altRes = await axios.get(`${baseUrl}/api/products`, { params: { limit: Math.max(reqLimit, 5) } })
          finalList = altRes.data?.data || altRes.data?.products || altRes.data || []
        }

        // map, dedupe and limit
        const mapped = (Array.isArray(finalList) ? finalList : []).map(normalizeProduct)
        const seen = new Set()
        const unique = []
        for (const it of mapped) {
          if (!it || !it.id) continue
          if (excludeId && String(it.id) === String(excludeId)) continue
          if (seen.has(it.id)) continue
          seen.add(it.id)
          unique.push(it)
          if (unique.length >= reqLimit) break
        }

        setItems(unique)
      } catch (err) {
        console.error('Failed to load similar products', err)
        setError('Failed to load similar products')
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchSimilar()
  }, [productCode, subcategory, excludeId, baseUrl, limit])

  if (!productCode && !subcategory) return null

  return (
    <div className="my-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Similar</h3>
        {/* 'See all' opens full page or you can navigate to collection */}
        <button
          type="button"
          onClick={() => navigate(`/collections?subcategory=${encodeURIComponent(subcategory || '')}`)}
          className="text-sm text-gray-600 hover:text-gray-800 hidden sm:inline-block"
        >
          See all
        </button>
      </div>

      {loading && (
        <div className="flex gap-3">
          {Array.from({ length: Math.min(5, limit) }).map((_, i) => (
            <div
              key={i}
              className="flex-none rounded-md bg-gray-200 animate-pulse w-[58px] h-[74px] sm:w-[66px] sm:h-[90px] md:w-[90px] md:h-[122px]"
            />
          ))}
        </div>
      )}

      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && items.length === 0 && <div className="text-gray-500">No similar products found.</div>}

      {/* Mobile: horizontal scroll strip */}
      <div className="block md:hidden">
        <div className="flex gap-3 overflow-x-auto py-2 px-1 touch-pan-x">
          {items.map((prod) => (
            <button
              key={prod.id}
              onClick={() => navigate(`/products/${prod.id}`)}
              type="button"
              aria-label="Open product"
              className="flex-none rounded overflow-hidden border border-gray-200 bg-white p-0 shadow-sm w-[58px] h-[74px] sm:w-[66px] sm:h-[90px] md:w-[90px] md:h-[122px]"
            >
              <img
                src={prod.image || placeholder}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = placeholder }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Desktop / Tablet: responsive grid */}
      <div className="hidden md:flex md:flex-wrap gap-3">
        {items.map((prod) => (
          <button
            key={prod.id}
            onClick={() => navigate(`/products/${prod.id}`)}
            className="bg-white border rounded p-0 hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-[#FF9DAC]"
            type="button"
            aria-label="Open product"
          >
            <div className="w-[90px] h-[122px] md:w-[106px] md:h-[138px] lg:w-[122px] lg:h-[154px] overflow-hidden rounded">
              <img
                src={prod.image || placeholder}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = placeholder }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SmilarProduct
