import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './slices/cartSlice'
import wishlistReducer from './slices/wishlistSlice'
import authReducer from './slices/authSlice'
import addressReducer from './slices/addressSlice'
import paymentReducer from './slices/paymentSlice'
import walletReducer from './slices/walletSlice'
import riderReducer from './slices/riderSlice'
import productReducer from './slices/productSlice'
// ... other imports
import contactReducer from './slices/contactSlice'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
    auth: authReducer,
    address: addressReducer,
    payment: paymentReducer,
    wallet: walletReducer,
    rider: riderReducer,
    product: productReducer,
    contact: contactReducer
    // ... other reducers
  },
})

export default store
