import React, { useState, useEffect } from 'react';
import { getAllTransactions, processNFTStatuses } from '../services/etherscanService';
import Header from './Header';
import './NFTGrid.css';
import Joystick from './Joystick';

const CONTRACT_ADDRESS = '0xfAa0e99EF34Eae8b288CFEeAEa4BF4f5B5f2eaE7';
const BAYC_CONTRACT = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';

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
          .map(([tokenId, data]) => ({
            tokenId,
            owner: data.owner,
            timestamp: data.timestamp
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setLatestMints(latest);

        setItems(prevItems => prevItems.map(item => ({
          ...item,
          isMinted: nftStatuses.has(item.id),
          owner: nftStatuses.get(item.id)?.owner || null
        })));
        
        setProgress(100);
        setFadeOut(true);
        setTimeout(() => setLoading(false), 1500);
      } catch (error) {
        console.error('Error in fetchMintedStatus:', error);
        setFadeOut(true);
        setTimeout(() => setLoading(false), 1500);
      }
    };

    fetchMintedStatus();
  }, []);

  return (
    <>
      <div className="nft-grid-wrapper">
        <div className="nft-grid">
          {items.map(item => (
            <div 
              key={item.id} 
              className={`nft-cell ${item.isMinted ? 'minted' : 'unminted'}`}
              onClick={(e) => {
                e.preventDefault();
                window.open(item.isMinted ? item.etherscanUrl : item.baycUrl, '_blank', 'noopener,noreferrer');
              }}
              title={item.isMinted ? `#${item.id} - Owned by ${item.owner}` : `#${item.id} - Original BAYC`}
            >
              <img 
                src={item.isMinted ? item.imageUrl : '/placeholder.png'}
                alt={`#${item.id}`}
                loading="lazy"
                onError={(e) => {
                  e.target.src = '/placeholder.png';
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <Joystick />
      <Header mintedCount={mintedCount} latestMints={latestMints} />
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