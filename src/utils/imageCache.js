const loaded = new Set();

export const isImageCached = (url) => loaded.has(url);

export const markImageCached = (url) => {
  if (url) loaded.add(url);
};

const DEFAULT_PRELOAD_TIMEOUT_MS = 8000;

export const preloadImageCached = (url, timeoutMs = DEFAULT_PRELOAD_TIMEOUT_MS) => {
  if (!url) return Promise.resolve(false);
  if (loaded.has(url)) return Promise.resolve(true);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      if (ok) loaded.add(url);
      resolve(ok);
    };

    const img = new Image();
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = url;

    if (timeoutMs > 0) {
      setTimeout(() => finish(false), timeoutMs);
    }
  });
};
