import axios from 'axios'
import { backendUrl } from '../../config'
import { useParams, useNavigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react'

const formatINR = (n) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const Invoice = () => {
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const resp = await axios.get(`${backendUrl}/api/orders/${id}`, { headers })
        setOrder(resp.data.data || resp.data)
      } catch (error) {
        console.error('Failed to fetch order for invoice:', error)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchOrder()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E72744]" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-4">Invoice not available for this order.</p>
        <button onClick={() => navigate('/orders')} className="bg-[#E72744] text-white px-5 py-2 rounded-lg hover:bg-[#C81E38]">
          Back to Orders
        </button>
      </div>
    )
  }

  const isPaid =
    (order.paymentMethod || '').toUpperCase().includes('RAZORPAY') && (order.paymentStatus || '').toUpperCase() === 'COMPLETED'
  const isWalletPaid = (order.paymentMethod || '').toUpperCase() === 'WALLET'
  const paid = isPaid || isWalletPaid
  const address = order.shippingAddress || {}
  const customer = order.user || {}

  return (
    <div className="bg-gray-100 min-h-screen py-6 print:bg-white print:py-0">
      {/* Print styles: show ONLY the invoice sheet on paper */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-sheet, .invoice-sheet * { visibility: visible; }
          .invoice-sheet {
            position: absolute;
            left: 0; top: 0;
            width: 100%;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          @page { size: A4; margin: 14mm; }
        }
      `}</style>

      {/* Toolbar (screen only) */}
      <div className="max-w-[210mm] mx-auto mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm"
        >
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-sm font-semibold bg-[#E72744] text-white rounded-lg px-5 py-2.5 shadow-sm hover:bg-[#C81E38]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
          </svg>
          Print / Save as PDF
        </button>
      </div>

      {/* A4 sheet */}
      <div className="invoice-sheet relative max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg p-10 print:p-0 print:shadow-none">
        {/* Status stamp */}
        <div
          className={`absolute top-8 right-8 rotate-6 border-2 rounded px-3 py-1 text-xs font-extrabold uppercase tracking-widest ${
            paid ? 'border-green-600 text-green-600' : 'border-amber-600 text-amber-600'
          }`}
        >
          {paid ? 'Paid' : 'Payment Due'}
        </div>

        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-gray-900 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-11 h-11 bg-black text-white font-extrabold text-xl rounded">F</span>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">FLY STORE</h1>
                <p className="text-xs text-gray-500">Fashion delivered fast</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tracking-[0.2em] text-gray-400">INVOICE</p>
            <p className="text-sm font-mono font-semibold text-gray-700 mt-1">#{order.orderNumber || order._id}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-3 gap-6 py-6 border-b border-gray-200 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Invoice Date</p>
            <p className="font-medium text-gray-800">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Payment Method</p>
            <p className="font-medium text-gray-800">
              {(order.paymentMethod || '—').replace('+', ' + ')}
              {(order.paymentStatus || '').toUpperCase() === 'REFUNDED' && (
                <span className="ml-2 text-xs font-semibold text-red-600">(Refunded)</span>
              )}
            </p>
            {(order.razorpayOrderId || order.paymentDetails?.razorpayOrderId) && (
              <p className="font-mono text-[10px] text-gray-400 mt-0.5 break-all">
                {order.razorpayOrderId || order.paymentDetails?.razorpayOrderId}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Tracking No.</p>
            <p className="font-medium text-gray-800">{order.trackingNumber || 'Not shipped yet'}</p>
          </div>
        </div>

        {/* Bill To / Ship To */}
        <div className="grid grid-cols-2 gap-8 py-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Billed To</p>
            <p className="font-semibold text-gray-900">{customer.name || address.fullName || '—'}</p>
            {customer.email && <p className="text-gray-600">{customer.email}</p>}
            {(customer.phoneNumber || address.phoneNumber) && (
              <p className="text-gray-600">{customer.phoneNumber || address.phoneNumber}</p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Shipped To</p>
            <p className="font-semibold text-gray-900">{address.fullName || '—'}</p>
            <p className="text-gray-600 leading-relaxed">
              {[address.addressLine1, address.addressLine2].filter(Boolean).join(', ')}
              {address.addressLine1 && <br />}
              {[address.city, address.state, address.pincode].filter(Boolean).join(' - ')}
            </p>
            {!address.addressLine1 && !address.city && <p className="text-gray-400">Address unavailable</p>}
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm border-collapse mt-2">
          <thead>
            <tr className="bg-gray-900 text-white text-left">
              <th className="py-2.5 px-3 rounded-tl-md font-semibold w-8">#</th>
              <th className="py-2.5 px-3 font-semibold">Item</th>
              <th className="py-2.5 px-3 font-semibold text-center w-16">Qty</th>
              <th className="py-2.5 px-3 font-semibold text-right w-28">Price</th>
              <th className="py-2.5 px-3 font-semibold text-right rounded-tr-md w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2.5 px-3 text-gray-400">{i + 1}</td>
                <td className="py-2.5 px-3">
                  <p className="font-medium text-gray-800">{item.productName}</p>
                  {item.size && <p className="text-xs text-gray-400">Size: {item.size}</p>}
                </td>
                <td className="py-2.5 px-3 text-center text-gray-700">{item.quantity}</td>
                <td className="py-2.5 px-3 text-right text-gray-700">{formatINR(item.price)}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-gray-900">
                  {formatINR((item.price || 0) * (item.quantity || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mt-6">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-800">{formatINR(order.subtotal)}</span>
            </div>
            {!!order.discount && (
              <div className="flex justify-between text-emerald-600">
                <span>Coupon{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                <span>-{formatINR(order.discount)}</span>
              </div>
            )}
            {!!order.walletApplied && (
              <div className="flex justify-between text-emerald-600">
                <span>Wallet balance</span>
                <span>-{formatINR(order.walletApplied)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              {order.shippingCharges ? (
                <span className="font-medium text-gray-800">{formatINR(order.shippingCharges)}</span>
              ) : (
                <span className="font-semibold text-emerald-600">FREE</span>
              )}
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span className="font-medium text-gray-800">{formatINR(order.tax)}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-900 text-white rounded-md px-3 py-2.5 mt-2">
              <span className="font-semibold uppercase tracking-wide text-xs">Grand Total</span>
              <span className="font-bold text-base">{formatINR(order.totalAmount)}</span>
            </div>
            {!paid && !!order.walletApplied && (
              <p className="text-[11px] text-gray-400 text-right">
                Payable on delivery: {formatINR(order.totalAmount)}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-5 border-t border-gray-200 text-center text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-600">Thank you for shopping with FLY STORE!</p>
          <p>2 days replacement only from the date of delivery.</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </div>
  )
}

export default Invoice
