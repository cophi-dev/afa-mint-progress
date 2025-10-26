import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getAllTransactions, processNFTStatuses } from '../services/etherscanService';
import ApeDetailsModal from './ApeDetailsModal';
import MintProgress from './MintProgress';
import ControlPanel from './ControlPanel';
import NFTCell from './NFTCell';
import { getBaycMetadata } from '../data/baycMetadata';
import { PLACEHOLDER_DATA_URL } from '../constants/images';
import './NFTGrid.css';
import imageCids from '../data/image_cids.json';

const CONTRACT_ADDRESS = '0xfAa0e99EF34Eae8b288CFEeAEa4BF4f5B5f2eaE7';
const BAYC_CONTRACT = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';

// Enhanced image cache with preloading support
const imageCache = new Map();
const preloadCache = new Map();

// Cache for BAYC metadata to avoid repeated lookups (currently unused but kept for future use)
// const metadataCache = new Map();

// Image preloader class for better performance
class ImagePreloader {
  constructor() {
    this.preloadQueue = new Set();
    this.isPreloading = false;
    this.maxConcurrentPreloads = 10;
    this.currentPreloads = 0;
  }

  preloadImage(url, key = null) {
    return new Promise((resolve, reject) => {
      const cacheKey = key || url;
      
      // Check if already cached
      if (preloadCache.has(cacheKey)) {
        resolve(preloadCache.get(cacheKey));
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        preloadCache.set(cacheKey, url);
        resolve(url);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async preloadImages(urls, keys = null) {
    const promises = urls.map((url, index) => {
      const key = keys ? keys[index] : null;
      return this.preloadImage(url, key);
    });
    
    // Process in batches to avoid overwhelming the browser
    const batches = [];
    for (let i = 0; i < promises.length; i += this.maxConcurrentPreloads) {
      batches.push(promises.slice(i, i + this.maxConcurrentPreloads));
    }
    
    for (const batch of batches) {
      await Promise.allSettled(batch);
    }
  }

  // Preload visible images and a buffer around them
  async preloadVisibleImages(items, showBayc, getBaycImageUrl, getCurrentImageUrl, startIndex = 0, count = 100) {
    const urls = [];
    const keys = [];
    
    for (let i = startIndex; i < Math.min(startIndex + count, items.length); i++) {
      const item = items[i];
      if (showBayc) {
        const baycUrl = getBaycImageUrl(item.id, false);
        urls.push(baycUrl);
        keys.push(`bayc_${item.id}`);
      } else {
        const afaUrl = getCurrentImageUrl(item);
        if (afaUrl !== PLACEHOLDER_DATA_URL) {
          urls.push(afaUrl);
          keys.push(`afa_${item.id}`);
        }
      }
    }
    
    if (urls.length > 0) {
      await this.preloadImages(urls, keys);
    }
  }
}

const imagePreloader = new ImagePreloader();

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

// const ipfsRequestQueue = new RequestQueue(20); // Limit to 20 concurrent IPFS requests (currently unused)

const getAfaImageUrl = (tokenId, highRes = false) => {
  // For modal views, use IPFS for full resolution
  if (highRes) {
    const cid = imageCids[tokenId];
    if (cid) {
      return `https://ipfs.io/ipfs/${cid}`;
    }
  }
  
  // Always use local 64px thumbnails - perfect at all zoom levels
  return `/images/${tokenId}.png`;
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isLoadingMode, setIsLoadingMode] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const gridRef = useRef(null);

  // Get current image URL based on settings (memoized)
  const getCurrentImageUrl = useCallback((item) => {
    if (showBayc) {
      // For BAYC mode, return placeholder initially and load via intersection observer
      return PLACEHOLDER_DATA_URL;
    }
    
    if (item.isMinted) {
      // Always use local 64px thumbnails - perfect at all zoom levels!
      return getAfaImageUrl(item.id, false) || item.imageUrl;
    }
    
    return PLACEHOLDER_DATA_URL;
  }, [showBayc]);

  // Get BAYC image URL - now always use local 64px thumbnails
  const getBaycImageUrl = useCallback((tokenId, highRes = false) => {
    // For modal views, use IPFS for full resolution
    if (highRes) {
      const metadata = getBaycMetadata(tokenId);
      if (metadata?.image) {
        const ipfsUrl = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
        const cacheKey = `bayc_${tokenId}_hires`;
        imageCache.set(cacheKey, ipfsUrl);
        return ipfsUrl;
      }
    }
    
    // Always use local 64px thumbnail - perfect at all zoom levels!
    const localBaycUrl = `/bayc-images/${tokenId}.png`;
    const cacheKey = `bayc_${tokenId}_thumb`;
    if (imageCache.has(cacheKey)) {
      return imageCache.get(cacheKey);
    }
    
    imageCache.set(cacheKey, localBaycUrl);
    return localBaycUrl;
  }, []);

  // Calculate grid dimensions based on screen width and zoom (memoized)
  const { gridWidth, cellsPerRow, totalRows } = useMemo(() => {
    // More aggressive use of screen space, especially on mobile
    const padding = isMobile ? 10 : 40; // Reduce padding on mobile
    const availableWidth = screenWidth - padding;
    
    // Calculate how many cells can fit in the available width
    let maxCellsPerRow = Math.floor(availableWidth / zoom);
    
    // On mobile, be more aggressive with column count
    if (isMobile) {
      // Ensure minimum columns on mobile for better space utilization
      const minColumnsOnMobile = Math.max(15, Math.floor(screenWidth / 24)); // At least 15 columns, or fit 24px cells
      maxCellsPerRow = Math.max(maxCellsPerRow, minColumnsOnMobile);
      
      // If we're at small zoom levels on mobile, pack more columns
      if (zoom <= 16) {
        maxCellsPerRow = Math.max(maxCellsPerRow, Math.floor(screenWidth / 12)); // Pack tighter at 16px zoom
      }
    }
    
    // Make sure we don't exceed 100 cells per row (since original BAYC is 100x100)
    const cellsPerRow = Math.min(maxCellsPerRow, 100);
    
    // Calculate actual grid width - allow it to use full available width on mobile
    const actualGridWidth = isMobile ? Math.min(cellsPerRow * zoom, availableWidth) : cellsPerRow * zoom;
    
    // Calculate total rows needed for 10,000 items
    const totalRows = Math.ceil(10000 / cellsPerRow);
    
    return {
      gridWidth: actualGridWidth,
      cellsPerRow,
      totalRows
    };
  }, [zoom, screenWidth, isMobile]);

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
              imageUrl: getAfaImageUrl(item.id, false) || item.imageUrl
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


  // Handle window resize for mobile detection and screen width
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll-based preloading for better performance
  useEffect(() => {
    let scrollTimeout;
    const currentGridRef = gridRef.current;
    
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(async () => {
        if (!currentGridRef) return;
        
        const scrollTop = currentGridRef.scrollTop;
        const containerHeight = currentGridRef.clientHeight;
        const rowHeight = zoom;
        
        // Calculate visible row range
        const startRow = Math.floor(scrollTop / rowHeight);
        const endRow = Math.ceil((scrollTop + containerHeight) / rowHeight);
        
        // Calculate items to preload (visible + buffer)
        const bufferRows = 10; // Preload 10 rows ahead
        const preloadStartRow = Math.max(0, startRow - bufferRows);
        const preloadEndRow = Math.min(totalRows, endRow + bufferRows);
        
        const startIndex = preloadStartRow * cellsPerRow;
        const endIndex = preloadEndRow * cellsPerRow;
        const preloadCount = Math.min(endIndex - startIndex, 200); // Limit preload size
        
        try {
          await imagePreloader.preloadVisibleImages(
            items, 
            showBayc, 
            getBaycImageUrl, 
            getCurrentImageUrl, 
            startIndex, 
            preloadCount
          );
        } catch (error) {
          // Silent fail for preloading
          console.debug('Scroll preloading failed:', error);
        }
      }, 100); // Debounce scroll events
    };

    if (currentGridRef) {
      currentGridRef.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        if (currentGridRef) {
          currentGridRef.removeEventListener('scroll', handleScroll);
        }
        if (scrollTimeout) clearTimeout(scrollTimeout);
      };
    }
  }, [items, showBayc, getBaycImageUrl, getCurrentImageUrl, zoom, cellsPerRow, totalRows]);

  // Update image URLs when zoom level changes (for minted items to get high-res at 64px)
  useEffect(() => {
    setItems(prevItems => prevItems.map(item => {
      if (item.isMinted) {
        const newImageUrl = getAfaImageUrl(item.id, false);
        return {
          ...item,
          imageUrl: newImageUrl || item.imageUrl
        };
      }
      return item;
    }));
  }, [zoom]);

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
      
      try {
        // Preload initial batch of images for faster switching
        const preloadCount = Math.min(500, items.length); // Preload first 500 images
        
        if (show) {
          // Switching to BAYC - preload BAYC thumbnails
          await imagePreloader.preloadVisibleImages(items, true, getBaycImageUrl, getCurrentImageUrl, 0, preloadCount);
        } else {
          // Switching to AFA - preload AFA thumbnails
          await imagePreloader.preloadVisibleImages(items, false, getBaycImageUrl, getCurrentImageUrl, 0, preloadCount);
        }
      } catch (error) {
        console.warn('Preloading failed, but continuing with mode switch:', error);
      }
      
      setShowBayc(show);
      
      // Give React time to update and then hide loading
      setTimeout(() => {
        setIsLoadingMode(false);
      }, 200);
    }
  }, [showBayc, items, getBaycImageUrl, getCurrentImageUrl]);



  return (
    <>
      <div className="nft-grid-wrapper" ref={gridRef}>
        <div 
          className="nft-grid"
          style={{
            gridTemplateColumns: `repeat(${cellsPerRow}, ${zoom}px)`,
            width: `${gridWidth}px`,
            height: `${totalRows * zoom}px`,
            margin: '0 auto', // Center the grid
          }}
        >
          {items.map(item => (
            <NFTCell
              key={item.id}
              item={item}
              zoom={zoom}
              selectedTokenId={selectedTokenId}
              matchesFilter={true}
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
        zoom={zoom}
        showBayc={showBayc}
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

    </>
  );
}

export default NFTGrid; 