import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Card,
  CardMedia,
  IconButton,
  Button,
  Chip,
  Skeleton,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LaunchIcon from '@mui/icons-material/Launch';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { getBaycMetadataAsync, loadBaycMapping } from '../data/baycMetadata';
import {
  getAfaIpfsUrl,
  getAfaThumbnailFallbackUrl,
  getBaycThumbnailFallbackUrl,
  ipfsToHttpUrl,
  preloadImage,
} from '../utils/imageUrls';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: 'calc(100% - 16px)', md: '90%' },
  maxWidth: '920px',
  maxHeight: {
    xs: 'calc(100dvh - max(12px, env(safe-area-inset-top)) - max(12px, env(safe-area-inset-bottom)))',
    md: '90vh',
  },
  bgcolor: '#1E1E1E',
  borderRadius: { xs: '14px', md: '16px' },
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  overflow: 'hidden',
  p: 0,
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',
};

const cardStyle = {
  background: 'transparent',
  boxShadow: 'none',
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  flex: 1,
  minHeight: 0,
  maxHeight: '100%',
  overflow: { xs: 'hidden', md: 'hidden' },
  WebkitOverflowScrolling: 'touch',
};

const imageContainerStyle = {
  flexShrink: 0,
  width: { xs: '100%', md: 'min(52vw, calc(90vh - 32px))' },
  maxWidth: { md: '480px' },
  height: { xs: 'min(30dvh, 240px)', md: 'auto' },
  aspectRatio: { xs: 'auto', md: '1' },
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
  minHeight: 0,
  bgcolor: '#2A2A2A',
  p: { xs: 1.25, md: 3 },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: 0.75, md: 2 },
  overflowY: { xs: 'hidden', md: 'auto' },
};

const mobileInfoBoxStyle = {
  bgcolor: '#363636',
  borderRadius: 1,
  px: 1,
  py: 0.625,
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
  const isMobile = useMediaQuery('(max-width:768px)');
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
      const metadataPromise = getBaycMetadataAsync(tokenId);
      const afaHighResPromise = isMinted ? getAfaIpfsUrl(tokenId, true) : Promise.resolve(null);
      const [metadata, afaHighRes] = await Promise.all([metadataPromise, afaHighResPromise]);

      if (cancelled) return;

      setBaycMetadata(metadata);

      const baycHighRes = ipfsToHttpUrl(metadata?.image);
      const afaUrl = afaHighRes || getAfaThumbnailFallbackUrl(tokenId) || image;
      const baycUrl = baycHighRes || baycImage;

      await preloadImage(afaUrl);

      if (cancelled) return;

      setAfaImageUrl(afaUrl);
      setBaycImageUrl(baycUrl);
      setMetadataLoading(false);
      setImageReady(true);

      preloadImage(baycUrl);
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

    if (stage === 'webp') {
      img.dataset.fallbackStage = 'png';
      img.src = getBaycThumbnailFallbackUrl(apeData.tokenId);
      return;
    }

    if (img.dataset.fallbackStage === 'bayc-done') return;
    img.dataset.fallbackStage = 'bayc-done';

    const metadata = baycMetadata ?? await getBaycMetadataAsync(apeData.tokenId);
    const baycHighRes = ipfsToHttpUrl(metadata?.image);
    if (baycHighRes) img.src = baycHighRes;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{ zIndex: 1700 }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        },
      }}
    >
      <Box sx={style}>
        <IconButton
          onClick={onClose}
          aria-label="Close details"
          sx={{
            position: 'absolute',
            right: { xs: 6, md: 8 },
            top: { xs: 6, md: 8 },
            color: 'white',
            zIndex: 2,
            width: { xs: 40, md: 'auto' },
            height: { xs: 40, md: 'auto' },
            bgcolor: 'rgba(0,0,0,0.55)',
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
                  variant={isMobile ? 'body1' : 'h5'}
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: isMobile ? '1rem' : undefined,
                    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  Not yet minted
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: isMobile ? '0.75rem' : undefined,
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
                top: { xs: 12, md: 16 },
                left: { xs: 12, md: 16 },
                fontSize: { xs: '0.875rem', md: '1.25rem' },
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
                left: { xs: 8, md: 16 },
              }}
            >
              <KeyboardArrowLeft />
            </IconButton>
            <IconButton
              onClick={handleNext}
              disabled={activeStep === maxSteps - 1}
              sx={{
                ...arrowButtonStyle,
                right: { xs: 8, md: 16 },
              }}
            >
              <KeyboardArrowRight />
            </IconButton>
          </Box>

          <Box sx={contentStyle}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#fff',
                  fontSize: { xs: '1rem', md: '1.5rem' },
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
                    fontSize: '0.6875rem',
                    height: 22,
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
                    fontSize: '0.6875rem',
                    height: 22,
                  }}
                />
              )}

              {isMobile && apeData.isMinted && apeData.mintDate && (
                <Typography
                  sx={{
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: '0.6875rem',
                    fontVariantNumeric: 'tabular-nums',
                    ml: 'auto',
                  }}
                >
                  {new Date(apeData.mintDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Typography>
              )}
            </Box>

            {!isMobile && apeData.isMinted && apeData.mintDate && (
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

            <Box sx={{ flexShrink: 0 }}>
              {!isMobile && (
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
              )}
              <Box sx={isMobile ? mobileInfoBoxStyle : infoBoxStyle}>
                {apeData.ensName && (
                  <Typography
                    sx={{
                      color: '#fff',
                      mb: isMobile ? 0.25 : 1,
                      fontWeight: 500,
                      fontSize: isMobile ? '0.75rem' : '1rem',
                    }}
                    noWrap={isMobile}
                  >
                    {apeData.ensName}
                  </Typography>
                )}
                <Typography
                  noWrap={isMobile}
                  sx={{
                    color: apeData.ensName ? '#999' : '#fff',
                    fontFamily: 'monospace',
                    fontSize: isMobile ? '0.6875rem' : '0.875rem',
                    wordBreak: isMobile ? 'normal' : 'break-all',
                  }}
                >
                  {apeData.owner || 'N/A'}
                </Typography>
              </Box>
            </Box>

            {metadataLoading && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5 }}>
                {Array.from({ length: isMobile ? 4 : 4 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    variant="rounded"
                    height={isMobile ? 28 : 40}
                    sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}
                  />
                ))}
              </Box>
            )}

            {!metadataLoading && baycMetadata?.attributes && (
              <Box sx={{ flex: isMobile ? 1 : 'initial', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                {!isMobile && (
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
                )}
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: isMobile ? 0.375 : 0.5,
                  maxHeight: { xs: 'none', md: 140 },
                  overflowY: { xs: 'hidden', md: 'auto' },
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
                        px: isMobile ? 0.75 : 1,
                        py: isMobile ? 0.375 : 0.5,
                        borderRadius: 1,
                        bgcolor: 'rgba(255, 255, 255, 0.06)',
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        noWrap
                        sx={{
                          color: '#777',
                          fontSize: isMobile ? '0.5625rem' : '0.625rem',
                          lineHeight: 1.2,
                          display: 'block',
                        }}
                      >
                        {attr.trait_type}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{
                          color: '#eee',
                          fontSize: isMobile ? '0.625rem' : '0.7rem',
                          fontWeight: 500,
                          lineHeight: 1.3,
                        }}
                      >
                        {attr.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {apeData.isMinted && apeData.editorUrl && (
              <Box sx={{ mt: 'auto', pt: isMobile ? 0.25 : 1, flexShrink: 0 }}>
                <Button
                  variant="contained"
                  component="a"
                  href={apeData.editorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  fullWidth
                  startIcon={!isMobile && <LaunchIcon />}
                  sx={{
                    bgcolor: '#3f51b5',
                    color: '#fff',
                    py: isMobile ? 0.875 : 1.25,
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontSize: isMobile ? '0.8125rem' : '0.9rem',
                    minHeight: isMobile ? 36 : undefined,
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
              <Box sx={{ mt: 'auto', flexShrink: 0 }}>
                {!isMobile && (
                  <>
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
                  </>
                )}
                <Button
                  variant="contained"
                  component="a"
                  href={apeData.claimUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  fullWidth
                  startIcon={!isMobile && <LaunchIcon />}
                  sx={{
                    bgcolor: '#6ee7a0',
                    color: '#0d0f12',
                    py: isMobile ? 0.875 : 1.25,
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontSize: isMobile ? '0.8125rem' : '0.9rem',
                    fontWeight: 700,
                    minHeight: isMobile ? 36 : undefined,
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
