import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  MapPin, 
  Calendar,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  Phone,
  Mail,
  CreditCard,
  ArrowLeft,
  User,
  Copy,
  ExternalLink
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { backendUrl } from '../App'

const Order = () => {
  const {trackingNumber }= useParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const navigate = useNavigate()

  // State management
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // per-order loading when resolving tracking by orderNumber
  const [trackingLoadingMap, setTrackingLoadingMap] = useState({})

  // id of the order whose cancel button is in progress
  const [cancellingId, setCancellingId] = useState(null)

  // Add this state at the top with other state declarations
  const [expandedTrackingMap, setExpandedTrackingMap] = useState({})
  const [trackingDetails, setTrackingDetails] = useState({})

  // Authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token')
    const userEmail = localStorage.getItem('userEmail')
    const userId = localStorage.getItem('userId')
    
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    if (userEmail) {
      headers['User-Email'] = userEmail
    }
    
    if (userId) {
      headers['User-ID'] = userId
    }
    
    return headers
  }

  const orderCancel = async (orderId) => {
    try {
      // Get user ID from localStorage
      const userId = localStorage.getItem('userId') || localStorage.getItem('userEmail') || localStorage.getItem('userName')

      if (!userId) {
        alert('User authentication required. Please login again.')
        navigate('/login')
        return
      }

      // Ask for cancellation reason with better UX
      const reason = prompt('Please provide a reason for cancellation (optional):') || 'Customer requested cancellation'

      // Show loading state
      setCancellingId(orderId)

      const response = await axios.post(`${backendUrl}/api/orders/${orderId}/cancel`, {
        reason: reason,
        userId: userId // Add userId to the request body
      }, {
        headers: getAuthHeaders()
      })

      if (response.data.success) {
        // Update the order status in the local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId
              ? { ...order, status: 'cancelled' }
              : order
          )
        )

        // Show success message
        alert('Order cancelled successfully')

        // Refresh orders to get updated data
        await fetchOrdersAndStats()
      } else {
        throw new Error(response.data.message || 'Failed to cancel order')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)

      // Handle specific error cases
      if (error.response?.status === 404) {
        alert('Order not found or already processed')
      } else if (error.response?.status === 400) {
        alert(error.response.data.message || 'Cannot cancel this order')
      } else if (error.response?.status === 401) {
        alert('Authentication required. Please login again.')
        navigate('/login')
      } else {
        alert(error.response?.data?.message || 'Failed to cancel order. Please try again.')
      }
    } finally {
      setCancellingId(null)
    }
  }

  // Fetch orders (parallelize stats and orders, and remove unnecessary await)
  const fetchOrdersAndStats = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch orders and stats in parallel
      const [ordersRes, statsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/orders`, { headers: getAuthHeaders() }),
        axios.get(`${backendUrl}/api/orders/stats`, { headers: getAuthHeaders() })
      ])

      // Orders
      const allData = ordersRes.data.data || ordersRes.data.orders || ordersRes.data || []
      const mapData = allData.map((order) => {
        // Handle shippingAddress array properly
        let shippingInfo = {}
        
        if (order.shippingAddress && Array.isArray(order.shippingAddress) && order.shippingAddress.length > 0) {
          const address = order.shippingAddress[0]
          shippingInfo = {
            fullName: address.fullName || address.name || '',
            phone: address.phoneNumber || address.phone || '',
            email: address.email || '',
            address: address.addressLine1 || address.address || '',
            addressLine2: address.addressLine2 || '',
            city: address.city || '',
            state: address.state || '',
            zipCode: address.pincode || address.zipCode || '',
            country: address.country || 'India'
          }
        } else if (order.shippingInfo) {
          shippingInfo = order.shippingInfo
        } else if (order.shippingAddress && !Array.isArray(order.shippingAddress)) {
          // Handle case where shippingAddress is an object
          shippingInfo = {
            fullName: order.shippingAddress.fullName || order.shippingAddress.name || '',
            phone: order.shippingAddress.phoneNumber || order.shippingAddress.phone || '',
            email: order.shippingAddress.email || '',
            address: order.shippingAddress.addressLine1 || order.shippingAddress.address || '',
            addressLine2: order.shippingAddress.addressLine2 || '',
            city: order.shippingAddress.city || '',
            state: order.shippingAddress.state || '',
            zipCode: order.shippingAddress.pincode || order.shippingAddress.zipCode || '',
            country: order.shippingAddress.country || 'India'
          }
        }

        return {
          _id: order._id || order.id,
          orderNumber: order.orderNumber || order._id,
          status: order.status || 'pending',
          total: order.total || order.totalAmount || order.totalPrice || 0,
          createdAt: order.createdAt || new Date(),
          customer: order.customer || {},
          products: order.products || order.items || [],
          items: order.items || order.products || [],
          shippingInfo: shippingInfo,
          shippingAddress: order.shippingAddress || [],
          paymentMethod: order.paymentMethod || {},
          paymentInfo: order.paymentInfo || {},
          paymentStatus: order.paymentStatus || 'pending',
          trackingNumber: order.trackingNumber || null,
          subtotal: order.subtotal || 0,
          shippingCost: order.shipping || order.shippingCost || 0,
          tax: order.tax || 0,
          discount: order.discount || 0
        }
      })
      setOrders(mapData)

      // Stats
      let statsData = {}
      if (statsRes.data.success) {
        statsData = statsRes.data.stats || statsRes.data.data || {}
      } else {
        statsData = statsRes.data.data?.stats || statsRes.data.stats || statsRes.data || {}
      }
      setStats(statsData)

      setError('')
    } catch (error) {
      console.error('Error fetching orders or stats:', error)
      setError(error.response?.data?.message || 'Failed to fetch orders')
      setOrders([])
      setStats({})
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount (fast parallel)
  useEffect(() => {
    // Clear any navigation state that might cause refresh
    window.history.replaceState(null, '', window.location.pathname)
    
    fetchOrdersAndStats()
  }, [])

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-[#FFE0E5] text-[#AE1830] border-[#FFC6CF]'
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Package className="w-4 h-4" />
      case 'shipped': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  // Get payment method display
  const getPaymentMethodDisplay = (order) => {
    const paymentMethod = order.paymentMethod || order.paymentInfo?.method
    const paymentStatus = order.paymentStatus || order.paymentInfo?.status
    
    if (paymentMethod?.toLowerCase() === 'cod' || paymentMethod?.toLowerCase() === 'cash on delivery') {
      return {
        text: 'COD',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <Truck className="w-3 h-3" />
      }
    } else if (paymentStatus === 'paid' || paymentStatus === 'completed') {
      return {
        text: 'PREPAID',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CreditCard className="w-3 h-3" />
      }
    } else {
      return {
        text: 'PENDING',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="w-3 h-3" />
      }
    }
  }

  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  // Format address
  const formatAddress = (shippingInfo) => {
    if (!shippingInfo) return 'No address provided'
    
    // Handle different possible field names
    const address = shippingInfo.address || shippingInfo.addressLine1 || shippingInfo.fullAddress
    const address2 = shippingInfo.addressLine2 || ''
    const city = shippingInfo.city
    const state = shippingInfo.state
    const zipCode = shippingInfo.zipCode || shippingInfo.pincode || shippingInfo.postalCode
    const country = shippingInfo.country
    
    const parts = [
      address,
      address2,
      city,
      state,
      zipCode,
      country
    ].filter(Boolean)
    
    return parts.length > 0 ? parts.join(', ') : 'Address not available'
  }

  // Try to find tracking number by orderNumber (updates state and navigates if found)
  const findTrackingByOrderNumber = async (order) => {
    if (!order) return
    const orderNumber = order.orderNumber || order._id
    if (!orderNumber) {
      alert('Order number not available')
      return
    }

    const key = order._id || orderNumber
    setTrackingLoadingMap(prev => ({ ...prev, [key]: true }))

    try {
      const attempts = [
        { url: `${backendUrl}/api/order-tracking`, params: { orderNumber } },
        { url: `${backendUrl}/api/order-tracking`, params: { orderId: orderNumber } },
        { url: `${backendUrl}/api/order-tracking/by-order/${encodeURIComponent(orderNumber)}`, params: null },
        { url: `${backendUrl}/api/orders/${encodeURIComponent(orderNumber)}/tracking`, params: null }
      ]

      let trackingNumber = null
      let trackingInfo = null

      for (const ep of attempts) {
        try {
          const resp = await axios.get(ep.url, { params: ep.params, headers: getAuthHeaders() })
          const data = resp.data?.data || resp.data || null
          if (!data) continue

          if (Array.isArray(data)) {
            const found = data.find(d => (d.orderNumber && d.orderNumber === orderNumber) || (d.orderId && d.orderId === orderNumber))
            if (found) {
              trackingNumber = found.trackingNumber || found.tracking || found.tracking_id || null
              trackingInfo = found
            }
          } else {
            trackingNumber = data.trackingNumber || data.tracking || data.tracking_id || null
            trackingInfo = data
          }

          if (trackingNumber) break
        } catch (err) {
          // ignore and try next
          if (err.response?.status === 401) {
            alert('Authentication required. Please login again.')
            navigate('/login', { state: { returnUrl: window.location.pathname } })
            return
          }
        }
      }

      if (trackingNumber) {
        // Update orders with tracking number
        setOrders(prev => prev.map(o => 
          (o._id === order._id || o.orderNumber === orderNumber) 
            ? { ...o, trackingNumber, trackingStatus: trackingInfo?.status, trackingHistory: trackingInfo?.history } 
            : o
        ))
        
        // Store tracking details
        setTrackingDetails(prev => ({
          ...prev,
          [key]: trackingInfo
        }))
        
        // Expand the tracking details section
        setExpandedTrackingMap(prev => ({
          ...prev,
          [key]: true
        }))
      } else {
        alert('No tracking information found for this order')
      }
    } catch (err) {
      console.error('findTrackingByOrderNumber error:', err)
      alert('Unable to lookup tracking. Please try again.')
    } finally {
      setTrackingLoadingMap(prev => ({ ...prev, [key]: false }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Orders</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            </div>
            <div className="text-sm text-gray-600">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by order number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E72744] focus:border-[#E72744]"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E72744] focus:border-[#E72744]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
              className="px-4 py-2 bg-[#E72744] text-white rounded-md hover:bg-[#C81E38] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} items
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentMethodDisplay(order).color}`}>
                          {getPaymentMethodDisplay(order).icon}
                          <span className="ml-1">{getPaymentMethodDisplay(order).text}</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Shipping Address</h4>
                        <p className="text-sm text-gray-900">
                          {formatAddress(order.shippingInfo || order.shippingAddress)}
                        </p>
                        {/* Show customer name if available */}
                        {(order.shippingInfo?.fullName || order.shippingAddress?.fullName) && (
                          <p className="text-xs text-gray-600 mt-1">
                            {order.shippingInfo?.fullName || order.shippingAddress?.fullName}
                          </p>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Tracking Number</h4>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className={`text-sm ${order.trackingNumber ? 'text-gray-900' : 'text-gray-500'}`}>
                                {order.trackingNumber || `Not available (Order: ${order.orderNumber || order._id})`}
                              </p>
                              {trackingLoadingMap[order._id || order.orderNumber] && (
                                <p className="text-xs text-gray-400">Looking up tracking…</p>
                              )}
                            </div>

                            {order.trackingNumber ? (
                              <>
                                <button
                                  onClick={() => copyToClipboard(order.trackingNumber)}
                                  className="text-[#E72744] hover:text-[#C81E38]"
                                  title="Copy tracking number"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setExpandedTrackingMap(prev => ({
                                    ...prev,
                                    [order._id]: !prev[order._id]
                                  }))}
                                  className="ml-1 px-3 py-1 text-sm bg-[#E72744] text-white rounded-md hover:bg-[#C81E38] transition-colors"
                                >
                                  {expandedTrackingMap[order._id] ? 'Hide Details' : 'View Details'}
                                </button>
                                
                              </>
                            ) : (
                              <button
                                onClick={() => findTrackingByOrderNumber(order)}
                                className="ml-1 px-3 py-1 text-sm bg-[#E72744] text-white rounded-md hover:bg-[#C81E38] transition-colors"
                                title="Find tracking for this order"
                              >
                                {trackingLoadingMap[order._id || order.orderNumber] ? 'Checking…' : 'Find Tracking'}
                              </button>
                            )}
                          </div>

                          {/* Expanded Tracking Details */}
                          {expandedTrackingMap[order._id] && order.trackingNumber && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium">Status</p>
                                    <p className={`text-sm ${
                                      order.trackingStatus ? 'text-gray-900' : 'text-gray-500'
                                    }`}>
                                      {order.trackingStatus || 'Pending'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Last Updated</p>
                                    <p className="text-sm text-gray-600">
                                      {trackingDetails[order._id]?.lastUpdated 
                                        ? new Date(trackingDetails[order._id].lastUpdated).toLocaleString() 
                                        : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                {/* Tracking History */}
                                {order.trackingHistory && order.trackingHistory.length > 0 && (
                                  <div className="mt-4">
                                    <p className="text-sm font-medium mb-2">Tracking History</p>
                                    <div className="space-y-2">
                                      {order.trackingHistory.map((event, idx) => (
                                        <div key={idx} className="text-sm bg-white p-2 rounded border">
                                          <p className="font-medium">{event.status}</p>
                                          {event.location && (
                                            <p className="text-gray-600">{event.location}</p>
                                          )}
                                          <p className="text-xs text-gray-500">
                                            {new Date(event.timestamp || event.date).toLocaleString()}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Full Details Link */}
                                <div className="flex items-center justify-between pt-3 mt-3 border-t">
                                  <p className="text-xs text-gray-500">
                                    Tracking ID: {order.trackingNumber}
                                  </p>
                                  <Link
                                    to="/tracking-order"
                                    state={{ 
                                      trackingNumber: order.trackingNumber,
                                      orderNumber: order.orderNumber,
                                      orderDetails: {
                                        orderDate: order.createdAt,
                                        total: order.total,
                                        status: order.status,
                                        shippingInfo: order.shippingInfo,
                                        items: order.items || order.products,
                                        orderNumber: order.orderNumber,
                                        trackingHistory: order.trackingHistory || [],
                                        trackingStatus: order.trackingStatus
                                      }
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 bg-[#E72744] text-white text-sm rounded hover:bg-[#C81E38] transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1.5" />
                                    Full Tracking Details
                                  </Link>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          Total: ₹{order.total?.toFixed(2) || order.totalPrice?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to cancel this order?')) {
                                orderCancel(order._id)
                              }
                            }}
                            disabled={cancellingId === order._id}
                            className="flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === order._id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Order Details
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Number</label>
                  <p className="text-lg font-semibold">{selectedOrder.orderNumber || selectedOrder._id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Date</label>
                  <p className="text-sm text-gray-900">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(selectedOrder.status)}
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Amount</label>
                  <p className="text-lg font-semibold">₹{selectedOrder.total?.toFixed(2) || selectedOrder.totalPrice?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              {/* Payment Information */}
              {selectedOrder.paymentInfo && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment Method</label>
                        <p className="text-sm text-gray-900">{selectedOrder.paymentInfo.method || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment Status</label>
                        <p className={`text-sm font-medium ${
                          selectedOrder.paymentInfo.status === 'paid' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedOrder.paymentInfo.status || 'Pending'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedOrder.paymentInfo.transactionId || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Order Items ({selectedOrder.items?.length || 0})</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={item.image || '/placeholder-image.jpg'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} × ₹{item.price?.toFixed(2)}
                        </p>
                        {item.selectedColor && (
                          <p className="text-sm text-gray-600">Color: {item.selectedColor}</p>
                        )}
                        {item.selectedSize && (
                          <p className="text-sm text-gray-600">Size: {item.selectedSize}</p>
                        )}
                        {item.sku && (
                          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{(item.quantity * item.price)?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Order Summary */}
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{selectedOrder.subtotal?.toFixed(2) || (selectedOrder.total - (selectedOrder.shippingCost || 0) - (selectedOrder.tax || 0)).toFixed(2)}</span>
                    </div>
                    {selectedOrder.shippingCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Shipping:</span>
                        <span>₹{selectedOrder.shippingCost?.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>₹{selectedOrder.tax?.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span>-₹{selectedOrder.discount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₹{selectedOrder.total?.toFixed(2) || selectedOrder.totalPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              {(selectedOrder.shippingInfo || selectedOrder.shippingAddress) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            {selectedOrder.shippingInfo?.fullName || 
                             selectedOrder.shippingAddress?.fullName || 
                             selectedOrder.customer?.name || 
                             'Name not available'}
                          </span>
                        </div>
                        {(selectedOrder.shippingInfo?.phone || selectedOrder.shippingAddress?.phoneNumber) && (
                          <div className="flex items-center space-x-2 mb-1">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {selectedOrder.shippingInfo?.phone || selectedOrder.shippingAddress?.phoneNumber}
                            </span>
                          </div>
                        )}
                        {(selectedOrder.shippingInfo?.email || selectedOrder.customer?.email) && (
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {selectedOrder.shippingInfo?.email || selectedOrder.customer?.email}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="text-sm text-gray-600">
                            {formatAddress(selectedOrder.shippingInfo || selectedOrder.shippingAddress)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Order;