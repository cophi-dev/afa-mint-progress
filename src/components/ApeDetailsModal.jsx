import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Card, CardMedia, CardContent, IconButton, Button, Chip, MobileStepper, Fade } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LaunchIcon from '@mui/icons-material/Launch';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { useTheme } from '@mui/material/styles';
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
  flex: 1,
  position: 'relative',
  backgroundColor: '#000',
  display: 'flex',
  flexDirection: 'column',
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

const stepperStyle = {
  position: 'absolute',
  bottom: 0,
  width: '100%',
  bgcolor: 'rgba(0,0,0,0.5)',
  padding: '8px',
  '& .MuiMobileStepper-dot': {
    bgcolor: 'rgba(255, 255, 255, 0.3)',
    margin: '0 4px',
  },
  '& .MuiMobileStepper-dotActive': {
    bgcolor: '#fff',
  },
  '& .MuiButton-root': {
    color: '#fff',
    '&.Mui-disabled': {
      color: 'rgba(255, 255, 255, 0.3)',
    }
  }
};

const arrowButtonStyle = {
  position: 'absolute',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: 'white',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  height: '60px',
  width: '60px',
  zIndex: 2,
};

const convertIpfsUrl = (ipfsUrl) => {
  if (!ipfsUrl) return null;
  if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return ipfsUrl;
};

const ApeDetailsModal = ({ open, onClose, apeData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [images, setImages] = useState([]);
  const theme = useTheme();

  useEffect(() => {
    const loadImages = async () => {
      if (!apeData) return;

      const imageUrls = [];
      
      if (!apeData.isMinted) {
        const metadata = getBaycMetadata(apeData.tokenId);
        if (metadata?.image) {
          const baycUrl = convertIpfsUrl(metadata.image);
          if (baycUrl) imageUrls.push(baycUrl);
        }
        imageUrls.push('/face.png');
      } else {
        if (apeData.image) {
          imageUrls.push(apeData.image);
        }
        const metadata = getBaycMetadata(apeData.tokenId);
        if (metadata?.image) {
          const baycUrl = convertIpfsUrl(metadata.image);
          if (baycUrl) imageUrls.push(baycUrl);
        }
      }

      setImages(imageUrls);
    };

    loadImages();
  }, [apeData]);

  if (!apeData) return null;

  const handleNext = () => {
    setActiveStep((prevStep) => (prevStep + 1) % images.length);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => (prevStep - 1 + images.length) % images.length);
  };

  const handleEtherscanClick = () => {
    window.open(apeData.isMinted ? apeData.etherscanUrl : apeData.baycUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'fixed',
            right: '24px',
            top: '24px',
            color: '#fff',
            zIndex: 9999,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.9)',
            },
            padding: '8px',
          }}
        >
          <CloseIcon sx={{ fontSize: 32 }} />
        </IconButton>

        <Box 
          sx={style} 
          onClick={(e) => e.stopPropagation()}
        >
          <Card sx={cardStyle}>
            <Box sx={imageContainerStyle}>
              {images.length > 1 && (
                <IconButton
                  onClick={handleBack}
                  sx={{
                    ...arrowButtonStyle,
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <KeyboardArrowLeft sx={{ fontSize: 40 }} />
                </IconButton>
              )}

              {images.length > 1 && (
                <IconButton
                  onClick={handleNext}
                  sx={{
                    ...arrowButtonStyle,
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <KeyboardArrowRight sx={{ fontSize: 40 }} />
                </IconButton>
              )}

              <CardMedia
                component="img"
                image={images[activeStep] || '/placeholder.png'}
                alt={`Ape ${apeData.tokenId}`}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
              
              {images.length > 1 && (
                <MobileStepper
                  steps={images.length}
                  position="static"
                  activeStep={activeStep}
                  sx={stepperStyle}
                  nextButton={null}
                  backButton={null}
                />
              )}
            </Box>

            <Box sx={{
              flex: 1,
              p: 3,
              display: 'flex',
              flexDirection: 'column'
            }}>
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
      </>
    </Modal>
  );
};

export default ApeDetailsModal; 