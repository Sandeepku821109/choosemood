import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import axios from 'axios'
import { backendUrl } from '../config'
import { fetchCart } from '../store/slices/cartSlice'
import { fetchWishlistItems } from '../store/slices/wishlistSlice'
import { 
  Home, 
  Package, 
  Info, 
  Mail, 
  Heart, 
  ShoppingCart, 
  ChevronDown, 
  LogIn, 
  UserPlus, 
  Menu,
  X,
  Settings,
  ShoppingBag,
  LogOut,
  Wallet as WalletIcon,
  Sparkles,
  Truck,
  RefreshCcw,
  BadgeCheck
} from 'lucide-react'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Get cart and wishlist counts from Redux store with fallbacks
  const cartState = useSelector(state => state.cart || {})
  const wishlistState = useSelector(state => state.wishlist || {})
  
  const cartItems = cartState.items || []
  const wishlistItems = wishlistState.items || []
  
  // Calculate cart count (total quantity of all items)
  const cartCount = cartItems.reduce((total, item) => {
    return total + (item.quantity || 1)
  }, 0)
  
  // Calculate wishlist count (number of unique items)
  const wishlistCount = wishlistItems.length

  // Update the checkAuthentication function
  const checkAuthentication = () => {
    const authToken = localStorage.getItem('authToken')
    const token = localStorage.getItem('token')
    const userEmail = localStorage.getItem('userEmail')
    const storedUserName = localStorage.getItem('userName')

    if (authToken || token || userEmail) {
      setIsAuthenticated(true)
      const displayName = storedUserName || userEmail?.split('@')[0] || 'User'
      setUserName(displayName)

      // Ensure app data is refreshed when auth present
      dispatch(fetchCart())
      dispatch(fetchWishlistItems())

      // Signal other parts of the app (Profile, Orders, etc.) to refresh
      window.dispatchEvent(new Event('auth-change'))
      window.dispatchEvent(new Event('refresh-user-data'))
    } else {
      setIsAuthenticated(false)
      setUserName('')
    }
  }

  useEffect(() => {
    checkAuthentication()

    const handleAuthRelatedChange = () => {
      checkAuthentication()
    }

    window.addEventListener('auth-change', handleAuthRelatedChange)
    window.addEventListener('username-updated', handleAuthRelatedChange)
    window.addEventListener('storage', handleAuthRelatedChange)

    return () => {
      window.removeEventListener('auth-change', handleAuthRelatedChange)
      window.removeEventListener('username-updated', handleAuthRelatedChange)
      window.removeEventListener('storage', handleAuthRelatedChange)
    }
  }, [dispatch])

  // Fetch cart and wishlist when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart())
      dispatch(fetchWishlistItems())
    }
  }, [isAuthenticated, dispatch])

  // Elevate navbar on scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    // Clear httpOnly cookie on backend (fire-and-forget)
    axios.post(`${backendUrl}/api/users/logout`).catch(() => {})

    localStorage.removeItem('authToken')
    localStorage.removeItem('token')
    localStorage.removeItem('hasToken')
    localStorage.removeItem('hasAuthToken')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    localStorage.removeItem('userId')
    localStorage.removeItem('isLoggedIn')
    try { sessionStorage.clear() } catch(e) {
      console.log(e)
    }

    setIsAuthenticated(false)
    setUserName('')
    setIsProfileOpen(false)

    dispatch(fetchCart())
    dispatch(fetchWishlistItems())

    window.dispatchEvent(new Event('auth-change'))
    window.dispatchEvent(new Event('user-logged-out'))

    navigate('/login')
    setTimeout(() => window.location.reload(), 250)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileOpen])

  // Add useEffect to listen for username changes
  useEffect(() => {
    const handleUserNameChange = () => {
        const newUserName = localStorage.getItem('userName')
        if (newUserName) {
            setUserName(newUserName)
        }
    }

    window.addEventListener('username-updated', handleUserNameChange)
    
    return () => {
        window.removeEventListener('username-updated', handleUserNameChange)
    }
}, [])

  const navLinks = [
    { to: '/', label: 'Home', Icon: Home },
    { to: '/collections', label: 'Collections', Icon: Package },
    { to: '/about', label: 'About', Icon: Info },
    { to: '/contact', label: 'Contact', Icon: Mail },
  ]

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement Bar */}
      <div className="bg-ink-950 text-white/90 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 sm:gap-10 h-9 text-[11px] sm:text-xs tracking-[0.18em] uppercase font-medium">
            <span className="hidden sm:flex items-center gap-1.5"><Truck size={13} className="text-[#E72744]" /> Free shipping over ₹999</span>
            <span className="flex items-center gap-1.5"><RefreshCcw size={13} className="text-[#E72744]" /> 2-day easy returns</span>
            <span className="hidden md:flex items-center gap-1.5"><BadgeCheck size={13} className="text-[#E72744]" /> 100% authentic</span>
            <span className="flex sm:hidden items-center gap-1.5"><Sparkles size={13} className="text-[#E72744]" /> New arrivals weekly</span>
          </div>
        </div>
      </div>

      <nav className={`glass-light border-b transition-all duration-500 ${isScrolled ? 'border-ink-200/70 shadow-[0_12px_32px_-16px_rgba(20,17,15,0.25)]' : 'border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            
            {/* Logo */}
            <div className="flex-shrink-0">
              <NavLink to="/" className="group flex items-center gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-ink-950 rounded-sm flex items-center justify-center ring-1 ring-gold-500/40 group-hover:ring-gold-400 transition-all duration-300 shadow-lg">
                  <span className="font-serif text-gold-300 font-bold text-base sm:text-xl tracking-tight">CM</span>
                </div>
                <span className="font-serif text-lg sm:text-2xl font-semibold text-ink-900 tracking-wide">
                  CHOOSE<span className=" text-gold-600">MOOD</span>
                </span>
              </NavLink>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-9">
              {navLinks.map((link) => (
                <NavLink 
                  key={link.to}
                  to={link.to} 
                  className={({ isActive }) => 
                    `relative flex items-center gap-2 py-2 text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors duration-300 ${
                      isActive ? 'text-gold-700' : 'text-ink-600 hover:text-ink-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <link.Icon size={15} strokeWidth={isActive ? 2.4 : 1.8} />
                      <span>{link.label}</span>
                      <span className={`absolute -bottom-0.5 left-0 h-px bg-gradient-to-r from-gold-600 to-gold-300 transition-all duration-500 ${isActive ? 'w-full' : 'w-0'}`}></span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              
              {/* Wishlist */}
              <NavLink 
                to="/wishlist"
                className={({ isActive }) => 
                  `relative p-2.5 rounded-full transition-all duration-300 ${
                    isActive 
                      ? 'bg-gold-50 text-gold-700 ring-1 ring-gold-300' 
                      : 'text-ink-600 hover:text-gold-700 hover:bg-gold-50 hover:ring-1 hover:ring-gold-200'
                  }`
                }
              >
                <Heart size={19} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 min-w-[18px] px-1 flex items-center justify-center bg-gradient-to-br from-gold-500 to-gold-700 ring-2 ring-cream">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </NavLink>

              {/* Cart */}
              <NavLink 
                to="/cart"
                className={({ isActive }) => 
                  `relative p-2.5 rounded-full transition-all duration-300 ${
                    isActive 
                      ? 'bg-ink-900 text-gold-300' 
                      : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100'
                  }`
                }
              >
                <ShoppingCart size={19} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 min-w-[18px] px-1 flex items-center justify-center bg-ink-950 ring-2 ring-cream">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </NavLink>

              {/* Authentication */}
              {isAuthenticated ? (
                <div className="relative profile-dropdown">
                  <button
                    onClick={toggleProfile}
                    className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-full text-ink-700 hover:bg-white hover:shadow-md transition-all duration-300 ring-1 ring-transparent hover:ring-ink-200"
                  >
                    <div className="w-8 h-8 rounded-full p-px bg-gradient-to-br from-gold-400 to-gold-700">
                      <div className="w-full h-full bg-ink-950 rounded-full flex items-center justify-center">
                        <span className="font-serif text-gold-300 font-semibold text-sm">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <span className="hidden xl:block font-medium text-sm max-w-[110px] truncate">{userName}</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-60 glass-light rounded-2xl shadow-[0_24px_64px_-16px_rgba(20,17,15,0.35)] ring-1 ring-ink-200/70 overflow-hidden animate-slide-up">
                      <div className="px-5 py-4 bg-ink-950">
                        <p className="font-serif text-base text-ink-50">{userName}</p>
                        <p className="text-xs text-gold-300/80 truncate mt-0.5">{localStorage.getItem('userEmail') || 'user@example.com'}</p>
                      </div>
                      <div className="py-2">
                        <NavLink 
                          to="/profile" 
                          className="flex items-center gap-3 px-5 py-2.5 text-sm text-ink-700 hover:bg-gold-50 hover:text-gold-800 transition-colors duration-300"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings size={16} strokeWidth={1.8} />
                          <span>Profile Settings</span>
                        </NavLink>
                        <NavLink 
                          to="/wallet" 
                          className="flex items-center gap-3 px-5 py-2.5 text-sm text-ink-700 hover:bg-gold-50 hover:text-gold-800 transition-colors duration-300"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <WalletIcon size={16} strokeWidth={1.8} />
                          <span>My Wallet</span>
                        </NavLink>
                        <NavLink 
                          to="/orders" 
                          className="flex items-center gap-3 px-5 py-2.5 text-sm text-ink-700 hover:bg-gold-50 hover:text-gold-800 transition-colors duration-300"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <ShoppingBag size={16} strokeWidth={1.8} />
                          <span>My Orders</span>
                        </NavLink>
                        <div className="gold-line mx-5 my-1"></div>
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left px-5 py-2.5 text-sm text-red-700/80 hover:bg-red-50 hover:text-red-700 transition-colors duration-300 flex items-center gap-3"
                        >
                          <LogOut size={16} strokeWidth={1.8} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <NavLink 
                    to="/login" 
                    className="btn-luxury relative flex items-center gap-2 px-4 py-2 text-[13px] font-semibold uppercase tracking-wider text-ink-700 hover:text-gold-800 rounded-full transition-all duration-300"
                  >
                    <LogIn size={16} />
                    <span>Login</span>
                  </NavLink>
                  <NavLink 
                    to="/signup" 
                    className="btn-luxury relative flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wider text-ink-50 bg-ink-950 hover:bg-ink-800 rounded-full shadow-lg transition-all duration-300 ring-1 ring-ink-950"
                  >
                    <UserPlus size={16} />
                    <span>Sign Up</span>
                  </NavLink>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={toggleMenu}
                aria-label="Toggle menu"
                className="lg:hidden p-2.5 text-ink-700 hover:text-gold-800 hover:bg-gold-50 rounded-full transition-all duration-300"
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="lg:hidden pb-5 pt-2 border-t border-ink-200/60 animate-slide-up">
              <div className="flex flex-col space-y-1 pt-3">
                {navLinks.map((link) => (
                  <NavLink 
                    key={link.to}
                    to={link.to} 
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium uppercase tracking-[0.12em] transition-colors duration-300 ${
                        isActive 
                          ? 'bg-gold-50 text-gold-800 ring-1 ring-gold-200' 
                          : 'text-ink-600 hover:bg-white hover:text-ink-900'
                      }`
                    }
                    onClick={closeMenu}
                  >
                    <link.Icon size={18} strokeWidth={1.8} />
                    <span>{link.label}</span>
                  </NavLink>
                ))}

                {/* Mobile Authentication Section */}
                {isAuthenticated ? (
                  <div className="mt-3 rounded-2xl overflow-hidden ring-1 ring-ink-200/70">
                    <div className="bg-ink-950 px-5 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full p-px bg-gradient-to-br from-gold-400 to-gold-700">
                        <div className="w-full h-full bg-ink-900 rounded-full flex items-center justify-center">
                          <span className="font-serif text-gold-300 font-bold">
                            {userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif text-sm text-ink-50 truncate">{userName}</p>
                        <p className="text-xs text-gold-300/80 truncate">{localStorage.getItem('userEmail') || 'user@example.com'}</p>
                      </div>
                    </div>
                    <div className="bg-white p-2 space-y-0.5">
                      <NavLink 
                        to="/profile" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-gold-50 hover:text-gold-800 rounded-xl transition-colors duration-300"
                        onClick={closeMenu}
                      >
                        <Settings size={17} strokeWidth={1.8} />
                        <span>Profile Settings</span>
                      </NavLink>
                      <NavLink 
                        to="/wallet" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-gold-50 hover:text-gold-800 rounded-xl transition-colors duration-300"
                        onClick={closeMenu}
                      >
                        <WalletIcon size={17} strokeWidth={1.8} />
                        <span>My Wallet</span>
                      </NavLink>
                      <NavLink 
                        to="/orders" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-gold-50 hover:text-gold-800 rounded-xl transition-colors duration-300"
                        onClick={closeMenu}
                      >
                        <ShoppingBag size={17} strokeWidth={1.8} />
                        <span>My Orders</span>
                      </NavLink>
                      <button 
                        onClick={() => {
                          handleLogout()
                          closeMenu()
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-700/80 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors duration-300 flex items-center gap-3"
                      >
                        <LogOut size={17} strokeWidth={1.8} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <NavLink 
                      to="/login" 
                      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-ink-800 ring-1 ring-ink-300 rounded-full hover:bg-white transition-colors duration-300"
                      onClick={closeMenu}
                    >
                      <LogIn size={17} />
                      <span>Login</span>
                    </NavLink>
                    <NavLink 
                      to="/signup" 
                      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-cream bg-ink-950 rounded-full shadow-md hover:bg-ink-800 transition-colors duration-300"
                      onClick={closeMenu}
                    >
                      <UserPlus size={17} />
                      <span>Sign Up</span>
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
