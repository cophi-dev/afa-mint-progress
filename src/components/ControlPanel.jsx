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
  Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MinimizeIcon from '@mui/icons-material/Minimize';
import SettingsIcon from '@mui/icons-material/Settings';
import './ControlPanel.css';

const ControlPanel = ({
  onTokenSearch,
  onZoomChange,
  onShowBayc,
  zoom = 16,
  showBayc = false,
  isMobile = false
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(!isMobile);
  const [isMinimized, setIsMinimized] = useState(isMobile); // Auto-minimize on mobile initially

  // Auto-adjust states when mobile changes
  useEffect(() => {
    if (isMobile) {
      setIsMinimized(false); // Show full panel on mobile
      setFiltersExpanded(false); // Start collapsed on mobile
    } else {
      setIsMinimized(false); // Show full panel on desktop
      setFiltersExpanded(true); // Start expanded on desktop
    }
  }, [isMobile]);

  const handleSearch = (e) => {
    e.preventDefault();
    const tokenId = parseInt(searchValue);
    if (!isNaN(tokenId) && tokenId >= 0 && tokenId < 10000) {
      onTokenSearch(tokenId);
    }
  };


  return (
    <Paper 
      className={`control-panel ${isMobile ? 'mobile' : 'desktop'} ${isMinimized ? 'minimized' : ''}`}
      elevation={3}
      sx={{
        position: 'fixed',
        top: isMobile ? 'auto' : 20,
        bottom: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 20,
        left: isMobile ? 0 : 'auto',
        width: isMinimized ? 'auto' : (isMobile ? '100%' : 320),
        maxHeight: isMobile ? '60vh' : '80vh',
        overflow: 'auto',
        bgcolor: 'rgba(20, 20, 20, 0.98)',
        backdropFilter: 'blur(20px)',
        border: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        borderTop: isMobile ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
        zIndex: 1500,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: isMobile ? '16px 16px 0 0' : '12px',
        boxShadow: isMobile ? '0 -8px 32px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Box sx={{ p: isMinimized ? 1 : (isMobile ? 3 : 2) }}>
        {/* Mobile drag handle */}
        {isMobile && (
          <Box sx={{ 
            width: 40, 
            height: 4, 
            bgcolor: 'rgba(255, 255, 255, 0.3)', 
            borderRadius: 2, 
            mx: 'auto', 
            mb: 2 
          }} />
        )}
        
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: isMinimized ? 0 : (isMobile ? 3 : 2),
          minHeight: isMobile ? 48 : 'auto'
        }}>
          <SettingsIcon sx={{ 
            color: '#fff', 
            mr: isMobile ? 1.5 : 1, 
            fontSize: isMinimized ? '20px' : (isMobile ? '28px' : '24px') 
          }} />
          
          {!isMinimized && (
            <Typography 
              variant={isMobile ? "h5" : "h6"} 
              sx={{ 
                color: '#fff', 
                flexGrow: 1,
                fontWeight: isMobile ? 600 : 500,
                fontSize: isMobile ? '20px' : '18px'
              }}
            >
              Controls
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: isMobile ? 1 : 0.5 }}>
            {/* Desktop minimize button */}
            {!isMobile && (
              <IconButton 
                onClick={() => setIsMinimized(!isMinimized)}
                sx={{ 
                  color: '#999',
                  '&:hover': { color: '#fff' },
                  p: 0.5
                }}
                size="small"
              >
                {isMinimized ? <ExpandMoreIcon /> : <MinimizeIcon />}
              </IconButton>
            )}
            
            {/* Mobile expand/collapse button */}
            {isMobile && !isMinimized && (
              <IconButton 
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                sx={{ 
                  color: '#999',
                  '&:hover': { 
                    color: '#fff',
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  },
                  p: 1,
                  minWidth: 48,
                  minHeight: 48,
                  borderRadius: 2
                }}
                size="large"
              >
                {filtersExpanded ? <ExpandLessIcon sx={{ fontSize: '24px' }} /> : <ExpandMoreIcon sx={{ fontSize: '24px' }} />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Collapsed state indicator for mobile */}
        {isMobile && !filtersExpanded && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            py: 2,
            color: '#666',
            fontSize: '14px'
          }}>
            <Typography sx={{ fontSize: '14px', color: '#666' }}>
              Tap to expand controls
            </Typography>
          </Box>
        )}

        <Collapse in={isMobile ? filtersExpanded : !isMinimized}>
          {/* Token Search */}
          <Box sx={{ mb: isMobile ? 4 : 3 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: '#999', 
                mb: isMobile ? 2 : 1,
                fontSize: isMobile ? '16px' : '14px',
                fontWeight: 500
              }}
            >
              Jump to Token
            </Typography>
            <form onSubmit={handleSearch}>
              <TextField
                fullWidth
                size={isMobile ? "medium" : "small"}
                placeholder="Enter token ID (0-9999)"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton 
                      type="submit" 
                      size={isMobile ? "medium" : "small"} 
                      sx={{ 
                        color: '#fff',
                        minWidth: isMobile ? 48 : 'auto',
                        minHeight: isMobile ? 48 : 'auto',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      <SearchIcon sx={{ fontSize: isMobile ? '20px' : '18px' }} />
                    </IconButton>
                  ),
                  sx: {
                    color: '#fff',
                    minHeight: isMobile ? 56 : 'auto',
                    fontSize: isMobile ? '16px' : '14px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      borderWidth: isMobile ? 2 : 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                      borderWidth: isMobile ? 2 : 1,
                    },
                    '& .MuiInputBase-input': {
                      padding: isMobile ? '16px 14px' : '8px 14px',
                    }
                  }
                }}
              />
            </form>
          </Box>

          {/* Zoom Control */}
          <Box sx={{ mb: isMobile ? 4 : 3 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: '#999', 
                mb: isMobile ? 2 : 1,
                fontSize: isMobile ? '16px' : '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ZoomInIcon sx={{ 
                verticalAlign: 'middle', 
                mr: 1,
                fontSize: isMobile ? '20px' : '18px'
              }} />
              Zoom: {zoom}px
            </Typography>
            <Slider
              value={zoom}
              onChange={(e, newValue) => onZoomChange(newValue)}
              min={16}
              max={64}
              step={16}
              marks={[
                { value: 16, label: '16px' },
                { value: 32, label: '32px' },
                { value: 48, label: '48px' },
                { value: 64, label: '64px' },
              ]}
              sx={{
                color: '#4CAF50',
                height: isMobile ? 8 : 6,
                '& .MuiSlider-track': {
                  height: isMobile ? 8 : 6,
                  backgroundColor: '#4CAF50',
                },
                '& .MuiSlider-rail': {
                  height: isMobile ? 8 : 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                '& .MuiSlider-thumb': {
                  width: isMobile ? 24 : 20,
                  height: isMobile ? 24 : 20,
                  backgroundColor: '#4CAF50',
                  border: '2px solid #fff',
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(76, 175, 80, 0.2)',
                  },
                  '&.Mui-active': {
                    boxShadow: '0 0 0 12px rgba(76, 175, 80, 0.3)',
                  },
                },
                '& .MuiSlider-mark': {
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  width: isMobile ? 8 : 6,
                  height: isMobile ? 8 : 6,
                  borderRadius: '50%',
                },
                '& .MuiSlider-markLabel': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: isMobile ? '12px' : '10px',
                  fontWeight: 500,
                },
              }}
            />
          </Box>

          {/* BAYC Toggle */}
          <Box sx={{ mb: isMobile ? 2 : 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showBayc}
                  onChange={(e) => onShowBayc(e.target.checked)}
                  size={isMobile ? "medium" : "small"}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#4CAF50',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#4CAF50',
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '& .MuiSwitch-thumb': {
                      backgroundColor: '#fff',
                    },
                  }}
                />
              }
              label={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  minHeight: isMobile ? 48 : 'auto',
                  py: isMobile ? 1 : 0
                }}>
                  <VisibilityIcon sx={{ 
                    mr: 1,
                    fontSize: isMobile ? '20px' : '18px'
                  }} />
                  <Typography sx={{
                    fontSize: isMobile ? '16px' : '14px',
                    fontWeight: 500
                  }}>
                    Show Original BAYC
                  </Typography>
                </Box>
              }
              sx={{ 
                color: '#fff',
                alignItems: 'flex-start',
                '& .MuiFormControlLabel-label': {
                  fontSize: isMobile ? '16px' : '14px',
                  fontWeight: 500,
                }
              }}
            />
          </Box>

        </Collapse>
      </Box>
    </Paper>
  );
};

export default ControlPanel;
