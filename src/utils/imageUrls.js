import { preloadImageCached } from './imageCache';

const IPFS_GATEWAYS = [
  process.env.REACT_APP_IPFS_GATEWAY,
  'https://nftstorage.link/ipfs',
  'https://w3s.link/ipfs',
  'https://gateway.pinata.cloud/ipfs',
  'https://ipfs.io/ipfs',
  // dweb.link often 504s on large assets — keep as last resort
  'https://dweb.link/ipfs',
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

const IPFS_GATEWAY_TIMEOUT_MS = 5000;
const IPFS_RESOLVE_OVERALL_MS = 9000;

/** Match a loaded image URL back to a gateway index (handles subdomain redirects). */
export const findGatewayIndexForSrc = (src, cid) => {
  if (!src || !cid || !src.includes(cid)) return -1;

  const urls = getIpfsGatewayUrls(cid);
  const exact = urls.findIndex((url) => src === url || src.startsWith(`${url}/`));
  if (exact >= 0) return exact;

  return uniqueGateways.findIndex((gateway) => {
    try {
      const { hostname } = new URL(gateway);
      return src.includes(hostname);
    } catch {
      return false;
    }
  });
};

/** Resolve the first reachable IPFS gateway URL for a CID. */
export const resolveIpfsUrlWithMeta = async (cid) => {
  if (!cid) return null;

  const urls = getIpfsGatewayUrls(cid);
  if (urls.length === 0) return null;

  const raceWinner = new Promise((resolve) => {
    let settled = false;
    let pending = urls.length;

    urls.forEach((url, gatewayIndex) => {
      preloadImageCached(url, IPFS_GATEWAY_TIMEOUT_MS).then((ok) => {
        if (settled) return;
        if (ok) {
          settled = true;
          resolve({ url, gatewayIndex });
          return;
        }
        pending -= 1;
        if (pending === 0) resolve(null);
      });
    });
  });

  const overallTimeout = new Promise((resolve) => {
    setTimeout(() => resolve(null), IPFS_RESOLVE_OVERALL_MS);
  });

  return Promise.race([raceWinner, overallTimeout]);
};

export const resolveIpfsUrl = async (cid) => {
  const result = await resolveIpfsUrlWithMeta(cid);
  return result?.url ?? null;
};

/** Resolve a working high-res URL for a minted AFA. */
export const resolveAfaIpfsUrl = async (tokenId, isMinted) => {
  const result = await resolveAfaIpfsUrlWithMeta(tokenId, isMinted);
  return result?.url ?? null;
};

export const resolveAfaIpfsUrlWithMeta = async (tokenId, isMinted) => {
  const cid = await getAfaIpfsCid(tokenId, isMinted);
  return resolveIpfsUrlWithMeta(cid);
};

/** Try the next IPFS gateway after a failed image load. Returns true if a URL was set. */
export const tryNextIpfsGateway = (img, cid) => {
  if (!cid || !img) return false;

  const urls = getIpfsGatewayUrls(cid);
  const src = img.currentSrc || img.src;
  const trackedIndex = Number(img.dataset.ipfsGateway);
  const currentIndex = Number.isFinite(trackedIndex) && trackedIndex >= 0
    ? trackedIndex
    : findGatewayIndexForSrc(src, cid);
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

  const result = await resolveIpfsUrlWithMeta(cid);
  if (!result) return null;

  markIpfsGatewayIndex(img, result.url, cid);
  img.src = result.url;
  return result.url;
};

export const preloadImage = (url) => preloadImageCached(url).then(() => undefined);
