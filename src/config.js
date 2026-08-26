const config = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  cloudinaryCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  cloudinaryBase: import.meta.env.VITE_CLOUDINARY_BASE || '',
  companyName: import.meta.env.VITE_COMPANY_NAME || 'FlyStore',
}

// Derive cloudinary base URL from cloud name if not explicitly set
if (!config.cloudinaryBase && config.cloudinaryCloudName) {
  config.cloudinaryBase = `https://res.cloudinary.com/${config.cloudinaryCloudName}/image/upload`
}

export const backendUrl = config.backendUrl
export default config
