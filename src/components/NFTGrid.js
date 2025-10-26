import React, { useState, useEffect, useRef } from 'react';
import { getAllTransactions, processNFTStatuses } from '../services/etherscanService';
import ApeDetailsModal from './ApeDetailsModal';
import MintProgress from './MintProgress';
import ControlPanel from './ControlPanel';
import { getBaycMetadata } from '../data/baycMetadata';
import './NFTGrid.css';
import imageCids from '../data/image_cids.json';

const CONTRACT_ADDRESS = '0xfAa0e99EF34Eae8b288CFEeAEa4BF4f5B5f2eaE7';
const BAYC_CONTRACT = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';

// Simple local cache for images
const imageCache = new Map();

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

  // Process BAYC metadata for attribute filters
  useEffect(() => {
    const processAttributes = () => {
      const attributes = {};
      
      // Process first 1000 tokens to get available attributes
      for (let i = 0; i < 1000; i++) {
        const metadata = getBaycMetadata(i);
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
      
      setAvailableAttributes(processedAttributes);
    };

    processAttributes();
  }, []);

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

  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
  };

  const handleShowBayc = (show) => {
    setShowBayc(show);
  };

  const handleAttributeFilter = (filters) => {
    setAttributeFilters(filters);
  };

  // Get current image URL based on settings
  const getCurrentImageUrl = (item) => {
    if (showBayc) {
      const metadata = getBaycMetadata(item.id);
      if (metadata?.image) {
        return metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
    }
    
    if (item.isMinted) {
      return item.imageUrl;
    }
    
    return '/placeholder.png';
  };

  // Check if item matches current filters
  const itemMatchesFilters = (item) => {
    if (Object.keys(attributeFilters).length === 0) return true;
    
    const metadata = getBaycMetadata(item.id);
    if (!metadata?.attributes) return false;
    
    for (const [traitType, selectedValues] of Object.entries(attributeFilters)) {
      const itemAttribute = metadata.attributes.find(attr => attr.trait_type === traitType);
      if (!itemAttribute || !selectedValues.includes(itemAttribute.value)) {
        return false;
      }
    }
    
    return true;
  };

  // Calculate grid dimensions based on zoom
  const gridSize = zoom === 16 ? 1600 : zoom === 32 ? 3200 : zoom === 48 ? 4800 : 6400;
  const cellsPerRow = gridSize / zoom;

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
          {items.map(item => {
            const matchesFilter = itemMatchesFilters(item);
            return (
              <div 
                key={item.id}
                id={`nft-${item.id}`}
                className={`nft-cell ${item.isMinted ? 'minted' : 'unminted'} ${selectedTokenId === item.id ? 'selected' : ''} ${!matchesFilter ? 'filtered-out' : ''}`}
                onClick={() => handleApeClick(item)}
                title={item.isMinted ? `#${item.id} - Owned by ${item.owner}` : `#${item.id} - Original BAYC`}
                style={{
                  width: `${zoom}px`,
                  height: `${zoom}px`,
                }}
              >
                <img 
                  src={getCurrentImageUrl(item)}
                  alt={`#${item.id}`}
                  loading="lazy"
                  style={{ 
                    border: 'none', 
                    outline: 'none',
                    width: `${zoom}px`,
                    height: `${zoom}px`,
                  }}
                  onLoad={(e) => {
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
                  }}
                  onError={(e) => {
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
                  }}
                />
              </div>
            );
          })}
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
    </>
  );
}

export default NFTGrid; 