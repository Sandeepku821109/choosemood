import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import BrandLoader from '../common/BrandLoader'
import {
  Wallet as WalletIcon,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react'
import {
  fetchWallet,
  createTopupOrder,
  verifyTopup,
  clearWalletError
} from '../../store/slices/walletSlice'
import { loadRazorpayScript } from '../../utils/razorpayService'
import SpinGame from './SpinGame'

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000]

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const Wallet = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {
    balance,
    totalAdded,
    totalSpent,
    transactions,
    loading,
    error,
    topupLoading,
    verifying
  } = useSelector(state => state.wallet || {})

  const [showTopupModal, setShowTopupModal] = useState(false)
  const [topupAmount, setTopupAmount] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  const isAuthenticated = !!(localStorage.getItem('authToken') || localStorage.getItem('token'))

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/wallet', message: 'Please login to view your wallet' } })
      return
    }
    dispatch(fetchWallet())
  }, [isAuthenticated, dispatch, navigate])

  useEffect(() => {
    if (error) {
      setMessage({ type: 'error', text: error })
      const timer = setTimeout(() => {
        dispatch(clearWalletError())
        setMessage({ type: '', text: '' })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const handleTopupSubmit = async () => {
    const amount = parseFloat(topupAmount)

    if (!amount || isNaN(amount) || amount < 10) {
      setMessage({ type: 'error', text: 'Minimum top-up amount is ₹10' })
      return
    }

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Please check your internet connection.')
      }

      // Step 1: Create order on backend
      const orderResult = await dispatch(createTopupOrder(amount)).unwrap()
      const orderData = orderResult.data

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'CHOOSEMOOD',
        description: `Add ₹${amount.toFixed(2)} to wallet`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
          contact: localStorage.getItem('userPhone') || ''
        },
        theme: { color: '#667eea' },
        modal: {
          ondismiss: () => {
            setMessage({ type: 'error', text: 'Payment cancelled' })
          }
        },
        handler: async (response) => {
          try {
            // Step 3: Verify payment on backend
            await dispatch(verifyTopup({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })).unwrap()

            setMessage({ type: 'success', text: `₹${amount.toFixed(2)} added to your wallet!` })
            setShowTopupModal(false)
            setTopupAmount('')
            dispatch(fetchWallet())
            setTimeout(() => setMessage({ type: '', text: '' }), 4000)
          } catch (verifyError) {
            setMessage({ type: 'error', text: verifyError || 'Payment verification failed' })
          }
        }
      }

      const razorpayInstance = new window.Razorpay(options)
      razorpayInstance.on('payment.failed', (response) => {
        setMessage({ type: 'error', text: response.error?.description || 'Payment failed' })
      })
      razorpayInstance.open()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || err || 'Failed to initiate top-up' })
    }
  }

  if (loading && transactions.length === 0) {
    return <BrandLoader label="Loading your wallet" fullScreen />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <WalletIcon className="w-7 h-7 text-[#E72744]" />
            My Wallet
          </h1>
          <p className="text-gray-500 text-sm mt-1">Use your wallet balance for faster checkout</p>
        </div>
        <button
          onClick={() => dispatch(fetchWallet())}
          className="p-2 text-gray-500 hover:text-[#E72744] hover:bg-[#FFF1F3] rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          message.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-[#E72744] to-[#0A0A0A] rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/85 text-sm font-medium">Available Balance</p>
            <p className="text-4xl sm:text-5xl font-bold mt-2">₹{Number(balance || 0).toFixed(2)}</p>
          </div>
          <button
            onClick={() => setShowTopupModal(true)}
            disabled={topupLoading}
            className="inline-flex items-center justify-center gap-2 bg-white text-[#C81E38] px-5 py-3 rounded-xl font-semibold hover:bg-[#FFF1F3] transition-colors shadow-md disabled:opacity-60"
          >
            {topupLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Add Money
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-200" />
            </div>
            <div>
              <p className="text-white/85 text-xs">Total Added</p>
              <p className="font-semibold">₹{Number(totalAdded || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/15 p-2 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-200" />
            </div>
            <div>
              <p className="text-white/85 text-xs">Total Used</p>
              <p className="font-semibold">₹{Number(totalSpent || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Spin Game */}
      <div className="mb-6">
        <SpinGame onError={(text) => setMessage({ type: 'error', text })} />
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Transaction History</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <WalletIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No transactions yet</p>
            <button
              onClick={() => setShowTopupModal(true)}
              className="mt-3 inline-flex items-center gap-1 text-[#E72744] hover:text-[#C81E38] font-medium"
            >
              <Plus className="w-4 h-4" /> Add money to get started
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {transactions.map((txn, index) => {
              const isCredit = txn.type === 'CREDIT'
              const isSuccess = txn.status !== 'PENDING' && txn.status !== 'FAILED'
              return (
                <li key={txn._id || index} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-full ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
                      {isCredit
                        ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        : <ArrowUpRight className="w-4 h-4 text-red-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {isCredit ? 'Money Added' : 'Money Spent'}
                        {!isSuccess && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            {txn.status}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {txn.description || txn.source} • {formatDate(txn.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                      {isCredit ? '+' : '-'}₹{Number(txn.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Bal: ₹{Number(txn.balanceAfter ?? 0).toFixed(2)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Top-up Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowTopupModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-[#E72744]" />
              Add Money to Wallet
            </h3>
            <p className="text-sm text-gray-500 mb-5">Powered by Razorpay • Min ₹10</p>

            {/* Preset amounts */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {PRESET_AMOUNTS.map(preset => (
                <button
                  key={preset}
                  onClick={() => setTopupAmount(String(preset))}
                  className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                    Number(topupAmount) === preset
                      ? 'border-[#E72744] bg-[#FFF1F3] text-[#C81E38]'
                      : 'border-gray-200 text-gray-700 hover:border-[#FF9DAC]'
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Amount</label>
            <div className="relative mb-5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                min="10"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="Enter amount"
                className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E72744] focus:border-transparent outline-none"
              />
            </div>

            <button
              onClick={handleTopupSubmit}
              disabled={topupLoading || verifying}
              className="w-full bg-[#E72744] text-white py-3 rounded-xl font-medium hover:bg-[#C81E38] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {(topupLoading || verifying) && <Loader2 className="w-4 h-4 animate-spin" />}
              {verifying ? 'Verifying Payment...' : topupLoading ? 'Creating Order...' : `Pay ₹${parseFloat(topupAmount || 0).toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Wallet
