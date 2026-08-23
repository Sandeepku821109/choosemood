import axios from 'axios'
import { backendUrl } from '../../config'
import { processImageUrl } from '../../utils/imageUtils'
import { useParams, useNavigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import {
  ArrowLeft, Printer, Mail, Phone, MapPin, CreditCard,
  Truck, CalendarDays, BadgeCheck, Hourglass, Package
} from 'lucide-react'
import BrandLoader from '../common/BrandLoader'

const formatINR = (n) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// ---------------------------------------------------------------------------
// Indian-format amount in words (for the invoice summary line)
// ---------------------------------------------------------------------------
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

const twoDigits = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`)

const amountInWords = (value) => {
  let n = Math.floor(Math.abs(Number(value) || 0))
  if (n === 0) return 'Zero Rupees Only'
  const parts = []
  const crore = Math.floor(n / 10000000); n %= 10000000
  const lakh = Math.floor(n / 100000); n %= 100000
  const thousand = Math.floor(n / 1000); n %= 1000
  const hundred = Math.floor(n / 100); n %= 100
  if (crore) parts.push(`${twoDigits(crore)} Crore`)
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`)
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`)
  if (hundred) parts.push(`${ONES[hundred]} Hundred`)
  if (n) parts.push(`${parts.length ? 'and ' : ''}${twoDigits(n)}`)
  return `${parts.join(' ')} Rupees Only`
}

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
    return <BrandLoader label="Preparing your invoice" fullScreen />
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

  const isRefunded = (order.paymentStatus || '').toUpperCase() === 'REFUNDED'
  const isCod = (order.paymentMethod || '').toUpperCase() === 'COD'
  const paid = !isCod && ((order.paymentMethod || '').toUpperCase().includes('RAZORPAY') ||
    (order.paymentMethod || '').toUpperCase() === 'WALLET' ||
    (order.paymentMethod || '').toUpperCase() === 'UPI') &&
    (order.paymentStatus || '').toUpperCase() === 'COMPLETED'

  const address = order.shippingAddress || {}
  const customer = order.user || {}
  const razorpayId = order.razorpayOrderId || order.paymentDetails?.razorpayOrderId

  return (
    <div className="bg-gradient-to-b from-gray-100 to-gray-200 min-h-screen py-8 print:bg-white print:py-0">
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
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      {/* Toolbar (screen only) */}
      <div className="max-w-[210mm] mx-auto mb-5 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm transition"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-[#E72744] to-black text-white rounded-xl px-5 py-2.5 shadow-md hover:opacity-90 transition"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      {/* A4 sheet */}
      <div className="invoice-sheet relative max-w-[210mm] mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden print:rounded-none print:shadow-none">
        {/* Certificate-style inner frame */}
        <div className="pointer-events-none absolute inset-3 rounded-xl border border-[#D4AF37]/40 z-20 print:hidden" aria-hidden="true" />

        {/* choosemood watermark */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
          <span
            className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 -rotate-[26deg] font-serif italic font-bold text-gray-900/[0.055] whitespace-nowrap leading-none"
            style={{ fontSize: '118px', letterSpacing: '-0.02em' }}
          >
            choosemood
          </span>
          <span className="absolute right-10 top-[30%] rotate-[-16deg] font-serif italic font-semibold text-gray-900/[0.07] text-3xl">choosemood</span>
          <span className="absolute left-12 bottom-[18%] rotate-[10deg] font-serif italic font-semibold text-gray-900/[0.06] text-2xl">choosemood</span>
        </div>

        {/* ------------------------------------------------ Header band */}
        <header className="relative z-10 bg-[#0b0b0d] px-10 py-9 text-white overflow-hidden print:bg-black">
          {/* Red glow accents */}
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(620px 220px at 12% 0%, rgba(231,39,68,.5), transparent 62%), radial-gradient(520px 240px at 92% 130%, rgba(231,39,68,.28), transparent 60%)' }}
          />
          {/* Gold crown line */}
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-90" />
          <div className="relative flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 ring-1 ring-[#D4AF37]/60 font-serif font-extrabold text-2xl">F</span>
              <div>
                <h1 className="font-serif text-[26px] font-bold tracking-wide leading-none">FLY STORE</h1>
                <p className="text-[10px] text-white/60 mt-2 tracking-[0.3em] uppercase">Fashion delivered fast</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-serif text-sm tracking-[0.5em] uppercase text-[#E7C873]">Tax Invoice</p>
              <p className="mt-2.5 inline-block bg-white/10 backdrop-blur rounded-lg px-3.5 py-1.5 font-mono font-bold text-sm ring-1 ring-[#D4AF37]/40">
                #{order.orderNumber || order._id}
              </p>
              <p className="text-[11px] text-white/60 mt-2 tabular-nums">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          <div className="relative mt-7 pt-3.5 border-t border-white/10 flex items-center justify-between">
            <p className="text-[10px] text-white/40 tracking-[0.25em] uppercase">Original for recipient</p>
            <p className="font-serif italic text-[13px] text-white/70">by choosemood</p>
          </div>
        </header>

        {/* ------------------------------------------------ Body */}
        <main className="relative z-10 px-10 py-9">
          {/* Meta cards */}
          <section className="grid grid-cols-3 gap-4 -mt-0">
            <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-4 border-t-2 border-t-[#D4AF37]/70">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A8842C] mb-1.5">
                <CalendarDays size={12} /> Invoice Date
              </p>
              <p className="text-sm font-semibold text-gray-800">{formatDate(order.createdAt)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-4 border-t-2 border-t-[#D4AF37]/70">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A8842C] mb-1.5">
                <CreditCard size={12} /> Payment
              </p>
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-2 flex-wrap">
                {(order.paymentMethod || '—').replace('+', ' + ')}
                {paid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                    <BadgeCheck size={11} /> PAID
                  </span>
                ) : isRefunded ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">REFUNDED</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold">
                    <Hourglass size={11} /> DUE
                  </span>
                )}
              </p>
              {razorpayId && (
                <p className="font-mono text-[9px] text-gray-400 mt-1 break-all">{razorpayId}</p>
              )}
            </div>
            <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-4 border-t-2 border-t-[#D4AF37]/70">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A8842C] mb-1.5">
                <Truck size={12} /> Tracking
              </p>
              <p className="text-sm font-semibold text-gray-800 break-all">{order.trackingNumber || 'Awaiting shipment'}</p>
            </div>
          </section>

          {/* Bill To / Ship To */}
          <section className="grid sm:grid-cols-2 gap-4 mt-7">
            <div className="rounded-xl border border-gray-100 border-l-2 border-l-[#D4AF37]/70 bg-white/80 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#A8842C] mb-2.5">Billed To</p>
              <p className="font-bold text-gray-900">{customer.name || address.fullName || '—'}</p>
              <div className="mt-1.5 space-y-1 text-[13px] text-gray-600">
                {customer.email && (
                  <p className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400 shrink-0" /> {customer.email}</p>
                )}
                {(customer.phoneNumber || address.phoneNumber) && (
                  <p className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400 shrink-0" /> {customer.phoneNumber || address.phoneNumber}</p>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 border-l-2 border-l-[#D4AF37]/70 bg-white/80 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#A8842C] mb-2.5">Shipped To</p>
              <p className="font-bold text-gray-900">{address.fullName || '—'}</p>
              <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-gray-600 leading-relaxed">
                <MapPin size={12} className="text-gray-400 mt-1 shrink-0" />
                <span>
                  {[address.addressLine1, address.addressLine2].filter(Boolean).join(', ')}
                  {(address.addressLine1 || address.addressLine2) && <br />}
                  {[address.city, address.state, address.pincode].filter(Boolean).join(' - ')}
                </span>
              </p>
              {!address.addressLine1 && !address.city && <p className="text-gray-400 text-[13px]">Address unavailable</p>}
            </div>
          </section>

          {/* Items */}
          <section className="mt-7 rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white text-left border-b-2 border-b-[#D4AF37]/70">
                  <th className="py-3 px-4 font-semibold w-10 text-xs">#</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wide">Item</th>
                  <th className="py-3 px-4 font-semibold text-center w-16 text-xs uppercase tracking-wide">Qty</th>
                  <th className="py-3 px-4 font-semibold text-right w-28 text-xs uppercase tracking-wide">Price</th>
                  <th className="py-3 px-4 font-semibold text-right w-32 text-xs uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-transparent">
                {(order.items || []).map((item, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="py-3 px-4 text-gray-400 tabular-nums">{String(i + 1).padStart(2, '0')}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={processImageUrl(Array.isArray(item.productImage) ? item.productImage[0] : item.productImage)}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-gray-100 bg-gray-50 shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                        <div>
                          <p className="font-medium text-gray-900 leading-snug">{item.productName}</p>
                          {item.size && <p className="text-xs text-gray-400 mt-0.5">Size: {item.size}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 tabular-nums">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-700 tabular-nums">{formatINR(item.price)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900 tabular-nums">
                      {formatINR((item.price || 0) * (item.quantity || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Totals + words */}
          <section className="mt-7 flex flex-col-reverse sm:flex-row justify-between gap-6">
            <div className="sm:max-w-[45%] text-[12px] leading-relaxed text-gray-500 self-end">
              <p className="font-semibold text-gray-700 mb-1">Amount in words:</p>
              <p className="italic">{amountInWords(order.totalAmount)}</p>
            </div>
            <div className="w-full sm:w-80 space-y-2 text-sm">
              <div className="rounded-xl border border-gray-100 border-t-2 border-t-[#D4AF37]/70 bg-gradient-to-b from-gray-50 to-white p-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatINR(order.subtotal)}</span>
                </div>
                {!!order.discount && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                    <span>-{formatINR(order.discount)}</span>
                  </div>
                )}
                {!!order.walletApplied && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Wallet balance</span>
                    <span>-{formatINR(order.walletApplied)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  {order.shippingCharges ? (
                    <span className="font-medium text-gray-900">{formatINR(order.shippingCharges)}</span>
                  ) : (
                    <span className="font-semibold text-emerald-600">FREE</span>
                  )}
                </div>
                {!!order.tax && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span className="font-medium text-gray-900">{formatINR(order.tax)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center bg-[#0b0b0d] text-white rounded-xl px-4 py-3.5 ring-1 ring-[#D4AF37]/60 print:bg-gray-900">
                <span className="font-serif uppercase tracking-[0.25em] text-[11px]">Grand Total</span>
                <span className="font-extrabold text-lg text-[#E7C873] tabular-nums">{formatINR(order.totalAmount)}</span>
              </div>
              {isCod && !paid && (
                <p className="text-[11px] text-amber-600 text-right font-medium">
                  Payable in cash on delivery
                </p>
              )}
            </div>
          </section>
        </main>

        {/* ------------------------------------------------ Footer */}
        <footer className="relative z-10 border-t border-[#D4AF37]/30 px-10 py-6 text-center text-xs text-gray-400 space-y-1.5">
          <p className="inline-flex items-center justify-center gap-2 font-semibold text-gray-600">
            <Package size={13} className="text-[#E72744]" /> Thank you for shopping with FLY STORE
          </p>
          <p>2 days replacement only, from the date of delivery.</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
          <p className="font-serif italic text-sm text-gray-500 pt-1">choosemood</p>
        </footer>
        {/* Accent strip */}
        <div className="h-1 bg-gradient-to-r from-[#D4AF37] via-black to-[#D4AF37] print:hidden" />
      </div>
    </div>
  )
}

export default Invoice
