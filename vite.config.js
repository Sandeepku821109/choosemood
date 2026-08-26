
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.BACKEND_URL || ''),
    'import.meta.env.VITE_RAZORPAY_KEY_ID': JSON.stringify(process.env.RAZORPAY_KEY_ID || ''),
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux'],
          'ui-libs': ['framer-motion', 'swiper', 'lucide-react', 'react-toastify', 'react-hot-toast', 'react-inner-image-zoom'],
          pdf: ['jspdf']
        }
      }
    }
  }
})
