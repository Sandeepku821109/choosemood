import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import { backendUrl } from '../../config'
import { Loader2, Copy, ArrowLeft } from 'lucide-react'

const TrackingNumberDetails = () => {
  const params = useParams()
  // support both param spellings if route differs
  const trackingNumberParam = params.trackingNumber || params.trackinNUmber || params.trackinNumber
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token')
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }

  const normalize = (raw) => {
    if (!raw) return null
    const item = Array.isArray(raw) ? raw[0] : raw
    return {
      trackingNumber: item.trackingNumber || item.tracking_id || item.tracking || '',
      orderNumber: item.orderNumber || item.orderId || item.order_id || '',
      status: item.status || item.trackingStatus || item.currentStatus || '',
      updatedAt: item.updatedAt || item.updated || item.lastUpdated || '',
      courier: item.courier || item.carrier || '',
      history: item.history || item.trackingDetails || item.events || []
    }
  }

  const fetchDetails = async (tn) => {
    if (!tn) {
      setError('Tracking number not provided.')
      return
    }
    setLoading(true)
    setError('')
    setData(null)

    const attempts = [
      { url: `${backendUrl}/api/order-tracking/track/${encodeURIComponent(tn)}`, params: null },
      { url: `${backendUrl}/api/order-tracking/${encodeURIComponent(tn)}`, params: null },
      { url: `${backendUrl}/api/order-tracking`, params: { trackingNumber: tn } },
      // fallback attempt by order id if tn looks like an order id
      { url: `${backendUrl}/api/orders/${encodeURIComponent(tn)}/tracking`, params: null }
    ]

    try {
      let resp = null
      for (const ep of attempts) {
        try {
          resp = await axios.get(ep.url, { params: ep.params, headers: getAuthHeaders() })
          if (resp?.data) break
        } catch (err) {
          // try next endpoint
        }
      }
      if (!resp || !resp.data) {
        throw new Error('No tracking details found')
      }

      const raw = resp.data.data || resp.data
      const parsed = normalize(raw)
      if (!parsed || !parsed.trackingNumber) throw new Error('Tracking details not available')

      setData(parsed)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch tracking details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (trackingNumberParam) fetchDetails(trackingNumberParam)
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingNumberParam])

  const copy = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard')
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">Tracking Details</h2>
        </div>
        <div className="text-sm text-gray-500">{trackingNumberParam ? `#${trackingNumberParam}` : ''}</div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-gray-600">Loading tracking details...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500">Order</div>
              <div className="text-lg font-semibold">{data.orderNumber || 'N/A'}</div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">Status</div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm font-medium">
                {data.status || 'Unknown'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500">Tracking Number</div>
              <div className="flex items-center space-x-2">
                <div className="font-medium">{data.trackingNumber}</div>
                <button onClick={() => copy(data.trackingNumber)} className="text-[#E72744] hover:text-[#C81E38]">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Courier</div>
              <div className="font-medium">{data.courier || 'N/A'}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Last Updated</div>
              <div className="font-medium">{data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'N/A'}</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tracking History</h3>
            {(!data.history || data.history.length === 0) ? (
              <div className="text-sm text-gray-500">No history available for this tracking number.</div>
            ) : (
              <ul className="space-y-3">
                {data.history.map((h, idx) => (
                  <li key={idx} className="p-3 bg-gray-50 border rounded">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{h.status || h.title || 'Update'}</div>
                        <div className="text-xs text-gray-500">{h.location || h.place || ''}</div>
                        {h.notes && <div className="text-xs text-gray-600 mt-1">{h.notes}</div>}
                      </div>
                      <div className="text-xs text-gray-400">{h.date ? new Date(h.date).toLocaleString() : ''}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button onClick={() => navigate('/tracking-find', { state: { orderNumber: data.orderNumber, trackingNumber: data.trackingNumber } })} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
              Lookup another
            </button>
            <button onClick={() => navigate(`/tracking-find`, { state: { trackingNumber: data.trackingNumber } })} className="px-4 py-2 bg-[#E72744] text-white rounded hover:bg-[#C81E38]">
              Open Tracking Finder
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrackingNumberDetails
