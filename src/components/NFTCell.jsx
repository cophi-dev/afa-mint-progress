import React, { memo, useState, useEffect, useRef } from 'react';
import imageCids from '../data/image_cids.json';

// Cache for successful loads
const imageCache = new Map();

const NFTCell = memo(({
  item,
  zoom,
  selectedTokenId,
  matchesFilter,
  imageUrl,
  showBayc,
  getBaycImageUrl,
  onApeClick
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [actualImageUrl, setActualImageUrl] = useState(imageUrl);
  const [isVisible, setIsVisible] = useState(false);
  const cellRef = useRef(null);

  // Intersection Observer for lazy loading BAYC images
  useEffect(() => {
    if (!showBayc || !getBaycImageUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          // Load BAYC image when visible, but use a small delay to batch requests
          setTimeout(() => {
            const baycUrl = getBaycImageUrl(item.id);
            if (baycUrl) {
              setActualImageUrl(baycUrl);
            }
          }, Math.random() * 200); // Random delay up to 200ms to spread out requests
        }
      },
      { 
        rootMargin: '100px', // Start loading 100px before item is visible
        threshold: 0.1
      }
    );

    if (cellRef.current) {
      observer.observe(cellRef.current);
    }

    return () => {
      if (cellRef.current) {
        observer.unobserve(cellRef.current);
      }
    };
  }, [showBayc, getBaycImageUrl, item.id, isVisible]);

  // Reset when switching modes
  useEffect(() => {
    if (showBayc) {
      setActualImageUrl('/placeholder.png');
      setImageLoaded(false);
      setIsVisible(false);
    } else {
      setActualImageUrl(imageUrl);
    }
  }, [showBayc, imageUrl]);
  const handleImageLoad = (e) => {
    setImageLoaded(true);
    setImageError(false);
    
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
    setImageError(true);
    e.target.src = '/placeholder.png';
  };

  return (
    <div 
      ref={cellRef}
      id={`nft-${item.id}`}
      className={`nft-cell ${item.isMinted ? 'minted' : 'unminted'} ${selectedTokenId === item.id ? 'selected' : ''} ${!matchesFilter ? 'filtered-out' : ''} ${imageLoaded ? 'loaded' : 'loading'}`}
      onClick={() => onApeClick(item)}
      title={item.isMinted ? `#${item.id} - Owned by ${item.owner}` : `#${item.id} - Original BAYC`}
      style={{
        width: `${zoom}px`,
        height: `${zoom}px`,
      }}
    >
      {/* Loading skeleton */}
      {!imageLoaded && !imageError && (
        <div 
          className="image-skeleton"
          style={{
            width: `${zoom}px`,
            height: `${zoom}px`,
          }}
        />
      )}
      
      <img 
        src={actualImageUrl}
        alt={`#${item.id}`}
        loading="lazy"
        style={{ 
          border: 'none', 
          outline: 'none',
          width: `${zoom}px`,
          height: `${zoom}px`,
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
});

NFTCell.displayName = 'NFTCell';

export default NFTCell;
