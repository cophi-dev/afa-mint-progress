// Optimized placeholder image - uses actual image file instead of base64 data URL
// This avoids performance bottlenecks when 10k cells reference the same base64 string
// Use the existing placeholder.png which is smaller and more reliable

export const PLACEHOLDER_IMAGE_URL = '/placeholder.png';

// Legacy support - keeping the old name for compatibility  
export const PLACEHOLDER_DATA_URL = PLACEHOLDER_IMAGE_URL;