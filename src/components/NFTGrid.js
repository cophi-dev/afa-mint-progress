import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getAllTransactions, processNFTStatuses } from '../services/etherscanService';
import ApeDetailsModal from './ApeDetailsModal';
import MintProgress from './MintProgress';
import ControlPanel from './ControlPanel';
import NFTCell from './NFTCell';
import imageCids from '../data/image_cids.json';
import { buildAfaEditorUrl, AFA_CLAIM_URL } from '../constants/editor';
import './NFTGrid.css';

const BAYC_CONTRACT = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
const TOTAL_TOKENS = 10000;
const OVERSCAN_ROWS = 2;

const getAfaImageUrl = (tokenId, highRes = false) => {
  if (highRes) {
    const cid = imageCids[tokenId];
    if (cid) return `https://ipfs.io/ipfs/${cid}`;
  }
  return `/images/${tokenId}.png`;
};

function NFTGrid() {
  const [mintedStatus, setMintedStatus] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [latestMints, setLatestMints] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [selectedApe, setSelectedApe] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);

  const [zoom, setZoom] = useState(16);
  const [showBayc, setShowBayc] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  const gridRef = useRef(null);
  const mintedCount = mintedStatus.size;

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

  const visibleRange = useMemo(() => {
    const rowHeight = zoom;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN_ROWS);
    const endRow = Math.min(
      totalRows,
      Math.ceil((scrollTop + viewportHeight) / rowHeight) + OVERSCAN_ROWS
    );
    return { startRow, endRow };
  }, [scrollTop, viewportHeight, zoom, totalRows]);

  const visibleTokenIds = useMemo(() => {
    const ids = [];
    const { startRow, endRow } = visibleRange;
    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < cellsPerRow; col++) {
        const id = row * cellsPerRow + col;
        if (id >= TOTAL_TOKENS) break;
        ids.push(id);
      }
    }
    return ids;
  }, [visibleRange, cellsPerRow]);

  useEffect(() => {
    const fetchMintedStatus = async () => {
      try {
        setFetchError(null);
        setProgress(30);
        const transactions = await getAllTransactions();
        setProgress(60);
        const nftStatuses = processNFTStatuses(transactions);
        setProgress(90);

        const latest = Array.from(nftStatuses.entries())
          .sort((a, b) => b[1].timestamp - a[1].timestamp)
          .slice(0, 5)
          .map(([tokenId, data]) => ({
            tokenId,
            timestamp: data.timestamp,
            owner: data.owner,
          }));
        setLatestMints(latest);
        setMintedStatus(nftStatuses);

        setProgress(100);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => setLoading(false), 500);
        }, 500);
      } catch (error) {
        console.error('Error fetching minted status:', error);
        setFetchError(error.message || 'Failed to load mint data');
        setLoading(false);
      }
    };

    fetchMintedStatus();
  }, []);

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth <= 768);
        setScreenWidth(window.innerWidth);
        setViewportHeight(window.innerHeight);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return undefined;

    let rafId = null;
    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrollTop(el.scrollTop);
        setViewportHeight(el.clientHeight);
      });
    };

    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [loading]);

  const handleApeClick = useCallback((tokenId) => {
    const status = mintedStatus.get(tokenId);
    const isMinted = Boolean(status);

    setSelectedTokenId(tokenId);
    setSelectedApe({
      tokenId,
      isMinted,
      owner: status?.owner ?? null,
      mintDate: status ? new Date(status.timestamp * 1000).toISOString() : null,
      image: getAfaImageUrl(tokenId, true),
      editorUrl: isMinted ? buildAfaEditorUrl(tokenId) : null,
      claimUrl: AFA_CLAIM_URL,
      baycUrl: `https://etherscan.io/token/${BAYC_CONTRACT}?a=${tokenId}`,
    });
    setModalOpen(true);
  }, [mintedStatus]);

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
  }, []);

  const { startRow } = visibleRange;

  return (
    <>
      <div className="nft-grid-wrapper" ref={gridRef}>
        <div
          className="nft-grid"
          style={{
            width: gridWidth,
            height: totalRows * zoom,
            margin: '0 auto',
          }}
        >
          <div
            className="nft-grid-visible"
            style={{
              position: 'absolute',
              top: startRow * zoom,
              left: 0,
              display: 'grid',
              gridTemplateColumns: `repeat(${cellsPerRow}, ${zoom}px)`,
              width: gridWidth,
            }}
          >
            {visibleTokenIds.map((tokenId) => {
              const status = mintedStatus.get(tokenId);
              return (
                <NFTCell
                  key={tokenId}
                  tokenId={tokenId}
                  zoom={zoom}
                  isMinted={Boolean(status)}
                  owner={status?.owner}
                  showBayc={showBayc}
                  isSelected={selectedTokenId === tokenId}
                  onClick={() => handleApeClick(tokenId)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <ApeDetailsModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTokenId(null);
        }}
        apeData={selectedApe}
      />

      <MintProgress mintedCount={mintedCount} latestMints={latestMints} fetchError={fetchError} />

      <ControlPanel
        onTokenSearch={handleTokenSearch}
        onZoomChange={handleZoomChange}
        onShowBayc={handleShowBayc}
        zoom={zoom}
        showBayc={showBayc}
        isMobile={isMobile}
      />

      {loading && (
        <div className={`loading-overlay${fadeOut ? ' fade-out' : ''}`}>
          <img src="/logo.png" alt="AFA" className="loading-logo" />
          <div className="loading-title">AFA Mint Progress</div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">{progress}%</div>
        </div>
      )}
    </>
  );
}

export default NFTGrid;
