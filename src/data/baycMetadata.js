import mappingData from './mapping.json';

// Convert the array into an object indexed by token ID
const baycMapping = mappingData.reduce((acc, item) => {
  acc[item.id] = item.metadata;
  return acc;
}, {});

export const getBaycMetadata = (tokenId) => {
  const metadata = baycMapping[tokenId];
  if (!metadata) return null;

  return {
    image: metadata.image,
    attributes: metadata.attributes
  };
}; 