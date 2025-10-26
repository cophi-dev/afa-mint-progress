import React, { useState, useEffect } from 'react';
import { Box, Typography, Link, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess, TrendingUp } from '@mui/icons-material';
import Draggable from 'react-draggable';
import { PLACEHOLDER_DATA_URL } from '../constants/images';
import './MintProgress.css';
import imageCids from '../data/image_cids.json';

const CONTRACT_ADDRESS = '0xfAa0e99EF34Eae8b288CFEeAEa4BF4f5B5f2eaE7';

const MintProgress = ({ mintedCount, latestMints }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768); // Auto-collapse on mobile initially

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Auto-collapse on mobile, auto-expand on desktop
      if (mobile && !isCollapsed) {
        setIsCollapsed(true);
      } else if (!mobile && isCollapsed) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

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
    <Box className={`mint-progress ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : 'desktop'}`}>
      <Box className="drag-handle">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          minHeight: isMobile ? 56 : 'auto',
          py: isMobile ? 1 : 0
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? 1.5 : 1,
            flex: 1
          }}>
            <TrendingUp sx={{ 
              color: '#4CAF50', 
              fontSize: isMobile ? '24px' : '18px' 
            }} />
            <Typography 
              sx={{ 
                color: '#fff', 
                fontSize: isMobile ? '18px' : '16px',
                fontFamily: 'monospace',
                fontWeight: isMobile ? 600 : 500,
                lineHeight: 1.2
              }}
            >
              AFA Progress {mintedCount} / 10000
            </Typography>
          </Box>
          
          <IconButton
            onClick={() => setIsCollapsed(!isCollapsed)}
            size={isMobile ? "medium" : "small"}
            sx={{ 
              color: '#999',
              minWidth: isMobile ? 48 : 'auto',
              minHeight: isMobile ? 48 : 'auto',
              borderRadius: isMobile ? 2 : 1,
              '&:hover': {
                color: '#fff',
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {isCollapsed ? 
              <ExpandMore sx={{ fontSize: isMobile ? '24px' : '20px' }} /> : 
              <ExpandLess sx={{ fontSize: isMobile ? '24px' : '20px' }} />
            }
          </IconButton>
        </Box>
      </Box>
      
      {/* Collapsed state indicator for mobile */}
      {isMobile && isCollapsed && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          py: 1,
          color: '#666',
          fontSize: '12px'
        }}>
          <Typography sx={{ 
            fontSize: '12px', 
            color: '#666',
            fontFamily: 'monospace'
          }}>
            Tap to view latest mints
          </Typography>
        </Box>
      )}

      <Collapse in={!isCollapsed}>
        <Box sx={{ mt: isMobile ? 3 : 2 }}>
          <Typography
            sx={{
              color: '#666',
              mb: isMobile ? 2 : 1,
              fontSize: isMobile ? '16px' : '14px',
              fontFamily: 'monospace',
              fontWeight: 500
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
                mb: isMobile ? 2 : 1.5,
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
                  gap: isMobile ? 2 : 1.5,
                  p: isMobile ? 1.5 : 0.75,
                  borderRadius: isMobile ? 2 : 1,
                  transition: 'all 0.2s ease-in-out',
                  minHeight: isMobile ? 64 : 'auto',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    transform: isMobile ? 'none' : 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: isMobile ? 'scale(0.98)' : 'none',
                  }
                }}
              >
                <Box 
                  component="img"
                  src={`/images/${mint.tokenId}.png`}
                  alt={`AFA #${mint.tokenId}`}
                  sx={{
                    width: isMobile ? 48 : 36,
                    height: isMobile ? 48 : 36,
                    borderRadius: isMobile ? '8px' : '6px',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  onError={(e) => {
                    // If local image fails, try IPFS as fallback
                    if (!e.target.dataset.triedIpfs && imageCids[mint.tokenId]) {
                      e.target.dataset.triedIpfs = 'true';
                      e.target.src = `https://ipfs.io/ipfs/${imageCids[mint.tokenId]}`;
                      return;
                    }
                    
                    // Face.png data URL should work everywhere - no fallback needed
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    sx={{ 
                      color: '#999',
                      fontSize: isMobile ? '16px' : '14px',
                      fontFamily: 'monospace',
                      fontWeight: 500,
                      lineHeight: 1.3,
                      mb: isMobile ? 0.5 : 0
                    }}
                  >
                    Token #{mint.tokenId}
                  </Typography>
                  <Typography 
                    sx={{ 
                      color: '#666',
                      fontSize: isMobile ? '14px' : '12px',
                      fontFamily: 'monospace',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {formatDate(mint.timestamp)}
                  </Typography>
                </Box>
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
