import React, { memo } from 'react';
import imageCids from '../data/image_cids.json';

// Cache for successful loads
const imageCache = new Map();

const NFTCell = memo(({
  item,
  zoom,
  selectedTokenId,
  matchesFilter,
  imageUrl,
  onApeClick
}) => {
  const handleImageLoad = (e) => {
    // Cache successful loads
    if (item.isMinted && item.imageUrl) {
      const cid = imageCids[item.id];
      if (cid) {
        const cacheKey = `${cid}_normal`;
        if (!imageCache.has(cacheKey)) {
          imageCache.set(cacheKey, item.imageUrl);
        }
      }
    }
  };

  const handleImageError = (e) => {
    // If local image fails, try IPFS as fallback
    if (item.isMinted && !e.target.dataset.triedIpfs) {
      const cid = imageCids[item.id];
      if (cid) {
        e.target.dataset.triedIpfs = 'true';
        e.target.src = `https://ipfs.io/ipfs/${cid}`;
        return;
      }
    }
    e.target.src = '/placeholder.png';
  };

  return (
    <div 
      id={`nft-${item.id}`}
      className={`nft-cell ${item.isMinted ? 'minted' : 'unminted'} ${selectedTokenId === item.id ? 'selected' : ''} ${!matchesFilter ? 'filtered-out' : ''}`}
      onClick={() => onApeClick(item)}
      title={item.isMinted ? `#${item.id} - Owned by ${item.owner}` : `#${item.id} - Original BAYC`}
      style={{
        width: `${zoom}px`,
        height: `${zoom}px`,
      }}
    >
      <img 
        src={imageUrl}
        alt={`#${item.id}`}
        loading="lazy"
        style={{ 
          border: 'none', 
          outline: 'none',
          width: `${zoom}px`,
          height: `${zoom}px`,
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
});

NFTCell.displayName = 'NFTCell';

export default NFTCell;
