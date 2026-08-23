import Signup from './components/auth/Signup'
import Collection from './components/pages/Collection'
import Contact from './components/pages/Contact'
import { Route, Routes } from 'react-router-dom'
import VerifyOtp from './components/auth/VerifyOtp'
import Login from './components/auth/Login'
import ProductDetails from './components/products/ProductDetails'
import About from './components/pages/About'
import Footer from './components/pages/Footer'
import Navbar from './components/Navbar'
import { ToastContainer } from 'react-toastify'
import Home from './components/home/Home'
import WishList from './components/pages/WishList'
import Cart from './components/cart/Cart'
import Profile from './components/auth/Profile'
import Address from './components/Address'
import Order from './components/Order'

import OrderSuccess from './components/order/OrderSuccess'
import Invoice from './components/order/Invoice'
import Checkout from './components/checkout/Checkout'
import NotFound from './components/pages/NotFound'
import TrackingNumberFind from './components/trackingOrder/trackingNumberfind'
import ReturnandExchnagePolicy from './components/policy/ReturnandExchnagePolicy'
import Wallet from './components/wallet/Wallet'

export const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'


const App = () => {
  return (
    <div>
      <Navbar />
      <ToastContainer />
      <Routes>
        <Route path='/signup' element={<Signup />} />
        <Route path='/login' element={<Login />} />
        <Route path='/verifyOtp' element={<VerifyOtp />} />
        <Route path='/collections' element={<Collection />} />
        <Route path='/products/:id' element={<ProductDetails />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/about' element={<About />} />
        <Route path='/' element={<Home />}  />
        <Route path='/wishlist' element={<WishList />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/profile' element={<Profile/>} />
        <Route path='/addresses' element={<Address />} />
        <Route path='/wallet' element={<Wallet />} />
        <Route path='/orders' element={<Order />} />
        <Route path='/checkout' element={<Checkout />} />
        <Route path='/order-success/:id' element={<OrderSuccess />} />
        <Route path='/orders/:id' element={<OrderSuccess />} />
        <Route path='/invoice/:id' element={<Invoice />} />
        <Route path='/tracking-order' element={<TrackingNumberFind />} />
        <Route path='*' element={<NotFound />} />
        <Route path='/return-exchange-policy' element={<ReturnandExchnagePolicy />} />
       
      </Routes>

      <Footer />
    </div>
  )
}

export default App