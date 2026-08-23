import React, { Suspense, lazy } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
// Toast styles must be global - without this, toasts render but stay invisible
import 'react-toastify/dist/ReactToastify.css'
import Footer from './components/pages/Footer'
import Navbar from './components/Navbar'

const Signup = lazy(() => import('./components/auth/Signup'))
const VerifyOtp = lazy(() => import('./components/auth/VerifyOtp'))
const Login = lazy(() => import('./components/auth/Login'))
const Profile = lazy(() => import('./components/auth/Profile'))
const Collection = lazy(() => import('./components/pages/Collection'))
const Contact = lazy(() => import('./components/pages/Contact'))
const About = lazy(() => import('./components/pages/About'))
const Home = lazy(() => import('./components/home/Home'))
const WishList = lazy(() => import('./components/pages/WishList'))
const NotFound = lazy(() => import('./components/pages/NotFound'))
const ReturnandExchnagePolicy = lazy(() => import('./components/policy/ReturnandExchnagePolicy'))
const ProductDetails = lazy(() => import('./components/products/ProductDetails'))
const Cart = lazy(() => import('./components/cart/Cart'))
const Address = lazy(() => import('./components/Address'))
const Order = lazy(() => import('./components/Order'))
const OrderSuccess = lazy(() => import('./components/order/OrderSuccess'))
const Invoice = lazy(() => import('./components/order/Invoice'))
const Checkout = lazy(() => import('./components/checkout/Checkout'))
const TrackingNumberFind = lazy(() => import('./components/trackingOrder/trackingNumberfind'))
const Wallet = lazy(() => import('./components/wallet/Wallet'))
const RiderLogin = lazy(() => import('./components/rider/RiderLogin'))
const RiderDashboard = lazy(() => import('./components/rider/RiderDashboard'))

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E72744]"></div>
  </div>
)

const App = () => {
  const location = useLocation()
  // Rider portal is a standalone experience - no store chrome
  const isRiderRoute = location.pathname.startsWith('/rider')

  return (
    <div>
      {!isRiderRoute && <Navbar />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path='/signup' element={<Signup />} />
          <Route path='/login' element={<Login />} />
          <Route path='/verifyOtp' element={<VerifyOtp />} />
          <Route path='/collections' element={<Collection />} />
          <Route path='/products/:id' element={<ProductDetails />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/about' element={<About />} />
          <Route path='/' element={<Home />} />
          <Route path='/wishlist' element={<WishList />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/addresses' element={<Address />} />
          <Route path='/wallet' element={<Wallet />} />
          <Route path='/orders' element={<Order />} />
          <Route path='/checkout' element={<Checkout />} />
          <Route path='/order-success/:id' element={<OrderSuccess />} />
          <Route path='/orders/:id' element={<OrderSuccess />} />
          <Route path='/invoice/:id' element={<Invoice />} />
          <Route path='/tracking-order' element={<TrackingNumberFind />} />
          <Route path='/rider' element={<RiderLogin />} />
          <Route path='/rider/dashboard' element={<RiderDashboard />} />
          <Route path='*' element={<NotFound />} />
          <Route path='/return-exchange-policy' element={<ReturnandExchnagePolicy />} />
        </Routes>
      </Suspense>

      {!isRiderRoute && <Footer />}
    </div>
  )
}

export default App
