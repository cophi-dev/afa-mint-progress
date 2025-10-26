import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getAllTransactions, processNFTStatuses } from '../services/etherscanService';
import ApeDetailsModal from './ApeDetailsModal';
import MintProgress from './MintProgress';
import ControlPanel from './ControlPanel';
import NFTCell from './NFTCell';
import { getBaycMetadata } from '../data/baycMetadata';
import './NFTGrid.css';
import imageCids from '../data/image_cids.json';

const CONTRACT_ADDRESS = '0xfAa0e99EF34Eae8b288CFEeAEa4BF4f5B5f2eaE7';
const BAYC_CONTRACT = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';

// Simple local cache for images
const imageCache = new Map();

// Cache for BAYC metadata to avoid repeated lookups
const metadataCache = new Map();

// Request queue to limit concurrent IPFS requests
class RequestQueue {
  constructor(maxConcurrent = 20) {
    this.maxConcurrent = maxConcurrent;
    this.currentRequests = 0;
    this.queue = [];
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.currentRequests >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.currentRequests++;
    const { requestFn, resolve, reject } = this.queue.shift();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.currentRequests--;
      this.processQueue();
    }
  }
}

const ipfsRequestQueue = new RequestQueue(20); // Limit to 20 concurrent IPFS requests

const getAfaImageUrl = (tokenId, highRes = false) => {
  const cid = imageCids[tokenId];
  if (!cid) return null;
  
  // Check if we have it cached locally
  const cacheKey = `${cid}_${highRes ? 'hires' : 'normal'}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }
  
  if (highRes) {
    // For high-res, use IPFS directly (full resolution)
    return `https://ipfs.io/ipfs/${cid}`;
  }
  
  // For normal res, try local image first (much faster than IPFS)
  const localImageUrl = `/images/${tokenId}.png`;
  
  // Return local image, with IPFS as fallback via error handling
  return localImageUrl;
};

function NFTGrid() {
  const [items, setItems] = useState(
    Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      isMinted: false,
      owner: null,
      imageUrl: `/images/${i}.png`,
      etherscanUrl: `https://etherscan.io/token/${CONTRACT_ADDRESS}?a=${i}`,
      baycUrl: `https://etherscan.io/token/${BAYC_CONTRACT}?a=${i}`
    }))
  );
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [mintedCount, setMintedCount] = useState(0);
  const [latestMints, setLatestMints] = useState([]);
  const [selectedApe, setSelectedApe] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  
  // New control panel state
  const [zoom, setZoom] = useState(16);
  const [showBayc, setShowBayc] = useState(false);
  const [attributeFilters, setAttributeFilters] = useState({});
  const [availableAttributes, setAvailableAttributes] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isLoadingMode, setIsLoadingMode] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    const fetchMintedStatus = async () => {
      try {
        setProgress(30);
        const transactions = await getAllTransactions();
        setProgress(60);
        const nftStatuses = processNFTStatuses(transactions);
        setProgress(90);
        
        setMintedCount(nftStatuses.size);
        const latest = Array.from(nftStatuses.entries())
          .sort((a, b) => b[1].timestamp - a[1].timestamp)
          .slice(0, 5)
          .map(([tokenId, data]) => ({
            tokenId,
            timestamp: data.timestamp,
            owner: data.owner
          }));
        setLatestMints(latest);

        setItems(prevItems => prevItems.map(item => {
          const status = nftStatuses.get(item.id);
          if (status) {
            return {
              ...item,
              isMinted: true,
              owner: status.owner,
              mintDate: new Date(status.timestamp * 1000).toISOString(),
              imageUrl: getAfaImageUrl(item.id) || item.imageUrl
            };
          }
          return item;
        }));

        setProgress(100);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            setLoading(false);
          }, 500);
        }, 500);
      } catch (error) {
        console.error('Error fetching minted status:', error);
        setLoading(false);
      }
    };

    fetchMintedStatus();
  }, []);

  // Process BAYC metadata for attribute filters (memoized)
  const availableAttributesMemo = useMemo(() => {
    const attributes = {};
    
    // Process first 1000 tokens to get available attributes
    for (let i = 0; i < 1000; i++) {
      let metadata = metadataCache.get(i);
      if (!metadata) {
        metadata = getBaycMetadata(i);
        if (metadata) {
          metadataCache.set(i, metadata);
        }
      }
      
      if (metadata?.attributes) {
        metadata.attributes.forEach(attr => {
          if (!attributes[attr.trait_type]) {
            attributes[attr.trait_type] = new Set();
          }
          attributes[attr.trait_type].add(attr.value);
        });
      }
    }
    
    // Convert Sets to Arrays and sort
    const processedAttributes = {};
    Object.keys(attributes).forEach(traitType => {
      processedAttributes[traitType] = Array.from(attributes[traitType]).sort();
    });
    
    return processedAttributes;
  }, []);

  useEffect(() => {
    setAvailableAttributes(availableAttributesMemo);
  }, [availableAttributesMemo]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleApeClick = (item) => {
    setSelectedTokenId(item.id);
    const highResUrl = item.isMinted ? getAfaImageUrl(item.id, true) : item.imageUrl;
    setSelectedApe({
      tokenId: item.id,
      isMinted: item.isMinted,
      owner: item.owner,
      mintDate: item.mintDate,
      image: highResUrl, // Use high-res for minted items
      etherscanUrl: item.etherscanUrl,
      baycUrl: item.baycUrl
    });
    setModalOpen(true);
  };

  // Control panel handlers
  const handleTokenSearch = (tokenId) => {
    const element = document.getElementById(`nft-${tokenId}`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
      setSelectedTokenId(tokenId);
      setTimeout(() => setSelectedTokenId(null), 3000); // Clear highlight after 3s
    }
  };

  const handleZoomChange = useCallback((newZoom) => {
    if (newZoom !== zoom) {
      // Smooth zoom transition
      setZoom(newZoom);
    }
  }, [zoom]);

  const handleShowBayc = useCallback(async (show) => {
    if (show !== showBayc) {
      setIsLoadingMode(true);
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setShowBayc(show);
      
      // Give React time to update and then hide loading
      setTimeout(() => {
        setIsLoadingMode(false);
      }, 300);
    }
  }, [showBayc]);

  const handleAttributeFilter = useCallback(async (filters) => {
    if (JSON.stringify(filters) !== JSON.stringify(attributeFilters)) {
      setIsApplyingFilters(true);
      
      // Small delay to show loading state for complex filters
      if (Object.keys(filters).length > Object.keys(attributeFilters).length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      setAttributeFilters(filters);
      
      // Hide loading after React updates
      setTimeout(() => {
        setIsApplyingFilters(false);
      }, 150);
    }
  }, [attributeFilters]);

  // Get current image URL based on settings (memoized)
  const getCurrentImageUrl = useCallback((item) => {
    if (showBayc) {
      // For BAYC mode, return placeholder initially and load via intersection observer
      return '/placeholder.png';
    }
    
    if (item.isMinted) {
      return item.imageUrl;
    }
    
    return '/placeholder.png';
  }, [showBayc]);

  // Get BAYC image URL (separate function for lazy loading)
  const getBaycImageUrl = useCallback((tokenId) => {
    let metadata = metadataCache.get(tokenId);
    if (!metadata) {
      metadata = getBaycMetadata(tokenId);
      if (metadata) {
        metadataCache.set(tokenId, metadata);
      }
    }
    if (metadata?.image) {
      return metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    return null;
  }, []);

  // Pre-calculate filtered items (memoized for performance)
  const filteredItemsSet = useMemo(() => {
    if (Object.keys(attributeFilters).length === 0) {
      return null; // No filters, show all
    }
    
    const matchingIds = new Set();
    
    for (let i = 0; i < 10000; i++) {
      let metadata = metadataCache.get(i);
      if (!metadata) {
        metadata = getBaycMetadata(i);
        if (metadata) {
          metadataCache.set(i, metadata);
        }
      }
      
      if (!metadata?.attributes) continue;
      
      let matches = true;
      for (const [traitType, selectedValues] of Object.entries(attributeFilters)) {
        const itemAttribute = metadata.attributes.find(attr => attr.trait_type === traitType);
        if (!itemAttribute || !selectedValues.includes(itemAttribute.value)) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        matchingIds.add(i);
      }
    }
    
    return matchingIds;
  }, [attributeFilters]);

  // Fast filter check function
  const itemMatchesFilters = useCallback((item) => {
    if (!filteredItemsSet) return true; // No filters active
    return filteredItemsSet.has(item.id);
  }, [filteredItemsSet]);

  // Calculate grid dimensions based on zoom (memoized)
  const { gridSize, cellsPerRow } = useMemo(() => {
    const size = zoom === 16 ? 1600 : zoom === 32 ? 3200 : zoom === 48 ? 4800 : 6400;
    return {
      gridSize: size,
      cellsPerRow: size / zoom
    };
  }, [zoom]);

  return (
    <>
      <div className="nft-grid-wrapper" ref={gridRef}>
        <div 
          className="nft-grid"
          style={{
            gridTemplateColumns: `repeat(${cellsPerRow}, ${zoom}px)`,
            width: `${gridSize}px`,
            height: `${gridSize}px`,
          }}
        >
          {items.map(item => (
            <NFTCell
              key={item.id}
              item={item}
              zoom={zoom}
              selectedTokenId={selectedTokenId}
              matchesFilter={itemMatchesFilters(item)}
              imageUrl={getCurrentImageUrl(item)}
              showBayc={showBayc}
              getBaycImageUrl={getBaycImageUrl}
              onApeClick={handleApeClick}
            />
          ))}
        </div>
      </div>

      <ApeDetailsModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTokenId(null);
        }}
        apeData={selectedApe}
      />

      <MintProgress mintedCount={mintedCount} latestMints={latestMints} />

      <ControlPanel
        onTokenSearch={handleTokenSearch}
        onZoomChange={handleZoomChange}
        onShowBayc={handleShowBayc}
        onAttributeFilter={handleAttributeFilter}
        zoom={zoom}
        showBayc={showBayc}
        availableAttributes={availableAttributes}
        selectedFilters={attributeFilters}
        isMobile={isMobile}
      />
      
      {/* Main loading overlay */}
      {loading && (
        <div className={`loading-overlay ${fadeOut ? 'fade-out' : ''}`}>
          <img src="/logo.png" alt="Logo" className="loading-logo" />
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">{progress}%</div>
        </div>
      )}

      {/* Mode switch loading overlay */}
      {isLoadingMode && (
        <div className="mode-loading-overlay">
          <div className="mode-loading-spinner">
            <div className="spinner"></div>
            <div className="loading-text">
              {showBayc ? 'Loading Original BAYC...' : 'Loading AFA Mode...'}
            </div>
          </div>
        </div>
      )}

      {/* Filter loading overlay */}
      {isApplyingFilters && (
        <div className="filter-loading-overlay">
          <div className="filter-loading-spinner">
            <div className="spinner small"></div>
            <div className="loading-text small">Applying filters...</div>
          </div>
        </div>
      )}
    </>
  );
}

export default NFTGrid; 