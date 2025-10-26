import React, { useState, useEffect } from 'react';
import { Box, Typography, Link, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess, TrendingUp } from '@mui/icons-material';
import Draggable from 'react-draggable';
import { PLACEHOLDER_DATA_URL, PLACEHOLDER_CSS_CLASS } from '../constants/images';
import './MintProgress.css';
import imageCids from '../data/image_cids.json';

const CONTRACT_ADDRESS = '0xfAa0e99EF34Eae8b288CFEeAEa4BF4f5B5f2eaE7';

const MintProgress = ({ mintedCount, latestMints }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [isCollapsed, setIsCollapsed] = useState(isMobile); // Auto-collapse on mobile initially

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '/');
  };

  const recentMints = latestMints.slice(0, 3);

  const content = (
    <Box className={`mint-progress ${isCollapsed ? 'collapsed' : ''}`}>
      <Box className="drag-handle">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp sx={{ color: '#4CAF50', fontSize: '18px' }} />
            <Typography 
              sx={{ 
                color: '#fff', 
                fontSize: '16px',
                fontFamily: 'monospace'
              }}
            >
              AFA Progress {mintedCount} / 10000
            </Typography>
          </Box>
          
          <IconButton
            onClick={() => setIsCollapsed(!isCollapsed)}
            size="small"
            sx={{ 
              color: '#999',
              '&:hover': {
                color: '#fff',
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {isCollapsed ? <ExpandMore /> : <ExpandLess />}
          </IconButton>
        </Box>
      </Box>
      
      <Collapse in={!isCollapsed}>
        <Box sx={{ mt: 2 }}>
          <Typography
            sx={{
              color: '#666',
              mb: 1,
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          >
            Latest Mints
          </Typography>
          
          {recentMints.map((mint) => (
            <Link
              key={mint.tokenId}
              href={`https://etherscan.io/token/${CONTRACT_ADDRESS}?a=${mint.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                textDecoration: 'none',
                display: 'block',
                mb: 1.5,
                '&:last-child': {
                  mb: 0
                }
              }}
            >
              <Box 
                className="mint-entry"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  p: 0.75,
                  borderRadius: 1,
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                <Box 
                  component="img"
                  src={`/images/${mint.tokenId}.png`}
                  alt={`AFA #${mint.tokenId}`}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '6px',
                    objectFit: 'cover',
                    flexShrink: 0
                  }}
                  onError={(e) => {
                    // If local image fails, try IPFS as fallback
                    if (!e.target.dataset.triedIpfs && imageCids[mint.tokenId]) {
                      e.target.dataset.triedIpfs = 'true';
                      e.target.src = `https://ipfs.io/ipfs/${imageCids[mint.tokenId]}`;
                      return;
                    }
                    
                    // Use CSS fallback instead of file request - no bottleneck!
                    if (!e.target.dataset.triedCssFallback) {
                      e.target.dataset.triedCssFallback = 'true';
                      e.target.classList.add(PLACEHOLDER_CSS_CLASS);
                      e.target.src = PLACEHOLDER_DATA_URL; // Set to data URL for consistent styling
                      return;
                    }
                  }}
                />
                <Typography 
                  sx={{ 
                    color: '#999',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Token #{mint.tokenId} · {formatDate(mint.timestamp)}
                </Typography>
              </Box>
            </Link>
          ))}
        </Box>
      </Collapse>
    </Box>
  );

  return isMobile ? content : <Draggable>{content}</Draggable>;
};

export default MintProgress;
