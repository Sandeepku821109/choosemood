import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Copy, Loader2, Search } from 'lucide-react'
import { backendUrl } from '../../config'
import toast, { Toaster } from 'react-hot-toast'


const TrackingNumberFind = () => {
  const location = useLocation()
  const fromState = location.state || {}
  const initialTracking = fromState.trackingNumber || ''

  const [trackingNumber, setTrackingNumber] = useState(initialTracking || '')
  const [trackingData, setTrackingData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialTracking) fetchByTrackingNumber(initialTracking)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  
  const copyToClipboard = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  // parse a snapshot reference: if it's an object return it,
  // if JSON string try parse, if URL attempt fetch
  const resolveOrderSnapshot = async (snapshotRef) => {
    if (!snapshotRef) return null
    try {
      if (typeof snapshotRef === 'object') return snapshotRef
      if (typeof snapshotRef === 'string') {
        if (snapshotRef.startsWith('http')) {
          const resp = await axios.get(snapshotRef)
          return resp.data || null
        }
        try {
          return JSON.parse(snapshotRef)
        } catch (e) {
          return null
        }
      }
      return null
    } catch (err) {
      console.debug('resolveOrderSnapshot error:', err)
      return null
    }
  }

  // Normalize backend response into a friendly object.
  const parseResponseData = (raw) => {
    if (!raw) return null
    const item = Array.isArray(raw) ? raw[0] : raw

    const customer = item.customer || item.user || item.buyer || {}
    const customerName = customer.name || customer.fullName || item.customerName || ''

    const rawItems = item.items || item.products || item.orderItems || []
    const products = Array.isArray(rawItems)
      ? rawItems.map(p => ({
          name: p.name || p.title || p.productName || 'Product',
          qty: p.quantity || p.qty || p.count || 1,
          price: (p.price || p.unitPrice || p.salePrice || 0),
          image: p.image || p.thumbnail || ''
        }))
      : []

    const shipping = item.shippingInfo || item.shipping || (Array.isArray(item.shippingAddress) ? item.shippingAddress[0] : item.shippingAddress) || {}

    const history = item.history || item.trackingDetails || item.events || item.trackingHistory || []

    const snapshotRef = item.orderSnapshot || item.order_snapshot || item.snapshot || item.orderSnapshotFile || item.snapshotUrl || item.order_snapshot_url || null

    return {
      rawItem: item,
      snapshotRef,
      trackingNumber: item.trackingNumber || item.tracking || item.trackingNo || '',
      status: item.status || item.trackingStatus || item.currentStatus || '',
      updatedAt: item.updatedAt || item.updated || item.lastUpdated || '',
      courier: item.courier || item.carrier || '',
      customerName: customerName,
      customerEmail: customer.email || customer.emailAddress || '',
      products,
      total: item.total || item.totalAmount || item.orderTotal || 0,
      paymentMethod: item.paymentMethod || item.payment || '',
      shippingAddress: {
        address: shipping.address || shipping.addressLine1 || shipping.addressLine || '',
        city: shipping.city || '',
        state: shipping.state || '',
        zip: shipping.pincode || shipping.zipCode || shipping.postalCode || '',
        country: shipping.country || ''
      },
      history: Array.isArray(history) ? history : []
    }
  }

  // helper to enrich parsed object with snapshot products when available
  const enrichWithSnapshotIfNeeded = async (parsed) => {
    if (!parsed) return parsed
    if (parsed.products && parsed.products.length > 0) return parsed

    const raw = parsed.rawItem || {}
    const snapshotRef = parsed.snapshotRef || raw.orderSnapshot || raw.order_snapshot || raw.snapshot || raw.orderSnapshotFile || raw.snapshotUrl || null
    if (!snapshotRef) return parsed

    const snapshot = await resolveOrderSnapshot(snapshotRef)
    if (!snapshot) return parsed

    const snapItems = snapshot.items || snapshot.products || snapshot.orderItems || snapshot.cart || []
    const products = Array.isArray(snapItems) ? snapItems.map(p => ({
      name: p.name || p.title || p.productName || p.product_name || 'Product',
      qty: p.quantity || p.qty || p.count || p.quantityOrdered || 1,
      price: (p.price || p.unitPrice || p.salePrice || p.amount || 0),
      image: p.image || p.thumbnail || p.productImage || ''
    })) : []

    return {
      ...parsed,
      products: products.length > 0 ? products : parsed.products
    }
  }

  const fetchByTrackingNumber = async (tn) => {
    if (!tn) {
      toast.error('Please provide a tracking number.')
      return
    }
    setLoading(true)
    setError('')
    setTrackingData(null)
    
    const loadingToast = toast.loading('Searching for tracking details...')
    
    try {
      const endpoints = [
        { url: `${backendUrl}/api/order-tracking/track/${encodeURIComponent(tn)}`, params: null },
        { url: `${backendUrl}/api/order-tracking/${encodeURIComponent(tn)}`, params: null },
        { url: `${backendUrl}/api/order-tracking`, params: { trackingNumber: tn } }
      ]
      let resp = null
      for (const ep of endpoints) {
        try {
          resp = await axios.get(ep.url, { params: ep.params })
          if (resp?.data) break
        } catch (err) {
          if (err.response?.status === 404) {
            continue // Try next endpoint
          }
          throw err // Throw other errors
        }
      }

      if (!resp || !resp.data) {
        toast.error('No tracking information found for this number')
        throw new Error('Tracking not found')
      }

      let parsed = parseResponseData(resp.data.data || resp.data)
      parsed = await enrichWithSnapshotIfNeeded(parsed)

      if (!parsed || !parsed.trackingNumber) {
        toast.error('No tracking details available for this number')
        throw new Error('No tracking details available')
      }
      
      setTrackingData(parsed)
      setTrackingNumber(parsed.trackingNumber || tn)
      setError('')
      toast.success('Tracking information found!')
    } catch (err) {
      const errorMessage = 
        err.response?.status === 404 ? 'No tracking information found for this number' :
        err.response?.status === 400 ? 'Invalid tracking number format' :
        err.message === 'Tracking not found' ? 'No tracking information found for this number' :
        err.response?.data?.message || err.message || 'Unable to find tracking information'
    
      setError(errorMessage)
      toast.error(errorMessage)
    } finally { 
      toast.dismiss(loadingToast)
      setLoading(false)
    }
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token')
    const userEmail = localStorage.getItem('userEmail')
    const userId = localStorage.getItem('userId')
    
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (token) headers.Authorization = `Bearer ${token}`
    if (userEmail) headers['User-Email'] = userEmail
    if (userId) headers['User-Id'] = userId
    
    return headers
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (trackingNumber) {
      fetchByTrackingNumber(trackingNumber)
    } else {
      toast.error('Please enter a tracking number.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-bold mb-4 text-center text-[#C81E38]">Track Your Order</h2>

      <form onSubmit={handleSubmit} className="mb-4">
        <div>
          <label className="text-sm text-gray-600">Tracking Number</label>
          <div className="mt-1 flex">
            <input
              className="w-full px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#FF6680]"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. TRK123456"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#E72744] text-white rounded-r-md hover:bg-[#C81E38]"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm text-gray-600">Searching...</span>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-600 bg-red-50 border border-red-200 rounded p-3 text-center">
          {error}
        </div>
      )}

      {trackingData && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg mb-1 text-green-700">Order Summary</h3>
              {trackingData.customerName && <div className="text-sm text-gray-700 mb-1"><strong>Customer:</strong> {trackingData.customerName}</div>}
              {trackingData.customerEmail && <div className="text-sm text-gray-700 mb-1"><strong>Email:</strong> {trackingData.customerEmail}</div>}
              <div className="text-sm text-gray-700 mb-1"><strong>Status:</strong> {trackingData.status || 'N/A'}</div>
              <div className="text-xs text-gray-500">Last updated: {trackingData.updatedAt ? new Date(trackingData.updatedAt).toLocaleString() : 'N/A'}</div>
            </div>

            <div className="flex flex-col items-end space-y-2">
              {trackingData.trackingNumber && (
                <div className="text-sm text-gray-700">
                  <div className="font-medium">Tracking (user-facing)</div>
                  <div className="flex items-center">
                    <span className="mr-2">{trackingData.trackingNumber}</span>
                    <button onClick={() => copyToClipboard(trackingData.trackingNumber)} className="text-[#E72744] hover:text-[#C81E38]" title="Copy tracking">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Products</h4>
            <ul className="space-y-3">
              {(!trackingData.products || trackingData.products.length === 0) ? (
                <li className="text-sm text-gray-500">Product details not available</li>
              ) : trackingData.products.map((p, idx) => (
                <li key={idx} className="p-3 bg-white border rounded flex items-center space-x-4">
                  <img src={p.image || '/placeholder-image.jpg'} alt={p.name} className="w-16 h-16 object-cover rounded" onError={(e)=>{e.target.src='/placeholder-image.jpg'}} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-sm text-gray-600">Qty: {p.qty} • ₹{(p.price || 0).toFixed(2)}</div>
                  </div>
                  <div className="text-right font-semibold">₹{((p.qty || 1) * (p.price || 0)).toFixed(2)}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-3 border rounded">
              <div className="text-sm text-gray-500">Shipping Address</div>
              <div className="text-sm text-gray-700 mt-1">
                {trackingData.shippingAddress.address ? (
                  <>
                    <div>{trackingData.shippingAddress.address}</div>
                    <div className="text-xs text-gray-500">{[trackingData.shippingAddress.city, trackingData.shippingAddress.state, trackingData.shippingAddress.zip, trackingData.shippingAddress.country].filter(Boolean).join(', ')}</div>
                  </>
                ) : <div className="text-sm text-gray-500">Not available</div>}
              </div>
            </div>

            <div className="bg-white p-3 border rounded">
              <div className="text-sm text-gray-500">Payment & Total</div>
              <div className="mt-1">
                <div className="text-sm text-gray-700">Method: {trackingData.paymentMethod || 'N/A'}</div>
                <div className="text-lg font-semibold mt-2">Total: ₹{(trackingData.total || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Tracking History</h4>
            {(!trackingData.history || trackingData.history.length === 0) ? (
              <div className="text-sm text-gray-500">No history available for this tracking number.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {trackingData.history.map((step, idx) => (
                  <li key={idx} className="p-2 bg-white border rounded">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{step.status || step.title || 'Update'}</div>
                        <div className="text-xs text-gray-500">{step.location || step.place || ''}</div>
                        {step.notes && <div className="text-xs text-gray-600 mt-1">{step.notes}</div>}
                      </div>
                      <div className="text-xs text-gray-400">{step.date ? new Date(step.date).toLocaleString() : ''}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button 
              onClick={() => { 
                setTrackingData(null)
                setError('')
                setTrackingNumber('')
                toast.success('Ready for new search')
              }} 
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Lookup another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrackingNumberFind
