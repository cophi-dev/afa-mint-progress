import React, { useState, useEffect } from 'react';
import { getAllTransactions, processNFTStatuses } from '../services/etherscanService';
import ApeDetailsModal from './ApeDetailsModal';
import MintProgress from './MintProgress';
import './NFTGrid.css';
import imageCids from '../data/image_cids.json';

const CONTRACT_ADDRESS = '0xfAa0e99EF34Eae8b288CFEeAEa4BF4f5B5f2eaE7';
const BAYC_CONTRACT = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';

// Multiple IPFS gateways ordered by performance
const IPFS_GATEWAYS = [
  'https://cloudflare-ipfs.com/ipfs',     // Cloudflare - usually fastest
  'https://dweb.link/ipfs',               // Protocol Labs - reliable
  'https://ipfs.io/ipfs',                 // Original - fallback
  'https://gateway.pinata.cloud/ipfs'     // Pinata - good for pinned content
];

// Cache for gateway performance
const gatewayPerformance = new Map();

const getAfaImageUrl = (tokenId) => {
  const cid = imageCids[tokenId];
  if (!cid) return null;
  
  // Return fastest known gateway, or first one as default
  const sortedGateways = IPFS_GATEWAYS.sort((a, b) => {
    const aPerf = gatewayPerformance.get(a) || 1000;
    const bPerf = gatewayPerformance.get(b) || 1000;
    return aPerf - bPerf;
  });
  
  return `${sortedGateways[0]}/${cid}`;
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

  const handleApeClick = (item) => {
    setSelectedApe({
      tokenId: item.id,
      isMinted: item.isMinted,
      owner: item.owner,
      mintDate: item.mintDate,
      image: item.imageUrl,
      etherscanUrl: item.etherscanUrl,
      baycUrl: item.baycUrl
    });
    setModalOpen(true);
  };

  return (
    <>
      <div className="nft-grid-wrapper">
        <div className="nft-grid">
          {items.map(item => (
            <div 
              key={item.id} 
              className={`nft-cell ${item.isMinted ? 'minted' : 'unminted'}`}
              onClick={() => handleApeClick(item)}
              title={item.isMinted ? `#${item.id} - Owned by ${item.owner}` : `#${item.id} - Original BAYC`}
            >
              <img 
                src={item.isMinted ? item.imageUrl : '/placeholder.png'}
                alt={`#${item.id}`}
                loading="lazy"
                onLoad={(e) => {
                  // Track successful loads for gateway performance
                  if (item.isMinted && item.imageUrl) {
                    const gateway = IPFS_GATEWAYS.find(g => item.imageUrl.startsWith(g));
                    if (gateway) {
                      const currentPerf = gatewayPerformance.get(gateway) || 1000;
                      gatewayPerformance.set(gateway, Math.max(50, currentPerf - 50)); // Improve score
                    }
                  }
                }}
                onError={(e) => {
                  // Track failed loads and try next gateway
                  if (item.isMinted && item.imageUrl && !e.target.dataset.retryCount) {
                    const currentGateway = IPFS_GATEWAYS.find(g => item.imageUrl.startsWith(g));
                    if (currentGateway) {
                      // Mark this gateway as slower
                      const currentPerf = gatewayPerformance.get(currentGateway) || 1000;
                      gatewayPerformance.set(currentGateway, currentPerf + 200);
                      
                      // Try next gateway
                      const currentIndex = IPFS_GATEWAYS.indexOf(currentGateway);
                      const nextIndex = (currentIndex + 1) % IPFS_GATEWAYS.length;
                      const cid = imageCids[item.id];
                      
                      if (cid && nextIndex !== currentIndex) {
                        e.target.dataset.retryCount = '1';
                        e.target.src = `${IPFS_GATEWAYS[nextIndex]}/${cid}`;
                        return;
                      }
                    }
                  }
                  e.target.src = '/placeholder.png';
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <ApeDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        apeData={selectedApe}
      />

      <MintProgress mintedCount={mintedCount} latestMints={latestMints} />
      
      {/* Preload images for latest mints to improve perceived performance */}
      {latestMints.slice(0, 10).map(mint => {
        const imageUrl = getAfaImageUrl(mint.tokenId);
        return imageUrl ? (
          <link 
            key={`preload-${mint.tokenId}`}
            rel="preload" 
            as="image" 
            href={imageUrl}
          />
        ) : null;
      })}
      
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