import React from 'react'
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Shield,
  Truck,
} from 'lucide-react'

const Footer = () => {
  const companyName = import.meta.env.VITE_COMPANY_NAME || 'FlyStore'

  const socialLinks = [
    { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61582363674558', Icon: Facebook },
    { name: 'Twitter', url: 'https://x.com/CHOOSEMOOD9120', Icon: Twitter },
    { name: 'Instagram', url: 'https://www.instagram.com/choosemood27/', Icon: Instagram },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/choose-mood-53b53738a/', Icon: Linkedin },
    { name: 'YouTube', url: 'https://www.youtube.com/channel/yourchannel', Icon: Youtube }
  ]

  return (
    <footer className="bg-ink-950 text-ink-200 relative overflow-hidden">
      {/* Ambient gold glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-gold-600/8 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-10 relative">
        {/* Brand strip */}
        <div className="flex flex-col items-center text-center mb-14 sm:mb-20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-ink-900 rounded-sm flex items-center justify-center ring-1 ring-gold-500/40">
              <span className="font-serif text-gold-300 font-bold text-lg tracking-tight">CM</span>
            </div>
            <span className="font-serif text-2xl sm:text-3xl font-semibold text-ink-50 tracking-wide">
              CHOOSE<span className="italic text-gold-400">MOOD</span>
            </span>
          </div>
          <p className="text-ink-400 text-sm max-w-md leading-relaxed font-light">
            Your trusted online shopping destination. High-quality products and secure payments.
          </p>
          <div className="gold-line w-40 mt-6"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Follow + Trust */}
          <div className="space-y-7">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.28em] text-gold-300/90 mb-4">Follow Us</h4>
              <div className="flex flex-wrap gap-2.5">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 ring-1 ring-white/10 text-ink-300 hover:text-gold-300 hover:bg-white/10 hover:ring-gold-500/40 transition-all duration-300"
                    aria-label={social.name}
                    title={social.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.Icon size={17} strokeWidth={1.7} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.28em] text-gold-300/90 mb-4">Why Choose Us</h4>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5 text-ink-300">
                  <Shield size={15} className="text-gold-400" />
                  <span className="text-xs font-medium tracking-wide">Secure Shopping</span>
                </div>
                <div className="flex items-center gap-2.5 text-ink-300">
                  <Truck size={15} className="text-gold-400" />
                  <span className="text-xs font-medium tracking-wide">Fast Delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.28em] text-gold-300/90 mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {['Home', 'Collections', 'About Us', 'Contact', 'Wishlist'].map((link) => {
                const path = link === 'Home' ? '/' : `/${link.toLowerCase().replace(' ', '-')}`;
                return (
                  <li key={link}>
                    <a href={path} className="group inline-flex items-center gap-2.5 text-ink-400 hover:text-gold-300 transition-colors duration-300 text-sm">
                      <span className="w-3 h-px bg-ink-700 group-hover:bg-gold-400 group-hover:w-5 transition-all duration-300"></span>
                      {link}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.28em] text-gold-300/90 mb-5">Customer Service</h4>
            <ul className="space-y-3">
              {[
                { label: 'Help Center', path: '/contact' },
                { label: 'Returns & Exchanges', path: '/return-exchange-policy' },
                { label: 'Track Your Order', path: '/tracking-order' }
              ].map(({ label, path }) => (
                <li key={label}>
                  <a href={path} className="group inline-flex items-center gap-2.5 text-ink-400 hover:text-gold-300 transition-colors duration-300 text-sm">
                    <span className="w-3 h-px bg-ink-700 group-hover:bg-gold-400 group-hover:w-5 transition-all duration-300"></span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.28em] text-gold-300/90 mb-5">Contact Info</h4>
            <div className="space-y-5">
              <a href="tel:+919570523147" className="flex items-start gap-3 group">
                <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-white/5 ring-1 ring-white/10 flex items-center justify-center group-hover:ring-gold-500/40 transition-all duration-300">
                  <Phone size={15} className="text-gold-400" />
                </div>
                <div>
                  <p className="text-ink-500 text-[11px] uppercase tracking-widest">Call Us</p>
                  <p className="text-ink-200 text-sm mt-0.5 group-hover:text-gold-300 transition-colors duration-300">+91 9570523147</p>
                </div>
              </a>

              <a href="mailto:support@choosemood.com" className="flex items-start gap-3 group">
                <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-white/5 ring-1 ring-white/10 flex items-center justify-center group-hover:ring-gold-500/40 transition-all duration-300">
                  <Mail size={15} className="text-gold-400" />
                </div>
                <div>
                  <p className="text-ink-500 text-[11px] uppercase tracking-widest">Email Us</p>
                  <p className="text-ink-200 text-sm mt-0.5 group-hover:text-gold-300 transition-colors duration-300 break-all">support@choosemood.com</p>
                </div>
              </a>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
                  <MapPin size={15} className="text-gold-400" />
                </div>
                <div>
                  <p className="text-ink-500 text-[11px] uppercase tracking-widest">Visit Us</p>
                  <p className="text-ink-400 text-xs leading-relaxed mt-0.5">
                    Makan No. 219 ward No. 16, Kanya Madhya vidyalay, Ramgarh, AddressLine2, Addressline3 <br/> 821110, India, SANDEEP KUMAR GUPTA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-14 pt-8 border-t border-white/8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-ink-500 text-xs tracking-wide">
              &copy; {new Date().getFullYear()} <span className="text-ink-300">{companyName}</span>. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-x-7 gap-y-2">
              <a href="/privacy" className="text-ink-500 hover:text-gold-300 text-xs tracking-wide transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="/terms" className="text-ink-500 hover:text-gold-300 text-xs tracking-wide transition-colors duration-300">
                Terms of Service
              </a>
              <a href="/cookies" className="text-ink-500 hover:text-gold-300 text-xs tracking-wide transition-colors duration-300">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
