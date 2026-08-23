import React from 'react'

const PolicyCard = ({ title, children, icon }) => (
  <div className="bg-white shadow-sm rounded-lg p-6 border">
    <div className="flex items-start space-x-4">
      <div className="flex-none text-[#E72744]">{icon}</div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="mt-3 text-sm text-gray-600 space-y-2">{children}</div>
      </div>
    </div>
  </div>
)

const ReturnandExchnagePolicy = () => {
  return (
    <div className="max-w-4xl mx-auto my-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Return & Exchange Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Simple, fair and fast — 2 day return & exchange window.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PolicyCard
          title="Return Policy (2 Days)"
          icon={
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 7v7a4 4 0 004 4h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 7h-6l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="7.5" cy="9.5" r="0.5" fill="currentColor"/>
            </svg>
          }
        >
          <ul className="list-disc pl-5">
            <li>Returns accepted within 2 calendar days from delivery date.</li>
            <li>Item must be unused, unwashed and in original packaging with tags attached.</li>
            <li>Proof of purchase or order number required.</li>
          </ul>

          <div className="mt-3">
            <p className="font-medium text-gray-800">Refund</p>
            <p className="text-sm text-gray-600">Once we receive and inspect the item refunds are processed within 5–7 business days to the original payment method.</p>
          </div>

          <div className="mt-3">
            <p className="font-medium text-gray-800">How to return</p>
            <ol className="list-decimal pl-5 text-sm text-gray-600">
              <li>Open the Orders → Select order → Click "Return".</li>
              <li>Choose reason, attach photos if applicable and request pickup or drop-off.</li>
              <li>Track return status in your account.</li>
            </ol>
          </div>
        </PolicyCard>

        <PolicyCard
          title="Exchange Policy (2 Days)"
          icon={
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M21 15V9a4 4 0 00-4-4H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 9v6a4 4 0 004 4h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 7l-2 2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          <ul className="list-disc pl-5">
            <li>Exchanges available only within 2 calendar days of delivery.</li>
            <li>Exchange subject to stock availability for the requested size/color.</li>
            <li>Item must meet the same condition rules as returns (unused, tags, original packaging).</li>
          </ul>

          <div className="mt-3">
            <p className="font-medium text-gray-800">Process</p>
            <p className="text-sm text-gray-600">Request an exchange from your Orders page. If approved we’ll ship the replacement after we receive the original item.</p>
          </div>

          <div className="mt-3">
            <p className="font-medium text-gray-800">Charges</p>
            <p className="text-sm text-gray-600">If the replacement costs more, you will be prompted to pay the difference. If it costs less, we will refund the difference.</p>
          </div>
        </PolicyCard>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900">Exceptions & Notes</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li>Final sale items, hygiene products and personalized goods are not eligible unless defective.</li>
          <li>Damage or defect claims must be reported within 2 days with clear photos and the original packaging.</li>
          <li>Original shipping charges are non-refundable unless the item is defective or we made an error.</li>
          <li>We reserve the right to refuse returns/exchanges that do not meet policy conditions.</li>
        </ul>

        {/* Damaged / Defective items — clear user-facing guidance */}
        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded">
          <h3 className="text-sm font-semibold text-red-700">Damaged or Defective Items</h3>
          <p className="mt-2 text-sm text-red-600">
            If you receive an item that is damaged or defective, please report it within 2 days of delivery.
            Provide clear photos of the damage and packaging when you request a return or exchange. Approved
            defective returns are covered and will be refunded or exchanged per the process above.
          </p>
          <p className="mt-2 text-sm text-gray-700 font-medium">Not eligible:</p>
          <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
            <li>Items that have been intentionally damaged, altered, tampered with, or misused after delivery.</li>
            <li>Products showing clear signs of wear, washing, or use that were not present on delivery.</li>
            <li>Claims without supporting photos or proof may be declined.</li>
          </ul>
        </div>

        <div className="mt-4 border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-700"><strong>Need help?</strong> Contact our support team.</p>
            <p className="text-sm text-gray-500">Email: <a href="mailto:support@example.com" className="text-[#E72744]">support@example.com</a> • Phone: <a href="tel:+10000000000" className="text-[#E72744]">+1 000 000 0000</a></p>
          </div>

          <div className="flex space-x-3">
            <a
              href="/contact"
              className="inline-block px-4 py-2 bg-[#E72744] text-white rounded-md hover:bg-[#C81E38] text-sm"
            >
              Contact Support
            </a>
            <a
              href="/orders"
              className="inline-block px-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              View Orders
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReturnandExchnagePolicy