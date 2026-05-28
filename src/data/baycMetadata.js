let mappingCache = null;
let mappingPromise = null;
let traitIndex = null;

const TRAIT_TYPE_ORDER = [
  'Background',
  'Fur',
  'Clothes',
  'Eyes',
  'Hat',
  'Mouth',
  'Earring',
];

const buildTraitIndex = (mappingData) => {
  traitIndex = {};

  mappingData.forEach((item) => {
    const tokenId = parseInt(item.id, 10);
    item.metadata.attributes.forEach(({ trait_type: traitType, value }) => {
      if (!traitIndex[traitType]) traitIndex[traitType] = {};
      if (!traitIndex[traitType][value]) traitIndex[traitType][value] = new Set();
      traitIndex[traitType][value].add(tokenId);
    });
  });
};

export const loadBaycMapping = async () => {
  if (mappingCache) return mappingCache;

  if (!mappingPromise) {
    mappingPromise = import('./mapping.json').then((module) => {
      const mappingData = module.default;
      mappingCache = mappingData.reduce((acc, item) => {
        acc[item.id] = item.metadata;
        return acc;
      }, {});
      buildTraitIndex(mappingData);
      return mappingCache;
    });
  }

  return mappingPromise;
};

export const getTraitCatalog = () => {
  if (!traitIndex) return null;

  const types = Object.keys(traitIndex).sort((a, b) => {
    const ai = TRAIT_TYPE_ORDER.indexOf(a);
    const bi = TRAIT_TYPE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return types.map((traitType) => ({
    traitType,
    values: Object.entries(traitIndex[traitType])
      .map(([value, ids]) => ({ value, count: ids.size }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
  }));
};

/**
 * Filter tokens by BAYC traits.
 * OR within a trait type, AND across trait types.
 * @param {Record<string, string[]>} filters
 * @returns {number[]|null} sorted token ids, or null when no active filters
 */
export const filterTokenIds = (filters) => {
  if (!traitIndex || !filters) return null;

  const activeEntries = Object.entries(filters).filter(([, values]) => values?.length > 0);
  if (activeEntries.length === 0) return null;

  let result = null;

  activeEntries.forEach(([traitType, values]) => {
    const typeMatches = new Set();
    values.forEach((value) => {
      traitIndex[traitType]?.[value]?.forEach((id) => typeMatches.add(id));
    });

    if (result === null) {
      result = typeMatches;
    } else {
      result = new Set([...result].filter((id) => typeMatches.has(id)));
    }
  });

  return [...result].sort((a, b) => a - b);
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
