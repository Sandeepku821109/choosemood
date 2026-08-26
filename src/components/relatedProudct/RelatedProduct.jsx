import React, { useEffect, useState, useMemo } from 'react'
import Products from '../products/Products'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

import config from '../../config'

const backendUrl = config.backendUrl

const RelatedProduct = ({ category, subcategory }) => {
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true)
      setError('')
      try {
        const params = {}
        if (category) params.category = category
        if (subcategory) {
          params.subCategory = subcategory
          params.subcategory = subcategory // legacy key, harmless
        }
        const res = await axios.get(`${backendUrl}/api/products`, { params })
        // Limit to max 10 elements
        const products = res.data.data || res.data.products || []
        setRelated(Array.isArray(products) ? products.slice(0, 10) : [])
      } catch (err) {
        setError('Failed to load related products.',err)
      } finally {
        setLoading(false)
      }
    }
    fetchRelated()
  }, [category, subcategory])

  // Normalize each related product to ensure id (string) and image url are available
  const items = useMemo(() => {
    const mapped = related.map((p, idx) => {
      let rawId = p._id || p.id || p.productId || (p.product && (p.product._id || p.product.id)) || p.slug
      if (Array.isArray(rawId) && rawId.length) rawId = rawId[0]
      let id = rawId && typeof rawId === 'object' ? (rawId._id || rawId.id || String(rawId)) : rawId
      id = id ? String(id) : `related-${idx}-${Date.now()}`

      // image normalization
      let image = p.image || p.images || p.thumbnail || p.productImage
      if (Array.isArray(image) && image.length) image = image[0]
      if (image && typeof image === 'string' && !image.startsWith('http') && !image.startsWith('data:')) {
        image = image.startsWith('/') ? `${backendUrl}${image}` : `${backendUrl}/${image}`
      }
      if (!image) {
        image =
          'data:image/svg+xml;utf8,' +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#f3f4f6"/><text x="150" y="155" font-family="sans-serif" font-size="20" fill="#9ca3af" text-anchor="middle">No Image</text></svg>`
          )
      }

      return {
        ...p,
        id,
        image
      }
    })

    // Deduplicate by id and keep original order
    const seen = new Set()
    const unique = []
    for (const it of mapped) {
      if (!it || !it.id) continue
      if (seen.has(it.id)) continue
      seen.add(it.id)
      unique.push(it)
      if (unique.length >= 10) break // enforce max 10 here
    }
    return unique
  }, [related])

  if (loading) return <div className="text-gray-500 py-4">Loading related products...</div>
  if (error) return <div className="text-red-600 py-2">{error}</div>
  if (!items.length) return <div className="text-gray-500">No related products found.</div>

  return (
    <div className="my-8">
      <h3 className="text-xl font-semibold mb-4 text-[#C81E38]">Related Products</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map(item => (
          <div
            key={item.id}
            className="cursor-pointer hover:shadow-lg transition-shadow bg-white/5 rounded-md p-2"
            onClick={() => navigate(`/products/${item.id}`)}
            role="link"
            aria-label={`Open product ${item.name || item.title || item.id}`}
          >
            {/* Products component often expects single-item props — pass id/name/image/price if supported.
                If your Products component supports a single `product` prop or `products` list, adapt accordingly. */}
            <Products
              id={item.id}
              name={item.name || item.title}
              image={item.image}
              price={item.price || item.finalPrice || item.discountedPrice}
              discount={item.discount}
              rating={item.rating}
              bestseller={item.bestSeller ?? item.bestseller ?? false}
              description={item.description}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default RelatedProduct
