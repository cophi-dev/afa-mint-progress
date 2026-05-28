let mappingCache = null;
let mappingPromise = null;

export const loadBaycMapping = async () => {
  if (mappingCache) return mappingCache;

  if (!mappingPromise) {
    mappingPromise = import('./mapping.json').then((module) => {
      const mappingData = module.default;
      mappingCache = mappingData.reduce((acc, item) => {
        acc[item.id] = item.metadata;
        return acc;
      }, {});
      return mappingCache;
    });
  }

  return mappingPromise;
};

export const getBaycMetadata = (tokenId) => {
  if (!mappingCache) return null;

  const metadata = mappingCache[tokenId];
  if (!metadata) return null;

  return {
    image: metadata.image,
    attributes: metadata.attributes,
  };
};

export const getBaycMetadataAsync = async (tokenId) => {
  const cache = await loadBaycMapping();
  const metadata = cache[tokenId];
  if (!metadata) return null;

  return {
    image: metadata.image,
    attributes: metadata.attributes,
  };
};
