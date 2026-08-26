
import config from '../config'

const makePlaceholder = (width = 300, height = 200, text = 'No Image') =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(Math.min(width, height) / 10)}" fill="#9ca3af">${text}</text></svg>`
  )

const PLACEHOLDER_IMG = makePlaceholder(300, 200, 'No Image')

export const getCloudinaryImageUrl = (image, cloudName = 'your-cloud-name') => {
  if (!image) return PLACEHOLDER_IMG;
  
  // Handle array of images
  if (Array.isArray(image)) {
    if (image.length === 0) return PLACEHOLDER_IMG;
    return processCloudinaryUrl(image[0], cloudName);
  }
  
  // Handle single image
  if (typeof image === 'string') {
    return processCloudinaryUrl(image, cloudName);
  }
  
  return PLACEHOLDER_IMG;
};

const processCloudinaryUrl = (url, cloudName) => {
  if (!url) return PLACEHOLDER_IMG;
  
  // If it's already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a Cloudinary public_id, construct the full URL
  if (!url.includes('http')) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${url}`;
  }
  
  return url;
};

// Optional: Add image transformations for optimization
export const getOptimizedCloudinaryUrl = (image, cloudName = 'your-cloud-name', width = 300, height = 200) => {
  const baseUrl = getCloudinaryImageUrl(image, cloudName);
  
  if (baseUrl.includes('cloudinary.com')) {
    // Add transformations for better performance
    return baseUrl.replace('/upload/', `/upload/w_${width},h_${height},c_fill,f_auto,q_auto/`);
  }
  
  return baseUrl;
};

export const getPlaceholderImage = (text = 'Image', width = 300, height = 200) => {
  return makePlaceholder(width, height, text.replace(/[^a-zA-Z0-9\s]/g, '') || 'Image')
}

export const createDataUrlPlaceholder = (text = 'Image', width = 300, height = 200) => {
  // Create a canvas element
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  // Fill background
  ctx.fillStyle = '#e5e7eb'
  ctx.fillRect(0, 0, width, height)
  
  // Add text
  ctx.fillStyle = '#6b7280'
  ctx.font = `${Math.min(width, height) / 8}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height / 2)
  
  return canvas.toDataURL()
}

export const processImageUrl = (imageUrl, fallbackText = 'Image') => {
  // Handle null/undefined case
  if (!imageUrl) {
    return getPlaceholderImage(fallbackText);
  }
  
  // Handle array of images
  if (Array.isArray(imageUrl)) {
    // If array has items, use the first one, otherwise use placeholder
    return imageUrl.length > 0 ? processImageUrl(imageUrl[0], fallbackText) : getPlaceholderImage(fallbackText);
  }
  
  // If it's already a valid URL, return it
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // If it's a relative path, construct the full URL
  const backendUrl = config.backendUrl
  return `${backendUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

export const handleImageError = (e, fallbackText = 'Image') => {
  // Prevent infinite loop
  if (e.target.src.includes('data:image')) {
    return
  }
  
  e.target.src = createDataUrlPlaceholder(fallbackText)
}
