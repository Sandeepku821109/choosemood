
import React from 'react'

const OrderStatus = ({ paymentMethod, paymentStatus, orderStatus }) => {
  // Determine if order should show as prepaid
  const isPrepaid = (paymentMethod === 'razorpay' && paymentStatus === 'completed') || orderStatus === 'prepaid'
  
  const getStatusConfig = () => {
    if (isPrepaid) {
      return {
        text: 'Prepaid',
        color: 'text-green-600 bg-green-100 border-green-200',
        icon: '✓'
      }
    } else if (paymentMethod === 'cod') {
      return {
        text: 'Cash on Delivery',
        color: 'text-[#E72744] bg-orange-100 border-orange-200',
        icon: '💰'
      }
    } else if (paymentStatus === 'pending') {
      return {
        text: 'Payment Pending',
        color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
        icon: '⏳'
      }
    } else {
      return {
        text: orderStatus || 'Pending',
        color: 'text-gray-600 bg-gray-100 border-gray-200',
        icon: '📋'
      }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
      <span>{statusConfig.icon}</span>
      {statusConfig.text}
    </span>
  )
}

export default OrderStatus
