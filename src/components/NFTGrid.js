import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import MintProgress from './MintProgress';
import ControlPanel from './ControlPanel';
import VirtualGrid from './VirtualGrid';
import { getAfaThumbnailUrl, getBaycThumbnailUrl } from '../utils/imageUrls';
import { loadBaycMapping } from '../data/baycMetadata';
import { loadMintCache, prefetchMintStatus } from '../services/mintStatusCache';
import { buildAfaEditorUrl, AFA_CLAIM_URL } from '../constants/editor';
import {
  TOTAL_TOKENS,
  DEFAULT_ZOOM,
  computeVisibleRange,
  computeGridLayout,
} from '../utils/gridLayout';
import './NFTGrid.css';

const ApeDetailsModal = lazy(() => import('./ApeDetailsModal'));

const initialLayout = computeGridLayout();
const cachedMint = loadMintCache();

function NFTGrid() {
  const [mintedStatus, setMintedStatus] = useState(() => cachedMint?.statuses ?? new Map());
  const [mintDataLoading, setMintDataLoading] = useState(!cachedMint);
  const [latestMints, setLatestMints] = useState(() => cachedMint?.latestMints ?? []);
  const [fetchError, setFetchError] = useState(null);
  const [selectedApe, setSelectedApe] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);

  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [showBayc, setShowBayc] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [visibleRange, setVisibleRange] = useState(initialLayout.visibleRange);

  const gridRef = useRef(null);
  const mintedStatusRef = useRef(mintedStatus);
  const rangeRef = useRef(initialLayout.visibleRange);
  const mintedCount = mintedStatus.size;

  mintedStatusRef.current = mintedStatus;

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
    const totalRows = Math.ceil(TOTAL_TOKENS / cellsPerRow);

    return { gridWidth: actualGridWidth, cellsPerRow, totalRows };
  }, [zoom, screenWidth, isMobile]);

  const syncVisibleRange = useCallback((scrollTop, viewportHeight) => {
    const next = computeVisibleRange(scrollTop, viewportHeight, zoom, totalRows);
    const prev = rangeRef.current;
    if (prev.startRow === next.startRow && prev.endRow === next.endRow) return;
    rangeRef.current = next;
    setVisibleRange(next);
  }, [zoom, totalRows]);

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

  const handleGridClick = useCallback((event) => {
    const cell = event.target.closest('[data-token-id]');
    if (!cell) return;

    const tokenId = Number(cell.dataset.tokenId);
    if (Number.isNaN(tokenId)) return;

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

  const handleTokenSearch = useCallback((tokenId) => {
    const el = gridRef.current;
    if (!el) return;

    const row = Math.floor(tokenId / cellsPerRow);
    const targetScroll = Math.max(0, row * zoom - el.clientHeight / 2);
    el.scrollTo({ top: targetScroll, behavior: 'smooth' });
    setSelectedTokenId(tokenId);
    setTimeout(() => setSelectedTokenId(null), 3000);
  }, [cellsPerRow, zoom]);

  const handleZoomChange = useCallback((newZoom) => {
    setZoom(newZoom);
  }, []);

  const handleShowBayc = useCallback((show) => {
    setShowBayc(show);
    if (show) loadBaycMapping();
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedTokenId(null);
  }, []);

  return (
    <>
      <div className="nft-grid-wrapper" ref={gridRef}>
        <div
          className="nft-grid"
          onClick={handleGridClick}
          style={{
            width: gridWidth,
            height: totalRows * zoom,
            margin: '0 auto',
          }}
        >
          <VirtualGrid
            visibleRange={visibleRange}
            cellsPerRow={cellsPerRow}
            zoom={zoom}
            gridWidth={gridWidth}
            mintedStatus={mintedStatus}
            showBayc={showBayc}
            selectedTokenId={selectedTokenId}
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
      />

      <ControlPanel
        onTokenSearch={handleTokenSearch}
        onZoomChange={handleZoomChange}
        onShowBayc={handleShowBayc}
        zoom={zoom}
        showBayc={showBayc}
        isMobile={isMobile}
      />
    </>
  );
}

export default NFTGrid;
