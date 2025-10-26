import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [isMinimized, setIsMinimized] = useState(false);

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
        bottom: isMobile ? 20 : 'auto',
        right: 20,
        width: isMinimized ? 'auto' : (isMobile ? 'calc(100% - 40px)' : 320),
        maxHeight: isMobile ? '50vh' : '80vh',
        overflow: 'auto',
        bgcolor: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1500,
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <Box sx={{ p: isMinimized ? 1 : 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: isMinimized ? 0 : 2 }}>
          <SettingsIcon sx={{ color: '#fff', mr: 1, fontSize: isMinimized ? '20px' : '24px' }} />
          
          {!isMinimized && (
            <Typography variant="h6" sx={{ color: '#fff', flexGrow: 1 }}>
              Controls
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
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
                  '&:hover': { color: '#fff' },
                  p: 0.5
                }}
                size="small"
              >
                {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Box>
        </Box>

        <Collapse in={!isMinimized && (isMobile ? filtersExpanded : true)}>
          {/* Token Search */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#999', mb: 1 }}>
              Jump to Token
            </Typography>
            <form onSubmit={handleSearch}>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter token ID (0-9999)"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton type="submit" size="small" sx={{ color: '#fff' }}>
                      <SearchIcon />
                    </IconButton>
                  ),
                  sx: {
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#fff',
                    },
                  }
                }}
              />
            </form>
          </Box>

          {/* Zoom Control */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#999', mb: 1 }}>
              <ZoomInIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
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
                color: '#fff',
                '& .MuiSlider-mark': {
                  color: 'rgba(255, 255, 255, 0.5)',
                },
                '& .MuiSlider-markLabel': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.75rem',
                },
              }}
            />
          </Box>

          {/* BAYC Toggle */}
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showBayc}
                  onChange={(e) => onShowBayc(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#4CAF50',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#4CAF50',
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <VisibilityIcon sx={{ mr: 1 }} />
                  Show Original BAYC
                </Box>
              }
              sx={{ 
                color: '#fff',
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.875rem',
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
