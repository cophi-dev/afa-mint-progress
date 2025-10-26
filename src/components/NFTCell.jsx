import React, { memo, useState, useEffect, useRef } from 'react';
import imageCids from '../data/image_cids.json';
import { getBaycMetadata } from '../data/baycMetadata';
import { PLACEHOLDER_DATA_URL } from '../constants/images';

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

  // Enhanced Intersection Observer for optimized image loading
  useEffect(() => {
    const currentCellRef = cellRef.current;
    if (!currentCellRef) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          
          if (showBayc && getBaycImageUrl) {
            // Load BAYC image with appropriate resolution
            const baycUrl = getBaycImageUrl(item.id, false);
            if (baycUrl) {
              setActualImageUrl(baycUrl);
            }
          } else if (!showBayc && item.isMinted) {
            // For AFA mode, ensure the correct URL is set
            const afaUrl = `/images/${item.id}.png`;
            setActualImageUrl(afaUrl);
          }
        }
      },
      { 
        rootMargin: '400px', // Even larger margin for better preloading
        threshold: 0.01 // Lower threshold for earlier loading
      }
    );

    observer.observe(currentCellRef);

    return () => {
      if (currentCellRef) {
        observer.unobserve(currentCellRef);
      }
    };
  }, [showBayc, getBaycImageUrl, item.id, item.isMinted, isVisible]);

  // Optimized reset when switching modes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setIsVisible(false);
    
    if (showBayc) {
      // Use placeholder for BAYC mode
      setActualImageUrl(PLACEHOLDER_DATA_URL);
    } else {
      // Immediately set correct URL for AFA mode
      setActualImageUrl(imageUrl);
      
      // For minted items in AFA mode, immediately mark as visible to avoid delays
      if (item.isMinted) {
        setIsVisible(true);
      }
    }
  }, [showBayc, imageUrl, item.isMinted]);
  
  const handleImageLoad = (e) => {
    setImageLoaded(true);
    setImageError(false);
    
    // Cache successful loads for both AFA and BAYC
    const cacheKey = showBayc ? `bayc_${item.id}` : `afa_${item.id}`;
    if (!imageCache.has(cacheKey)) {
      imageCache.set(cacheKey, e.target.src);
    }
  };

  // Check if image is already cached to avoid showing loading state
  useEffect(() => {
    const cacheKey = showBayc ? `bayc_${item.id}` : `afa_${item.id}`;
    const isPlaceholder = actualImageUrl === '/placeholder.png';
    if (imageCache.has(cacheKey) && !isPlaceholder) {
      setImageLoaded(true);
    }
  }, [actualImageUrl, showBayc, item.id]);

  const handleImageError = (e) => {
    // Handle different fallback logic for BAYC vs AFA
    if (showBayc && !e.target.dataset.triedIpfs) {
      // For BAYC: fallback to IPFS if local thumbnail fails
      const metadata = getBaycMetadata(item.id);
      if (metadata?.image) {
        e.target.dataset.triedIpfs = 'true';
        e.target.src = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
        return;
      }
    } else if (item.isMinted && !e.target.dataset.triedIpfs) {
      // For AFA: try IPFS as fallback
      const cid = imageCids[item.id];
      if (cid) {
        e.target.dataset.triedIpfs = 'true';
        e.target.src = `https://ipfs.io/ipfs/${cid}`;
        return;
      }
    }
    
    // If all fallbacks fail, show broken image handled by browser
    
    setImageError(true);
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
        decoding="async"
        style={{ 
          border: 'none', 
          outline: 'none',
          width: `${zoom}px`,
          height: `${zoom}px`,
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          imageRendering: 'crisp-edges',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
});

NFTCell.displayName = 'NFTCell';

export default NFTCell;
