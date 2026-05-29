export const TOTAL_TOKENS = 10000;
export const MOBILE_DEFAULT_ZOOM = 32;
export const DESKTOP_DEFAULT_ZOOM = 64;
/** @deprecated use getDefaultZoom() */
export const DEFAULT_ZOOM = MOBILE_DEFAULT_ZOOM;
export const OVERSCAN_ROWS = 1;

export const getDefaultZoom = (isMobile = window.innerWidth <= 768) =>
  (isMobile ? MOBILE_DEFAULT_ZOOM : DESKTOP_DEFAULT_ZOOM);

export const computeVisibleRange = (scrollTop, viewportHeight, zoom, totalRows) => {
  const rowHeight = zoom;
  const safeViewport = Math.max(viewportHeight, rowHeight * 2, window.innerHeight * 0.5);
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN_ROWS);
  const endRow = Math.min(
    totalRows,
    Math.max(
      startRow + 1,
      Math.ceil((scrollTop + safeViewport) / rowHeight) + OVERSCAN_ROWS
    )
  );
  return { startRow, endRow };
};

export const computeGridLayout = ({
  zoom = DEFAULT_ZOOM,
  screenWidth = window.innerWidth,
  isMobile = window.innerWidth <= 768,
} = {}) => {
  const padding = isMobile ? 10 : 40;
  const availableWidth = screenWidth - padding;
  let maxCellsPerRow = Math.floor(availableWidth / zoom);

  if (isMobile) {
    const minColumnsOnMobile = Math.max(15, Math.floor(screenWidth / 24));
    maxCellsPerRow = Math.max(maxCellsPerRow, minColumnsOnMobile);
    if (zoom <= 16) {
      maxCellsPerRow = Math.max(maxCellsPerRow, Math.floor(screenWidth / 12));
    }
  }

  const cellsPerRow = Math.min(maxCellsPerRow, 100);
  const gridWidth = isMobile
    ? Math.min(cellsPerRow * zoom, availableWidth)
    : cellsPerRow * zoom;
  const totalRows = Math.ceil(TOTAL_TOKENS / cellsPerRow);
  const visibleRange = computeVisibleRange(0, window.innerHeight, zoom, totalRows);

  return { gridWidth, cellsPerRow, totalRows, visibleRange };
};
