// Optimized placeholder image - uses actual image file instead of base64 data URL
// This avoids performance bottlenecks when 10k cells reference the same base64 string
// face.png works reliably, we'll optimize Safari mobile loading differently

export const PLACEHOLDER_IMAGE_URL = '/face.png';

// Legacy support - keeping the old name for compatibility
export const PLACEHOLDER_DATA_URL = PLACEHOLDER_IMAGE_URL;