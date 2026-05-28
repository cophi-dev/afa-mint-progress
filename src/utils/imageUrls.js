const IPFS_GATEWAY = 'https://ipfs.io/ipfs';

let imageCidsPromise = null;

const loadImageCids = async () => {
  if (!imageCidsPromise) {
    imageCidsPromise = import('../data/image_cids.json').then((module) => module.default);
  }
  return imageCidsPromise;
};

export const getAfaThumbnailUrl = (tokenId) => `/images/${tokenId}.webp`;

export const getAfaThumbnailFallbackUrl = (tokenId) => `/images/${tokenId}.png`;

export const getBaycThumbnailUrl = (tokenId) => `/bayc-images/${tokenId}.webp`;

export const getBaycThumbnailFallbackUrl = (tokenId) => `/bayc-images/${tokenId}.png`;

/** High-res IPFS URLs are only available for minted AFAs. Never call for unminted tokens. */
export const getAfaIpfsUrl = async (tokenId, isMinted) => {
  if (!isMinted) return null;

  const imageCids = await loadImageCids();
  const cid = imageCids[tokenId];
  return cid ? `${IPFS_GATEWAY}/${cid}` : null;
};

export const preloadImage = (url) => {
  if (!url) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = url;
  });
};
