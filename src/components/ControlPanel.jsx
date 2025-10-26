import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Slider, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Switch,
  FormControlLabel,
  Paper,
  Typography,
  IconButton,
  Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import './ControlPanel.css';

const ControlPanel = ({
  onTokenSearch,
  onZoomChange,
  onShowBayc,
  onAttributeFilter,
  zoom = 16,
  showBayc = false,
  availableAttributes = {},
  selectedFilters = {},
  isMobile = false
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(!isMobile);

  const handleSearch = (e) => {
    e.preventDefault();
    const tokenId = parseInt(searchValue);
    if (!isNaN(tokenId) && tokenId >= 0 && tokenId < 10000) {
      onTokenSearch(tokenId);
    }
  };

  const handleAttributeChange = (traitType, value) => {
    const newFilters = { ...selectedFilters };
    if (!newFilters[traitType]) {
      newFilters[traitType] = [];
    }
    
    if (newFilters[traitType].includes(value)) {
      newFilters[traitType] = newFilters[traitType].filter(v => v !== value);
      if (newFilters[traitType].length === 0) {
        delete newFilters[traitType];
      }
    } else {
      newFilters[traitType].push(value);
    }
    
    onAttributeFilter(newFilters);
  };

  const clearAllFilters = () => {
    onAttributeFilter({});
  };

  const hasActiveFilters = Object.keys(selectedFilters).length > 0;

  return (
    <Paper 
      className={`control-panel ${isMobile ? 'mobile' : 'desktop'}`}
      elevation={3}
      sx={{
        position: 'fixed',
        top: isMobile ? 'auto' : 20,
        bottom: isMobile ? 20 : 'auto',
        right: 20,
        width: isMobile ? 'calc(100% - 40px)' : 320,
        maxHeight: isMobile ? '50vh' : '80vh',
        overflow: 'auto',
        bgcolor: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1500,
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterListIcon sx={{ color: '#fff', mr: 1 }} />
          <Typography variant="h6" sx={{ color: '#fff', flexGrow: 1 }}>
            Controls
          </Typography>
          {isMobile && (
            <IconButton 
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              sx={{ color: '#fff' }}
            >
              {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>

        <Collapse in={filtersExpanded}>
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

          {/* Attribute Filters */}
          {Object.keys(availableAttributes).length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#999' }}>
                  Filter by Attributes
                </Typography>
                {hasActiveFilters && (
                  <Button
                    size="small"
                    onClick={clearAllFilters}
                    sx={{ 
                      color: '#ff6b6b',
                      fontSize: '0.75rem',
                      minWidth: 'auto',
                      p: 0.5,
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </Box>

              {Object.entries(availableAttributes).map(([traitType, values]) => (
                <Box key={traitType} sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#bbb', mb: 1, display: 'block' }}>
                    {traitType}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {values.slice(0, 8).map((value) => {
                      const isSelected = selectedFilters[traitType]?.includes(value);
                      return (
                        <Chip
                          key={value}
                          label={value}
                          size="small"
                          clickable
                          onClick={() => handleAttributeChange(traitType, value)}
                          sx={{
                            bgcolor: isSelected ? '#4CAF50' : 'rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            height: 24,
                            '&:hover': {
                              bgcolor: isSelected ? '#45a049' : 'rgba(255, 255, 255, 0.2)',
                            },
                          }}
                        />
                      );
                    })}
                    {values.length > 8 && (
                      <Chip
                        label={`+${values.length - 8} more`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          color: '#999',
                          fontSize: '0.7rem',
                          height: 24,
                        }}
                      />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {hasActiveFilters && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#999', mb: 1, display: 'block' }}>
                Active Filters ({Object.values(selectedFilters).flat().length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {Object.entries(selectedFilters).map(([traitType, values]) =>
                  values.map((value) => (
                    <Chip
                      key={`${traitType}-${value}`}
                      label={`${traitType}: ${value}`}
                      size="small"
                      onDelete={() => handleAttributeChange(traitType, value)}
                      sx={{
                        bgcolor: '#4CAF50',
                        color: '#fff',
                        fontSize: '0.65rem',
                        height: 22,
                        '& .MuiChip-deleteIcon': {
                          color: '#fff',
                          fontSize: '0.875rem',
                        },
                      }}
                    />
                  ))
                )}
              </Box>
            </Box>
          )}
        </Collapse>
      </Box>
    </Paper>
  );
};

export default ControlPanel;
