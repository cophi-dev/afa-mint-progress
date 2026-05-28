import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TuneIcon from '@mui/icons-material/Tune';
import './ControlPanel.css';

const sectionLabelSx = {
  color: 'rgba(255,255,255,0.45)',
  mb: 0.75,
  fontSize: '0.65rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const mobileSectionLabelSx = {
  ...sectionLabelSx,
  fontSize: '0.7rem',
  mb: 1,
};

const sliderSx = {
  color: '#6ee7a0',
  height: 4,
  mt: 0.25,
  '& .MuiSlider-track': { height: 4, backgroundColor: '#6ee7a0' },
  '& .MuiSlider-rail': { height: 4, backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  '& .MuiSlider-thumb': {
    width: 14,
    height: 14,
    backgroundColor: '#6ee7a0',
    border: '2px solid #fff',
    '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 5px rgba(110, 231, 160, 0.18)' },
    '&.Mui-active': { boxShadow: '0 0 0 7px rgba(110, 231, 160, 0.24)' },
  },
  '& .MuiSlider-mark': {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    width: 4,
    height: 4,
    borderRadius: '50%',
  },
  '& .MuiSlider-markLabel': {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '9px',
    fontWeight: 500,
  },
};

const mobileSliderSx = {
  ...sliderSx,
  height: 6,
  py: 1,
  '& .MuiSlider-track': { height: 6 },
  '& .MuiSlider-rail': { height: 6 },
  '& .MuiSlider-thumb': {
    width: 22,
    height: 22,
    '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 8px rgba(110, 231, 160, 0.2)' },
    '&.Mui-active': { boxShadow: '0 0 0 12px rgba(110, 231, 160, 0.28)' },
  },
  '& .MuiSlider-mark': { width: 5, height: 5 },
  '& .MuiSlider-markLabel': { fontSize: '10px', mt: 0.75 },
};

const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: '#6ee7a0' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#6ee7a0' },
  '& .MuiSwitch-track': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  '& .MuiSwitch-thumb': { backgroundColor: '#fff' },
};

const mobileSwitchSx = {
  ...switchSx,
  transform: 'scale(1.05)',
  mr: -0.5,
};

const ControlPanel = ({
  onTokenSearch,
  onZoomChange,
  onShowBayc,
  zoom = 16,
  showBayc = false,
  isMobile = false,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    if (isMobile) {
      setIsMinimized(false);
      setIsExpanded(false);
    } else {
      setIsMinimized(true);
      setIsExpanded(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) return undefined;

    const root = document.documentElement;
    root.style.setProperty(
      '--mobile-controls-offset',
      isExpanded ? 'min(50dvh, 380px)' : 'calc(52px + env(safe-area-inset-bottom, 0px))'
    );

    return () => {
      root.style.removeProperty('--mobile-controls-offset');
    };
  }, [isMobile, isExpanded]);

  const handleSearch = (e) => {
    e.preventDefault();
    const tokenId = parseInt(searchValue, 10);
    if (!Number.isNaN(tokenId) && tokenId >= 0 && tokenId < 10000) {
      onTokenSearch(tokenId);
      if (isMobile) setIsExpanded(false);
    }
  };

  const toggleMobileExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  const textFieldSx = {
    color: '#fff',
    fontSize: isMobile ? '16px' : '0.8125rem',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.22)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#6ee7a0',
      borderWidth: 1,
    },
    '& .MuiInputBase-input': {
      py: isMobile ? 1.25 : 0.875,
      px: 1.25,
    },
  };

  const panelContent = (
    <>
      <Box sx={{ mb: isMobile ? 2.5 : 2 }}>
        <Typography sx={isMobile ? mobileSectionLabelSx : sectionLabelSx}>Jump to token</Typography>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth
            size="small"
            placeholder="#0 – 9999"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            inputMode="numeric"
            InputProps={{
              endAdornment: (
                <IconButton
                  type="submit"
                  size="small"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    p: isMobile ? 1 : 0.5,
                    minWidth: isMobile ? 44 : 'auto',
                    minHeight: isMobile ? 44 : 'auto',
                    '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  <SearchIcon sx={{ fontSize: isMobile ? 20 : 16 }} />
                </IconButton>
              ),
              sx: textFieldSx,
            }}
          />
        </form>
      </Box>

      <Box sx={{ mb: isMobile ? 2.5 : 1.75 }}>
        <Typography
          sx={{
            ...(isMobile ? mobileSectionLabelSx : sectionLabelSx),
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <ZoomInIcon sx={{ fontSize: isMobile ? 14 : 12 }} />
          Zoom · {zoom}px
        </Typography>
        <Slider
          value={zoom}
          onChange={(_e, newValue) => onZoomChange(newValue)}
          min={16}
          max={64}
          step={16}
          marks={[
            { value: 16, label: '16' },
            { value: 32, label: '32' },
            { value: 48, label: '48' },
            { value: 64, label: '64' },
          ]}
          sx={isMobile ? mobileSliderSx : sliderSx}
        />
      </Box>

      {isMobile ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 44,
            px: 0.25,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.45)' }} />
            <Typography sx={{ fontSize: '0.875rem', color: '#fff', fontWeight: 500 }}>
              Show Original BAYC
            </Typography>
          </Box>
          <Switch
            checked={showBayc}
            onChange={(e) => onShowBayc(e.target.checked)}
            sx={mobileSwitchSx}
          />
        </Box>
      ) : (
        <FormControlLabel
          control={
            <Switch
              checked={showBayc}
              onChange={(e) => onShowBayc(e.target.checked)}
              size="small"
              sx={switchSx}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <VisibilityIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }} />
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#fff' }}>
                Show Original BAYC
              </Typography>
            </Box>
          }
          sx={{ m: 0, color: '#fff' }}
        />
      )}
    </>
  );

  if (!isMobile && isMinimized) {
    return (
      <Tooltip title="Controls" placement="left">
        <IconButton
          className="control-panel-trigger"
          onClick={() => setIsMinimized(false)}
          aria-label="Open controls"
          sx={{
            position: 'fixed',
            top: 14,
            right: 14,
            zIndex: 1600,
            width: 36,
            height: 36,
            bgcolor: 'rgba(16, 18, 22, 0.82)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            color: 'rgba(255,255,255,0.65)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.28)',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(24, 26, 30, 0.92)',
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.14)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            },
          }}
        >
          <TuneIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Paper
      className={`control-panel ${isMobile ? 'mobile' : 'desktop'}${isMobile && isExpanded ? ' expanded' : ''}${isMobile && !isExpanded ? ' collapsed' : ''}`}
      elevation={0}
      sx={{
        position: 'fixed',
        top: isMobile ? 'auto' : 14,
        bottom: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 14,
        left: isMobile ? 0 : 'auto',
        width: isMobile ? '100%' : 252,
        maxHeight: isMobile ? 'min(50dvh, 380px)' : 'calc(100vh - 28px)',
        overflow: isMobile && !isExpanded ? 'hidden' : 'auto',
        bgcolor: 'rgba(16, 18, 22, 0.92)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
        borderTop: isMobile ? '1px solid rgba(255, 255, 255, 0.1)' : undefined,
        zIndex: 1600,
        transition: 'max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.28s ease',
        borderRadius: isMobile ? '18px 18px 0 0' : '12px',
        boxShadow: isMobile
          ? '0 -8px 32px rgba(0, 0, 0, 0.42)'
          : '0 4px 24px rgba(0, 0, 0, 0.32)',
        paddingBottom: isMobile ? 'max(10px, env(safe-area-inset-bottom))' : 0,
      }}
    >
      <Box
        className="control-panel-inner"
        sx={{
          px: isMobile ? 2 : 1.75,
          pt: isMobile ? 1 : 1.5,
          pb: isMobile ? 1.25 : 1.5,
        }}
      >
        {isMobile && (
          <Box
            className="control-panel-drag-handle"
            onClick={toggleMobileExpanded}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMobileExpanded();
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse controls' : 'Expand controls'}
          />
        )}

        <Box
          component={isMobile ? 'button' : 'div'}
          type={isMobile ? 'button' : undefined}
          onClick={isMobile ? toggleMobileExpanded : undefined}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            mb: isMobile && !isExpanded ? 0 : 1.5,
            minHeight: isMobile ? 44 : 28,
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: isMobile ? 'pointer' : 'default',
            textAlign: 'left',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <TuneIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Controls
            </Typography>
            {isMobile && !isExpanded && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 0.5 }}>
                <Box className="control-panel-badge">{zoom}px</Box>
                {showBayc && <Box className="control-panel-badge accent">BAYC</Box>}
              </Box>
            )}
          </Box>

          {!isMobile ? (
            <IconButton
              onClick={() => setIsMinimized(true)}
              aria-label="Minimize controls"
              sx={{
                color: 'rgba(255,255,255,0.4)',
                p: 0.5,
                width: 28,
                height: 28,
                '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.06)' },
              }}
              size="small"
            >
              <ExpandLessIcon sx={{ fontSize: 18 }} />
            </IconButton>
          ) : (
            <Box
              sx={{
                color: 'rgba(255,255,255,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                flexShrink: 0,
              }}
            >
              {isExpanded ? (
                <ExpandLessIcon sx={{ fontSize: 22 }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 22 }} />
              )}
            </Box>
          )}
        </Box>

        <Collapse in={isMobile ? isExpanded : true} timeout={280}>
          <Box sx={{ pb: isMobile ? 0.5 : 0 }}>{panelContent}</Box>
        </Collapse>
      </Box>
    </Paper>
  );
};

export default ControlPanel;
