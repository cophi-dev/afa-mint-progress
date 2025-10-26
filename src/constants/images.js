// Optimized placeholder image - uses actual image file instead of base64 data URL
// This avoids performance bottlenecks when 10k cells reference the same base64 string
// Using face.png as requested - the image the user actually wants

export const PLACEHOLDER_IMAGE_URL = '/face.png';

// Legacy support - keeping the old name for compatibility  
export const PLACEHOLDER_DATA_URL = PLACEHOLDER_IMAGE_URL;