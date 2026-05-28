const loaded = new Set();

export const isImageCached = (url) => loaded.has(url);

export const markImageCached = (url) => {
  if (url) loaded.add(url);
};

export const preloadImageCached = (url) => {
  if (!url) return Promise.resolve(false);
  if (loaded.has(url)) return Promise.resolve(true);

  return new Promise((resolve) => {
    const img = new Image();
    const finish = (ok) => {
      if (ok) loaded.add(url);
      resolve(ok);
    };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = url;
  });
};
