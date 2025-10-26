import React, { useState } from 'react';
import { Modal, Box, Typography, Card, CardMedia, IconButton, Button, Chip, MobileStepper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LaunchIcon from '@mui/icons-material/Launch';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { getBaycMetadata } from '../data/baycMetadata';

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
  overflow: 'auto',
  p: 0,
};

const cardStyle = {
  background: 'transparent',
  boxShadow: 'none',
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  height: '100%',
};

const imageContainerStyle = {
  width: '60%',
  position: 'relative',
  backgroundColor: '#000',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
  },
};

const infoBoxStyle = {
  bgcolor: '#363636',
  borderRadius: 2,
  p: 2,
};

const contentStyle = {
  width: { xs: '100%', md: '40%' },
  bgcolor: '#2A2A2A',
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const arrowButtonStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  bgcolor: 'rgba(0,0,0,0.3)',
  color: 'white',
  '&:hover': {
    bgcolor: 'rgba(0,0,0,0.5)',
  },
  '&.Mui-disabled': {
    display: 'none',
  },
};

const ApeDetailsModal = ({ open, onClose, apeData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const maxSteps = 2;

  if (!apeData) return null;

  const baycMetadata = getBaycMetadata(apeData.tokenId);
  const baycImageUrl = baycMetadata?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/');

  const images = [
    { 
      title: 'AFA Version',
      url: apeData.image 
    },
    { 
      title: 'Original BAYC',
      url: baycImageUrl
    }
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleEtherscanClick = () => {
    const url = `https://etherscan.io/token/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d?a=${apeData.tokenId}`;
    window.open(url, '_blank');
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            zIndex: 1,
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.7)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        <Card sx={cardStyle}>
          <Box sx={imageContainerStyle}>
            <Box sx={{ 
              position: 'relative', 
              width: '100%',
              height: '100%'
            }}>
              <CardMedia
                component="img"
                image={images[activeStep].url}
                alt={`${images[activeStep].title} #${apeData.tokenId}`}
                sx={imageStyle}
              />
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white',
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                {images[activeStep].title}
              </Typography>
              <IconButton
                onClick={handleBack}
                disabled={activeStep === 0}
                sx={{
                  ...arrowButtonStyle,
                  left: 16,
                }}
              >
                <KeyboardArrowLeft />
              </IconButton>
              <IconButton
                onClick={handleNext}
                disabled={activeStep === maxSteps - 1}
                sx={{
                  ...arrowButtonStyle,
                  right: 16,
                }}
              >
                <KeyboardArrowRight />
              </IconButton>
            </Box>
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

            {/* Attributes Section */}
            {baycMetadata?.attributes && (
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: '#999',
                    mb: 2,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  Attributes
                </Typography>
                <Box sx={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                }}>
                  {baycMetadata.attributes.map((attr, index) => (
                    <Chip
                      key={index}
                      label={`${attr.trait_type}: ${attr.value}`}
                      variant="outlined"
                      sx={{
                        color: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        fontSize: '0.75rem',
                        height: 'auto',
                        '& .MuiChip-label': {
                          padding: '4px 8px',
                        },
                        '&:hover': {
                          borderColor: 'rgba(255, 255, 255, 0.6)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

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