import React from 'react';
import { Modal, Box, Typography, Card, CardMedia, CardContent, IconButton, Button, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LaunchIcon from '@mui/icons-material/Launch';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '1000px',
  maxHeight: '90vh',
  bgcolor: '#1E1E1E',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  overflow: 'hidden',
};

const cardStyle = {
  background: 'transparent',
  boxShadow: 'none',
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  height: '100%',
};

const imageContainerStyle = {
  width: { xs: '100%', md: '60%' },
  position: 'relative',
  backgroundColor: '#000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const imageStyle = {
  width: '100%',
  height: 'auto',
  maxHeight: '80vh',
  objectFit: 'contain',
};

const contentStyle = {
  width: { xs: '100%', md: '40%' },
  bgcolor: '#2A2A2A',
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const infoBoxStyle = {
  bgcolor: '#363636',
  borderRadius: 2,
  p: 2,
};

const ApeDetailsModal = ({ open, handleClose, apeData }) => {
  if (!apeData) return null;

  const handleEtherscanClick = () => {
    window.open(apeData.isMinted ? apeData.etherscanUrl : apeData.baycUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="ape-details-modal"
    >
      <Box sx={style}>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: '#fff',
            zIndex: 2,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        <Card sx={cardStyle}>
          <Box sx={imageContainerStyle}>
            <CardMedia
              component="img"
              image={apeData.image}
              alt={`Ape #${apeData.tokenId}`}
              sx={imageStyle}
            />
          </Box>

          <Box sx={contentStyle}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  mb: 2,
                  color: '#fff',
                }}
              >
                {apeData.isMinted ? 'Minted AFA' : 'Original BAYC'} #{apeData.tokenId}
              </Typography>
              
              {apeData.isMinted && (
                <Chip 
                  label="Minted" 
                  sx={{ 
                    bgcolor: '#4CAF50',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }} 
                />
              )}
            </Box>

            {apeData.isMinted && apeData.mintDate && (
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: '#999',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '0.875rem',
                  }}
                >
                  <CalendarTodayIcon fontSize="small" />
                  Minted on
                </Typography>
                <Box sx={infoBoxStyle}>
                  <Typography sx={{ color: '#fff' }}>
                    {new Date(apeData.mintDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Box>
              </Box>
            )}

            <Box>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: '#999',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '0.875rem',
                }}
              >
                <AccountBalanceWalletIcon fontSize="small" />
                {apeData.isMinted ? 'Owner' : 'Original Owner'}
              </Typography>
              <Box sx={infoBoxStyle}>
                {apeData.ensName && (
                  <Typography 
                    sx={{ 
                      color: '#fff',
                      mb: 1,
                      fontWeight: 500,
                    }}
                  >
                    {apeData.ensName}
                  </Typography>
                )}
                <Typography 
                  sx={{ 
                    color: apeData.ensName ? '#999' : '#fff',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    wordBreak: 'break-all',
                  }}
                >
                  {apeData.owner || 'N/A'}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              startIcon={<LaunchIcon />}
              onClick={handleEtherscanClick}
              sx={{
                mt: 'auto',
                bgcolor: '#3f51b5',
                color: '#fff',
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                '&:hover': {
                  bgcolor: '#303f9f',
                },
              }}
            >
              View on {apeData.isMinted ? 'Etherscan' : 'BAYC'}
            </Button>
          </Box>
        </Card>
      </Box>
    </Modal>
  );
};

export default ApeDetailsModal; 