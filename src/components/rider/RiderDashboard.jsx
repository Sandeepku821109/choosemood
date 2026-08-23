import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  Bike, LogOut, RefreshCw, PackageCheck, Truck, MapPin, Phone,
  IndianRupee, CreditCard, Banknote, Clock, XCircle, CheckCircle2, X
} from 'lucide-react'
import {
  fetchRiderOrders, startDelivery, completeDelivery,
  reportDeliveryFailure, riderLogout, restoreRiderSession
} from '../../store/slices/riderSlice'
import SignaturePad from './SignaturePad'

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-900',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

const formatDeliveryTime = (value) => {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function CompleteDeliveryModal({ order, busy, onClose, onConfirm }) {
  const [otp, setOtp] = useState('')
  const [signature, setSignature] = useState(null)

  const canSubmit = Boolean(otp.length === 6 || signature)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Confirm Delivery</h3>
            <p className="text-sm text-gray-500">Order {order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {order.paymentMethod === 'COD' && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2 text-red-700 text-sm font-medium">
            <Banknote size={18} />
            Collect ₹{order.amountToCollect} cash from the customer
          </div>
        )}

        <div>
          <label htmlFor="delivery-otp" className="block text-sm font-medium text-gray-700 mb-1.5">
            Customer OTP {order.otpSent ? '(emailed to customer)' : '(not sent - signature required)'}
          </label>
          <input
            id="delivery-otp"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit OTP"
            className="w-full tracking-[0.5em] text-center text-lg font-semibold py-2.5 rounded-xl border border-gray-300 focus:border-[#E72744] focus:ring-2 focus:ring-[#E72744]/20 outline-none"
          />
        </div>

        <div className="text-center text-xs text-gray-400 font-medium uppercase tracking-wide">— or —</div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-1.5">Customer signature</p>
          <SignaturePad onChange={setSignature} />
        </div>

        <button
          type="button"
          disabled={!canSubmit || busy}
          onClick={() => onConfirm({ otp: otp.length === 6 ? otp : undefined, signature })}
          className="w-full bg-gradient-to-r from-[#E72744] to-black text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
        >
          {busy ? 'Confirming…' : 'Mark Delivered'}
        </button>
        <p className="text-xs text-gray-400 text-center">Enter the emailed OTP or capture a signature as proof.</p>
      </div>
    </div>
  )
}

export default function RiderDashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { token, rider, orders, loading, actionLoading } = useSelector((state) => state.rider)
  const [activeOrder, setActiveOrder] = useState(null)
  const [failingOrder, setFailingOrder] = useState(null)
  const [failReason, setFailReason] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/rider', { replace: true })
      return
    }
    if (!rider) {
      // Page refresh: token survives, decode minimal identity from a fetch
      dispatch(restoreRiderSession({ name: 'Rider', email: '' }))
    }
    dispatch(fetchRiderOrders())
  }, [token, rider, dispatch, navigate])

  const stats = {
    active: orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.orderStatus)).length,
    outForDelivery: orders.filter((o) => o.orderStatus === 'OUT_FOR_DELIVERY').length,
    deliveredToday: orders.filter(
      (o) => o.orderStatus === 'DELIVERED' && new Date(o.actualDelivery).toDateString() === new Date().toDateString()
    ).length,
    codPending: orders
      .filter((o) => o.orderStatus !== 'CANCELLED' && o.amountToCollect > 0 &&
        ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.orderStatus))
      .reduce((sum, o) => sum + o.amountToCollect, 0)
  }

  const handleLogout = () => {
    dispatch(riderLogout())
    navigate('/rider', { replace: true })
  }

  const handleStartDelivery = async (order) => {
    try {
      const result = await dispatch(startDelivery(order._id)).unwrap()
      toast.success(result.otpSentTo
        ? `OTP emailed to ${result.otpSentTo}`
        : 'Out for delivery — OTP email failed, use signature proof')
      dispatch(fetchRiderOrders())
    } catch (err) {
      toast.error(err?.message || 'Could not start delivery')
    }
  }

  const handleConfirmDelivery = async ({ otp, signature }) => {
    try {
      const result = await dispatch(completeDelivery({ orderId: activeOrder._id, otp, signature })).unwrap()
      toast.success(result.message || 'Delivery confirmed')
      setActiveOrder(null)
      dispatch(fetchRiderOrders())
    } catch (err) {
      toast.error(err?.message || 'Could not confirm delivery')
    }
  }

  const handleReportFailure = async () => {
    if (!failReason.trim()) {
      toast.error('Please enter a reason')
      return
    }
    try {
      await dispatch(reportDeliveryFailure({ orderId: failingOrder._id, reason: failReason })).unwrap()
      toast.success('Failed delivery recorded')
      setFailingOrder(null)
      setFailReason('')
      dispatch(fetchRiderOrders())
    } catch (err) {
      toast.error(err?.message || 'Could not record failure')
    }
  }

  if (!token) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={4000} newestOnTop />

      {/* Header */}
      <header className="bg-gradient-to-r from-[#E72744] to-black text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold leading-tight">Rider Dashboard</h1>
              <p className="text-xs text-white/70">{rider?.name || 'Signed in'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(fetchRiderOrders())}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Active Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Out for Delivery</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.outForDelivery}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Delivered Today</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.deliveredToday}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Cash to Collect</p>
            <p className="text-2xl font-bold text-red-600 mt-1">₹{stats.codPending.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Orders */}
        {loading && orders.length === 0 ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse h-32" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <PackageCheck className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="font-semibold text-gray-700">No orders assigned yet</h3>
            <p className="text-sm text-gray-400 mt-1">New deliveries assigned by the admin will appear here.</p>
            <Link to="/" className="inline-block mt-4 text-sm text-[#E72744] underline">Back to store</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div>
                      <span className="font-bold text-gray-900">{order.orderNumber}</span>
                      <span className={`ml-2 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[order.orderStatus] || 'bg-gray-100 text-gray-800'}`}>
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      order.paymentMethod === 'COD' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {order.paymentMethod === 'COD' ? <><Banknote size={14} /> CASH ON DELIVERY</> : <><CreditCard size={14} /> PAID ONLINE</>}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Customer + address */}
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-gray-900">{order.customer.name}</p>
                      {order.customer.phone && (
                        <a href={`tel:${order.customer.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-[#E72744]">
                          <Phone size={14} /> {order.customer.phone}
                        </a>
                      )}
                      <p className="flex items-start gap-2 text-gray-600">
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        <span>
                          {[order.customer.addressLine1, order.customer.addressLine2, order.customer.city,
                            order.customer.state, order.customer.pincode].filter(Boolean).join(', ')}
                        </span>
                      </p>
                      <p className="flex items-center gap-2 text-gray-500 text-xs">
                        <Clock size={13} /> Delivery by: {formatDeliveryTime(order.estimatedDelivery)}
                      </p>
                      {order.deliveryFailedReason && (
                        <p className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5">
                          <XCircle size={13} className="mt-0.5 shrink-0" /> Last attempt failed: {order.deliveryFailedReason}
                        </p>
                      )}
                    </div>

                    {/* Items + money */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {order.items.slice(0, 3).map((item, i) => (
                          <img
                            key={i}
                            src={Array.isArray(item.productImage) ? item.productImage[0] : item.productImage}
                            alt={item.productName}
                            className="w-11 h-11 rounded-lg object-cover border border-gray-200 bg-gray-50"
                            onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                          />
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-xs text-gray-500 font-medium">+{order.items.length - 3} more</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.items.reduce((n, i) => n + i.quantity, 0)} item(s)
                        {' · '}
                        <span className="font-semibold text-gray-900">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                      </p>
                      {order.amountToCollect > 0 ? (
                        <p className="inline-flex items-center gap-1 text-sm font-bold text-red-600">
                          <IndianRupee size={14} /> Collect ₹{order.amountToCollect.toLocaleString('en-IN')} on delivery
                        </p>
                      ) : (
                        <p className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                          <CheckCircle2 size={14} /> Already paid online
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                {!['DELIVERED', 'CANCELLED'].includes(order.orderStatus) && (
                  <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex flex-wrap items-center gap-2">
                    {order.orderStatus !== 'OUT_FOR_DELIVERY' ? (
                      <button
                        onClick={() => handleStartDelivery(order)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E72744] to-black text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60 transition"
                      >
                        <Truck size={15} /> Start Delivery (email OTP)
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveOrder(order)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E72744] to-black text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60 transition"
                      >
                        <PackageCheck size={15} /> Complete Delivery
                      </button>
                    )}
                    <button
                      onClick={() => { setFailingOrder(order); setFailReason('') }}
                      className="ml-auto inline-flex items-center gap-1.5 text-sm text-red-600 font-medium px-3 py-2 rounded-xl hover:bg-red-50 transition"
                    >
                      <XCircle size={15} /> Report Failed
                    </button>
                  </div>
                )}

                {order.orderStatus === 'DELIVERED' && (
                  <div className="bg-green-50 border-t border-green-100 px-5 py-3 flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 size={15} />
                    Delivered {order.actualDelivery ? `on ${formatDeliveryTime(order.actualDelivery)}` : ''}
                    {order.deliveryProof && <> · Proof: {order.deliveryProof.replace('+', ' + ')}</>}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>

      {activeOrder && (
        <CompleteDeliveryModal
          order={activeOrder}
          busy={actionLoading}
          onClose={() => setActiveOrder(null)}
          onConfirm={handleConfirmDelivery}
        />
      )}

      {failingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setFailingOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Report Failed Delivery</h3>
                <p className="text-sm text-gray-500">Order {failingOrder.orderNumber}</p>
              </div>
              <button onClick={() => setFailingOrder(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <textarea
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              rows={3}
              placeholder="e.g. Customer not available at address"
              className="w-full rounded-xl border border-gray-300 focus:border-[#E72744] focus:ring-2 focus:ring-[#E72744]/20 outline-none p-3 text-sm resize-none"
            />
            <button
              type="button"
              onClick={handleReportFailure}
              disabled={actionLoading}
              className="w-full bg-red-600 text-white font-semibold py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-60 transition"
            >
              {actionLoading ? 'Saving…' : 'Submit Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
