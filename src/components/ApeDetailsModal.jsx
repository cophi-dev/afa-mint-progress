import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Card, CardMedia, IconButton, Button, Chip, Skeleton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LaunchIcon from '@mui/icons-material/Launch';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { getBaycMetadataAsync, loadBaycMapping } from '../data/baycMetadata';
import { getAfaIpfsUrl, getAfaThumbnailFallbackUrl, preloadImage } from '../utils/imageUrls';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: 'calc(100% - 20px)', md: '90%' },
  maxWidth: '920px',
  maxHeight: { xs: 'min(92dvh, 720px)', md: '90vh' },
  bgcolor: '#1E1E1E',
  borderRadius: { xs: '14px', md: '16px' },
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  overflow: 'hidden',
  p: 0,
  outline: 'none',
};

const cardStyle = {
  background: 'transparent',
  boxShadow: 'none',
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  maxHeight: { xs: 'min(92dvh, 720px)', md: '90vh' },
  overflow: { xs: 'auto', md: 'hidden' },
  WebkitOverflowScrolling: 'touch',
};

const imageContainerStyle = {
  flexShrink: 0,
  width: { xs: '100%', md: 'min(52vw, calc(90vh - 32px))' },
  maxWidth: { md: '480px' },
  aspectRatio: '1',
  position: 'relative',
  backgroundColor: '#000',
  overflow: 'hidden',
};

const imageStyle = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const infoBoxStyle = {
  bgcolor: '#363636',
  borderRadius: 1.5,
  px: 1.5,
  py: 1,
};

const contentStyle = {
  flex: 1,
  minWidth: 0,
  bgcolor: '#2A2A2A',
  p: { xs: 2, md: 3 },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: 1.5, md: 2 },
  overflowY: { xs: 'visible', md: 'auto' },
  maxHeight: { xs: 'none', md: '90vh' },
};

const arrowButtonStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  bgcolor: 'rgba(0,0,0,0.3)',
  color: 'white',
  width: { xs: 40, md: 'auto' },
  height: { xs: 40, md: 'auto' },
  '&:hover': {
    bgcolor: 'rgba(0,0,0,0.5)',
  },
  '&.Mui-disabled': {
    display: 'none',
  },
};

const ApeDetailsModal = ({ open, onClose, apeData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [baycMetadata, setBaycMetadata] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [afaImageUrl, setAfaImageUrl] = useState(null);
  const [baycImageUrl, setBaycImageUrl] = useState(null);
  const [imageReady, setImageReady] = useState(false);
  const maxSteps = 2;

  useEffect(() => {
    if (open) {
      setActiveStep(0);
    }
  }, [open, apeData?.tokenId]);

  useEffect(() => {
    if (!open || !apeData) {
      setBaycMetadata(null);
      setAfaImageUrl(null);
      setBaycImageUrl(null);
      setImageReady(false);
      return undefined;
    }

    let cancelled = false;
    const { tokenId, image, baycImage, isMinted } = apeData;

    setAfaImageUrl(image);
    setBaycImageUrl(baycImage);
    setImageReady(false);
    setMetadataLoading(true);

    const load = async () => {
      const [, metadata] = await Promise.all([
        preloadImage(image),
        getBaycMetadataAsync(tokenId),
      ]);

      if (cancelled) return;

      setBaycMetadata(metadata);
      setMetadataLoading(false);
      setImageReady(true);

      preloadImage(baycImage);

      if (isMinted) {
        const ipfsUrl = await getAfaIpfsUrl(tokenId, true);
        if (!cancelled && ipfsUrl) {
          preloadImage(ipfsUrl).then(() => {
            if (!cancelled) setAfaImageUrl(ipfsUrl);
          });
        }
      }
    };

    load();
    loadBaycMapping();

    return () => {
      cancelled = true;
    };
  }, [open, apeData]);

  if (!apeData) return null;

  const isAfaStep = activeStep === 0;
  const showAfaBlur = isAfaStep && !apeData.isMinted;

  const images = [
    {
      title: 'AFA Version',
      url: afaImageUrl,
    },
    {
      title: 'Original BAYC',
      url: baycImageUrl,
    },
  ];

  const currentImage = images[activeStep];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleImageError = async (e) => {
    const img = e.target;
    const stage = img.dataset.fallbackStage || 'webp';

    if (activeStep === 0) {
      if (stage === 'webp') {
        img.dataset.fallbackStage = 'png';
        img.src = getAfaThumbnailFallbackUrl(apeData.tokenId);
        return;
      }
      if (stage === 'png' && apeData.isMinted) {
        img.dataset.fallbackStage = 'ipfs';
        const ipfsUrl = await getAfaIpfsUrl(apeData.tokenId, true);
        if (ipfsUrl) img.src = ipfsUrl;
      }
      return;
    }

    if (img.dataset.fallbackStage === 'bayc-done') return;
    img.dataset.fallbackStage = 'bayc-done';

    const metadata = baycMetadata ?? await getBaycMetadataAsync(apeData.tokenId);
    if (metadata?.image) {
      img.src = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
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
            {!imageReady && (
              <Skeleton
                variant="rectangular"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  bgcolor: 'rgba(255,255,255,0.06)',
                }}
              />
            )}
            {currentImage.url && (
              <CardMedia
                component="img"
                image={currentImage.url}
                alt={`${currentImage.title} #${apeData.tokenId}`}
                onError={handleImageError}
                sx={{
                  ...imageStyle,
                  opacity: imageReady ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                  ...(showAfaBlur && {
                    filter: 'blur(20px)',
                    transform: 'scale(1.08)',
                  }),
                }}
              />
            )}
            {showAfaBlur && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  px: 3,
                  textAlign: 'center',
                  background: 'rgba(0, 0, 0, 0.35)',
                  pointerEvents: 'none',
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  Not yet minted
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255,255,255,0.85)',
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  Mint your AFA to reveal the full artwork
                </Typography>
              </Box>
            )}
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                position: 'absolute',
                top: 16,
                left: 16,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                zIndex: 1,
              }}
            >
              {currentImage.title}
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

          <Box sx={contentStyle}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                AFA #{apeData.tokenId}
              </Typography>

              {apeData.isMinted ? (
                <Chip
                  label="Minted"
                  size="small"
                  sx={{
                    bgcolor: '#6ee7a0',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              ) : (
                <Chip
                  label="Not Minted"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 183, 77, 0.2)',
                    color: '#ffb74d',
                    border: '1px solid rgba(255, 183, 77, 0.4)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
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
                      minute: '2-digit',
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

            {metadataLoading && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5 }}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={40} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                ))}
              </Box>
            )}

            {!metadataLoading && baycMetadata?.attributes && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#888',
                    mb: 0.75,
                    display: 'block',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Attributes
                </Typography>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 0.5,
                  maxHeight: 140,
                  overflowY: 'auto',
                  pr: 0.5,
                  '&::-webkit-scrollbar': { width: 4 },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: 2,
                  },
                }}>
                  {baycMetadata.attributes.map((attr, index) => (
                    <Box
                      key={index}
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: 'rgba(255, 255, 255, 0.06)',
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        noWrap
                        sx={{ color: '#777', fontSize: '0.625rem', lineHeight: 1.2, display: 'block' }}
                      >
                        {attr.trait_type}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{ color: '#eee', fontSize: '0.7rem', fontWeight: 500, lineHeight: 1.3 }}
                      >
                        {attr.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {apeData.isMinted && apeData.editorUrl && (
              <Box sx={{ mt: 'auto', pt: 1 }}>
                <Button
                  variant="contained"
                  component="a"
                  href={apeData.editorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  fullWidth
                  startIcon={<LaunchIcon />}
                  sx={{
                    bgcolor: '#3f51b5',
                    color: '#fff',
                    py: 1.25,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    '&:hover': {
                      bgcolor: '#303f9f',
                    },
                  }}
                >
                  Open in Editor
                </Button>
              </Box>
            )}

            {!apeData.isMinted && apeData.claimUrl && (
              <Box sx={{ mt: 'auto' }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: '#999',
                    mb: 1,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  Ready to mint?
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#bbb', mb: 2, lineHeight: 1.6 }}
                >
                  Your AFA is waiting. Claim and mint #{apeData.tokenId} to unlock the full artwork.
                </Typography>
                <Button
                  variant="contained"
                  component="a"
                  href={apeData.claimUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  fullWidth
                  startIcon={<LaunchIcon />}
                  sx={{
                    bgcolor: '#6ee7a0',
                    color: '#0d0f12',
                    py: 1.25,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    '&:hover': {
                      bgcolor: '#34d399',
                    },
                  }}
                >
                  Mint Your AFA
                </Button>
              </Box>
            )}
          </Box>
        </Card>
      </Box>
    </Modal>
  );
};

export default ApeDetailsModal;
