import React, { useState, useEffect } from 'react';
import { getAllTransactions, processNFTStatuses } from '../services/etherscanService';
import Header from './Header';
import ApeDetailsModal from './ApeDetailsModal';
import './NFTGrid.css';
import { ethers } from 'ethers';
import imageCids from '../data/image_cids.json';

const CONTRACT_ADDRESS = '0xfAa0e99EF34Eae8b288CFEeAEa4BF4f5B5f2eaE7';
const BAYC_CONTRACT = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY;
const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;

const provider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com');

const getAfaImageUrl = (tokenId) => {
  console.log('Getting AFA image URL for token:', tokenId);
  console.log('Available CIDs:', imageCids);
  const cid = imageCids[tokenId];
  console.log('Found CID:', cid);
  if (cid) {
    const url = `https://${cid}.ipfs.nftstorage.link`;
    console.log('Generated URL:', url);
    return url;
  }
  console.log('No CID found for token:', tokenId);
  return null;
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

  const handleApeClick = async (e, item) => {
    e.preventDefault();
    
    try {
      let ensName = null;
      if (item.owner) {
        try {
          ensName = await provider.lookupAddress(item.owner);
        } catch (error) {
          console.error('Error fetching ENS:', error);
        }
      }

      let mintDate = null;
      let imageUrl = null;

      if (item.isMinted) {
        // Get mint date from transactions data
        const mintInfo = latestMints.find(mint => mint.tokenId === item.id);
        if (mintInfo) {
          mintDate = new Date(mintInfo.timestamp * 1000);
        }

        // Get the correct IPFS URL for the minted AFA
        console.log('Getting image for minted AFA:', item.id);
        imageUrl = getAfaImageUrl(item.id.toString());
        console.log('Got image URL:', imageUrl);
        if (!imageUrl) {
          console.log('Falling back to local image:', item.imageUrl);
          imageUrl = item.imageUrl;
        }

        // Verify token exists using Etherscan
        try {
          const response = await fetch(
            `https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${CONTRACT_ADDRESS}&address=${item.owner}&apikey=${ETHERSCAN_API_KEY}`
          );
          const data = await response.json();
          console.log("Etherscan NFT transfer response:", data);
        } catch (error) {
          console.error('Error verifying token:', error);
        }
      } else {
        // For unminted apes, use the BAYC image with nft.storage gateway
        const baycCid = 'QmYxT4LnK8sqLupjbS6eRvu1si7Ly2wFQAqFebxhWntd5g';
        imageUrl = `https://${baycCid}.ipfs.nftstorage.link/${item.id}`;
      }

      setSelectedApe({
        tokenId: item.id,
        image: imageUrl,
        owner: item.owner,
        ensName: ensName,
        mintDate: mintDate,
        etherscanUrl: item.etherscanUrl,
        isMinted: item.isMinted,
        baycUrl: item.baycUrl
      });
      setModalOpen(true);
    } catch (error) {
      console.error('Error preparing ape data:', error);
      // Fallback to appropriate image based on minted status
      const fallbackImage = item.isMinted 
        ? (getAfaImageUrl(item.id.toString()) || item.imageUrl)
        : `https://QmYxT4LnK8sqLupjbS6eRvu1si7Ly2wFQAqFebxhWntd5g.ipfs.nftstorage.link/${item.id}`;
      
      setSelectedApe({
        tokenId: item.id,
        image: fallbackImage,
        owner: item.owner,
        etherscanUrl: item.etherscanUrl,
        isMinted: item.isMinted,
        baycUrl: item.baycUrl
      });
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedApe(null);
  };

  return (
    <>
      <div className="nft-grid-wrapper">
        <div className="nft-grid">
          {items.map(item => (
            <div 
              key={item.id} 
              className={`nft-cell ${item.isMinted ? 'minted' : 'unminted'}`}
              onClick={(e) => handleApeClick(e, item)}
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

      <ApeDetailsModal
        open={modalOpen}
        handleClose={handleCloseModal}
        apeData={selectedApe}
      />

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