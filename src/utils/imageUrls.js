import { preloadImageCached } from './imageCache';

const IPFS_GATEWAYS = [
  process.env.REACT_APP_IPFS_GATEWAY,
  'https://nftstorage.link/ipfs',
  'https://w3s.link/ipfs',
  'https://dweb.link/ipfs',
  'https://ipfs.io/ipfs',
].filter(Boolean);

const uniqueGateways = [...new Set(IPFS_GATEWAYS)];

let imageCidsPromise = null;

const loadImageCids = async () => {
  if (!imageCidsPromise) {
    imageCidsPromise = import('../data/image_cids.json').then((module) => module.default);
  }
  return imageCidsPromise;
};

export const prefetchImageCids = () => loadImageCids();

export const getIpfsGatewayUrls = (cid) => {
  if (!cid) return [];
  return uniqueGateways.map((gateway) => `${gateway}/${cid}`);
};

export const buildIpfsUrl = (cid, gatewayIndex = 0) => {
  const gateway = uniqueGateways[gatewayIndex];
  return gateway && cid ? `${gateway}/${cid}` : null;
};

export const getAfaThumbnailUrl = (tokenId) => `/images/${tokenId}.webp`;

export const getAfaThumbnailFallbackUrl = (tokenId) => `/images/${tokenId}.png`;

export const getBaycThumbnailUrl = (tokenId) => `/bayc-images/${tokenId}.webp`;

export const getBaycThumbnailFallbackUrl = (tokenId) => `/bayc-images/${tokenId}.png`;

export const ipfsToHttpUrl = (uri) => {
  if (!uri) return null;
  if (uri.startsWith('ipfs://')) return buildIpfsUrl(uri.slice(7));
  return uri;
};

/** BAYC high-res from metadata IPFS — safe for all tokens (original BAYC artwork). */
export const getBaycHighResUrl = async (tokenId) => {
  const { getBaycMetadataAsync } = await import('../data/baycMetadata');
  const metadata = await getBaycMetadataAsync(tokenId);
  return ipfsToHttpUrl(metadata?.image);
};

export const getAfaIpfsCid = async (tokenId, isMinted) => {
  if (!isMinted) return null;

  const imageCids = await loadImageCids();
  return imageCids[tokenId] ?? null;
};

/** First gateway URL for a minted AFA — does not verify availability. */
export const getAfaIpfsUrl = async (tokenId, isMinted) => {
  const cid = await getAfaIpfsCid(tokenId, isMinted);
  return buildIpfsUrl(cid);
};

/** Resolve the first reachable IPFS gateway URL for a CID. */
export const resolveIpfsUrl = async (cid) => {
  if (!cid) return null;

  for (const url of getIpfsGatewayUrls(cid)) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await preloadImageCached(url);
    if (ok) return url;
  }

  return null;
};

/** Resolve a working high-res URL for a minted AFA. */
export const resolveAfaIpfsUrl = async (tokenId, isMinted) => {
  const cid = await getAfaIpfsCid(tokenId, isMinted);
  return resolveIpfsUrl(cid);
};

/** Try the next IPFS gateway after a failed image load. Returns true if a URL was set. */
export const tryNextIpfsGateway = (img, cid) => {
  if (!cid || !img) return false;

  const urls = getIpfsGatewayUrls(cid);
  const trackedIndex = Number(img.dataset.ipfsGateway);
  const currentIndex = Number.isFinite(trackedIndex)
    ? trackedIndex
    : urls.findIndex((url) => img.src === url);
  const nextIndex = currentIndex + 1;

  if (nextIndex >= urls.length) return false;

  img.dataset.ipfsGateway = String(nextIndex);
  img.src = urls[nextIndex];
  return true;
};

export const markIpfsGatewayIndex = (img, url, cid) => {
  if (!img || !url || !cid) return;

  const index = getIpfsGatewayUrls(cid).indexOf(url);
  if (index >= 0) {
    img.dataset.ipfsGateway = String(index);
  }
};

export const tryNextAfaIpfsGateway = async (img, tokenId, isMinted) => {
  const cid = await getAfaIpfsCid(tokenId, isMinted);
  return tryNextIpfsGateway(img, cid);
};

export const setAfaIpfsImageSrc = async (img, tokenId, isMinted) => {
  const cid = await getAfaIpfsCid(tokenId, isMinted);
  if (!cid || !img) return null;

  const url = await resolveIpfsUrl(cid);
  if (!url) return null;

  markIpfsGatewayIndex(img, url, cid);
  img.src = url;
  return url;
};

export const preloadImage = (url) => preloadImageCached(url).then(() => undefined);
