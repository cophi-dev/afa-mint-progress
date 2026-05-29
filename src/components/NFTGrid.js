import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import MintProgress from './MintProgress';
import ControlPanel from './ControlPanel';
import VirtualGrid from './VirtualGrid';
import { getAfaThumbnailUrl, getBaycThumbnailUrl } from '../utils/imageUrls';
import { loadBaycMapping, getTraitCatalog, filterTokenIds } from '../data/baycMetadata';
import { loadMintCache, prefetchMintStatus } from '../services/mintStatusCache';
import { buildAfaEditorUrl, AFA_CLAIM_URL } from '../constants/editor';
import {
  TOTAL_TOKENS,
  getDefaultZoom,
  computeVisibleRange,
  computeGridLayout,
} from '../utils/gridLayout';
import './NFTGrid.css';

const ApeDetailsModal = lazy(() => import('./ApeDetailsModal'));

const initialIsMobile = window.innerWidth <= 768;
const initialLayout = computeGridLayout({
  zoom: getDefaultZoom(initialIsMobile),
  isMobile: initialIsMobile,
});
const cachedMint = loadMintCache();

function NFTGrid() {
  const [mintedStatus, setMintedStatus] = useState(() => cachedMint?.statuses ?? new Map());
  const [mintDataLoading, setMintDataLoading] = useState(!cachedMint);
  const [latestMints, setLatestMints] = useState(() => cachedMint?.latestMints ?? []);
  const [fetchError, setFetchError] = useState(null);
  const [selectedApe, setSelectedApe] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);

  const [zoom, setZoom] = useState(() => getDefaultZoom(window.innerWidth <= 768));
  const [showBayc, setShowBayc] = useState(false);
  const [traitFilters, setTraitFilters] = useState({});
  const [traitCatalog, setTraitCatalog] = useState(null);
  const [traitCatalogLoading, setTraitCatalogLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [visibleRange, setVisibleRange] = useState(initialLayout.visibleRange);

  const gridRef = useRef(null);
  const mintedStatusRef = useRef(mintedStatus);
  const rangeRef = useRef(initialLayout.visibleRange);
  const mintedCount = mintedStatus.size;

  mintedStatusRef.current = mintedStatus;

  const filteredTokenIds = useMemo(
    () => filterTokenIds(traitFilters),
    [traitFilters]
  );

  const displayTokenCount = filteredTokenIds?.length ?? TOTAL_TOKENS;

  const { gridWidth, cellsPerRow, totalRows } = useMemo(() => {
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
    const actualGridWidth = isMobile
      ? Math.min(cellsPerRow * zoom, availableWidth)
      : cellsPerRow * zoom;
    const totalRows = Math.ceil(displayTokenCount / cellsPerRow);

    return { gridWidth: actualGridWidth, cellsPerRow, totalRows };
  }, [zoom, screenWidth, isMobile, displayTokenCount]);

  const syncVisibleRange = useCallback((scrollTop, viewportHeight) => {
    const next = computeVisibleRange(scrollTop, viewportHeight, zoom, totalRows);
    const prev = rangeRef.current;
    if (prev.startRow === next.startRow && prev.endRow === next.endRow) return;
    rangeRef.current = next;
    setVisibleRange(next);
  }, [zoom, totalRows]);

  useEffect(() => {
    const prefetchModal = () => import('./ApeDetailsModal');
    if ('requestIdleCallback' in window) {
      const idleId = requestIdleCallback(prefetchModal, { timeout: 4000 });
      return () => cancelIdleCallback(idleId);
    }
    const timeoutId = setTimeout(prefetchModal, 1500);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    prefetchMintStatus()
      .then((result) => {
        if (cancelled || !result) return;
        setLatestMints(result.latestMints);
        setMintedStatus(result.statuses);
        setFetchError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Error fetching minted status:', error);
        if (!cachedMint) {
          setFetchError(error.message || 'Failed to load mint data');
        }
      })
      .finally(() => {
        if (!cancelled) setMintDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth <= 768);
        setScreenWidth(window.innerWidth);
        const el = gridRef.current;
        if (el) syncVisibleRange(el.scrollTop, el.clientHeight);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [syncVisibleRange]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return undefined;

    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        syncVisibleRange(el.scrollTop, el.clientHeight || window.innerHeight);
      });
    };

    syncVisibleRange(el.scrollTop, el.clientHeight || window.innerHeight);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [syncVisibleRange]);

  useEffect(() => {
    const el = gridRef.current;
    if (el) {
      syncVisibleRange(el.scrollTop, el.clientHeight || window.innerHeight);
    }
  }, [syncVisibleRange, cellsPerRow, zoom]);

  const openApeModal = useCallback((tokenId) => {
    const status = mintedStatusRef.current.get(tokenId);
    const isMinted = Boolean(status);

    setSelectedTokenId(tokenId);
    setSelectedApe({
      tokenId,
      isMinted,
      owner: status?.owner ?? null,
      mintDate: status ? new Date(status.timestamp * 1000).toISOString() : null,
      image: getAfaThumbnailUrl(tokenId),
      baycImage: getBaycThumbnailUrl(tokenId),
      editorUrl: isMinted ? buildAfaEditorUrl(tokenId) : null,
      claimUrl: AFA_CLAIM_URL,
    });
    setModalOpen(true);
  }, []);

  const handleGridClick = useCallback((event) => {
    const cell = event.target.closest('[data-token-id]');
    if (!cell) return;

    const tokenId = Number(cell.dataset.tokenId);
    if (Number.isNaN(tokenId)) return;

    openApeModal(tokenId);
  }, [openApeModal]);

  const handleTokenSearch = useCallback((tokenId) => {
    const el = gridRef.current;
    if (!el) return;

    let displayIndex = tokenId;
    if (filteredTokenIds) {
      displayIndex = filteredTokenIds.indexOf(tokenId);
      if (displayIndex === -1) return;
    }

    const row = Math.floor(displayIndex / cellsPerRow);
    const targetScroll = Math.max(0, row * zoom - el.clientHeight / 2);
    el.scrollTo({ top: targetScroll, behavior: 'smooth' });
    setSelectedTokenId(tokenId);
    setTimeout(() => setSelectedTokenId(null), 3000);
  }, [cellsPerRow, zoom, filteredTokenIds]);

  const handleZoomChange = useCallback((newZoom) => {
    setZoom(newZoom);
  }, []);

  const handleShowBayc = useCallback((show) => {
    setShowBayc(show);
    if (show) loadBaycMapping();
  }, []);

  const handleTraitFiltersChange = useCallback((nextFilters) => {
    setTraitFilters(nextFilters);
    const el = gridRef.current;
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTraitFilterOpen = useCallback(() => {
    if (traitCatalog || traitCatalogLoading) return;
    setTraitCatalogLoading(true);
    loadBaycMapping()
      .then(() => setTraitCatalog(getTraitCatalog()))
      .finally(() => setTraitCatalogLoading(false));
  }, [traitCatalog, traitCatalogLoading]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedTokenId(null);
  }, []);

  return (
    <>
      <div className="nft-grid-wrapper" ref={gridRef}>
        <div
          className={`nft-grid${filteredTokenIds ? ' filtered' : ''}`}
          onClick={handleGridClick}
          style={{
            width: gridWidth,
            height: totalRows * zoom,
            margin: '0 auto',
          }}
        >
          {filteredTokenIds?.length === 0 && (
            <div className="nft-grid-empty">
              <p>No apes match the selected traits.</p>
            </div>
          )}
          <VirtualGrid
            visibleRange={visibleRange}
            cellsPerRow={cellsPerRow}
            zoom={zoom}
            gridWidth={gridWidth}
            mintedStatus={mintedStatus}
            showBayc={showBayc}
            selectedTokenId={selectedTokenId}
            totalTokens={displayTokenCount}
            tokenIdList={filteredTokenIds}
          />
        </div>
      </div>

      <Suspense fallback={null}>
        <ApeDetailsModal
          open={modalOpen}
          onClose={handleModalClose}
          apeData={selectedApe}
        />
      </Suspense>

      <MintProgress
        mintedCount={mintedCount}
        latestMints={latestMints}
        fetchError={fetchError}
        mintDataLoading={mintDataLoading}
        hidden={modalOpen && isMobile}
        onMintClick={openApeModal}
      />

      <ControlPanel
        onTokenSearch={handleTokenSearch}
        onZoomChange={handleZoomChange}
        onShowBayc={handleShowBayc}
        zoom={zoom}
        showBayc={showBayc}
        isMobile={isMobile}
        hidden={modalOpen && isMobile}
        traitFilters={traitFilters}
        onTraitFiltersChange={handleTraitFiltersChange}
        traitCatalog={traitCatalog}
        traitCatalogLoading={traitCatalogLoading}
        onTraitFilterOpen={handleTraitFilterOpen}
        filteredMatchCount={filteredTokenIds?.length ?? null}
      />
    </>
  );
}

export default NFTGrid;
