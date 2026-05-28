import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Collapse,
  IconButton,
  Skeleton,
  Fade,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const sectionLabelSx = {
  color: 'rgba(255,255,255,0.45)',
  mb: 0.75,
  fontSize: '0.65rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const chipSx = {
  height: 24,
  fontSize: '0.6875rem',
  fontWeight: 500,
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.1)',
  bgcolor: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.72)',
  transition: 'all 0.18s ease',
  '& .MuiChip-label': { px: 0.875 },
  '&:hover': {
    bgcolor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
};

const activeChipSx = {
  ...chipSx,
  bgcolor: 'rgba(110, 231, 160, 0.14)',
  borderColor: 'rgba(110, 231, 160, 0.35)',
  color: '#d4fae5',
  '&:hover': {
    bgcolor: 'rgba(110, 231, 160, 0.22)',
    borderColor: 'rgba(110, 231, 160, 0.5)',
  },
};

const typeChipSx = {
  ...chipSx,
  height: 26,
  fontSize: '0.625rem',
  flexShrink: 0,
};

const activeTypeChipSx = {
  ...typeChipSx,
  ...activeChipSx,
  height: 26,
};

const TraitFilter = ({
  catalog,
  filters,
  onChange,
  matchCount,
  loading = false,
  isMobile = false,
  onExpand,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeType, setActiveType] = useState(null);

  const activeFilterCount = useMemo(
    () => Object.values(filters).reduce((sum, values) => sum + (values?.length ?? 0), 0),
    [filters]
  );

  const activeTypeValues = useMemo(() => {
    if (!catalog || !activeType) return [];
    return catalog.find((entry) => entry.traitType === activeType)?.values ?? [];
  }, [catalog, activeType]);

  const handleToggleValue = (traitType, value) => {
    const current = filters[traitType] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    onChange({
      ...filters,
      [traitType]: next,
    });
  };

  const handleClearAll = () => {
    onChange({});
    setActiveType(null);
  };

  const handleExpand = () => {
    if (!expanded) onExpand?.();
    setExpanded((prev) => {
      const next = !prev;
      if (next && catalog?.length && !activeType) {
        setActiveType(catalog[0].traitType);
      }
      return next;
    });
  };

  return (
    <Box className="trait-filter">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: expanded ? 0.75 : 0,
        }}
      >
        <Typography
          sx={{
            ...sectionLabelSx,
            mb: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <FilterListIcon sx={{ fontSize: 12 }} />
          Trait filter
          {activeFilterCount > 0 && (
            <Box component="span" className="control-panel-badge accent" sx={{ ml: 0.25 }}>
              {matchCount ?? 0}
            </Box>
          )}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          {activeFilterCount > 0 && (
            <IconButton
              size="small"
              onClick={handleClearAll}
              aria-label="Clear trait filters"
              sx={{
                color: 'rgba(255,255,255,0.4)',
                p: 0.5,
                '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.06)' },
              }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={handleExpand}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse trait filter' : 'Expand trait filter'}
            sx={{
              color: 'rgba(255,255,255,0.45)',
              p: 0.5,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.22s ease, color 0.18s ease',
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            <ExpandMoreIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {activeFilterCount > 0 && !expanded && (
        <Fade in>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
            {Object.entries(filters).flatMap(([traitType, values]) =>
              values.map((value) => (
                <Chip
                  key={`${traitType}-${value}`}
                  label={`${traitType}: ${value}`}
                  size="small"
                  onDelete={() => handleToggleValue(traitType, value)}
                  sx={activeChipSx}
                />
              ))
            )}
          </Box>
        </Fade>
      )}

      <Collapse in={expanded} timeout={240}>
        <Box sx={{ pt: 1 }}>
          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Skeleton variant="rounded" height={26} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
              <Skeleton variant="rounded" height={72} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
            </Box>
          )}

          {!loading && catalog && (
            <>
              <Box
                className="trait-filter-types"
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  overflowX: 'auto',
                  pb: 0.75,
                  '&::-webkit-scrollbar': { height: 3 },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                    borderRadius: 2,
                  },
                }}
              >
                {catalog.map(({ traitType }) => {
                  const selectedCount = filters[traitType]?.length ?? 0;
                  const isActive = activeType === traitType;
                  return (
                    <Chip
                      key={traitType}
                      label={selectedCount > 0 ? `${traitType} · ${selectedCount}` : traitType}
                      size="small"
                      onClick={() => setActiveType(traitType)}
                      sx={isActive ? activeTypeChipSx : typeChipSx}
                    />
                  );
                })}
              </Box>

              <Box
                className="trait-filter-values"
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5,
                  maxHeight: isMobile ? 120 : 140,
                  overflowY: 'auto',
                  pr: 0.25,
                  '&::-webkit-scrollbar': { width: 4 },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                    borderRadius: 2,
                  },
                }}
              >
                {activeTypeValues.map(({ value, count }) => {
                  const selected = filters[activeType]?.includes(value);
                  return (
                    <Chip
                      key={value}
                      label={`${value} (${count})`}
                      size="small"
                      onClick={() => handleToggleValue(activeType, value)}
                      sx={selected ? activeChipSx : chipSx}
                    />
                  );
                })}
              </Box>

              {activeFilterCount > 0 && (
                <Typography
                  sx={{
                    mt: 1,
                    fontSize: '0.6875rem',
                    color: 'rgba(255,255,255,0.45)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {matchCount ?? 0} apes match
                </Typography>
              )}
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default TraitFilter;
