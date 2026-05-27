import React, { memo } from 'react';
import { getBaycMetadata } from '../data/baycMetadata';

const getImageSrc = (tokenId, showBayc) =>
  showBayc ? `/bayc-images/${tokenId}.png` : `/images/${tokenId}.png`;

const NFTCell = memo(({
  tokenId,
  zoom,
  isMinted,
  owner,
  showBayc,
  isSelected,
  onClick,
}) => {
  const src = getImageSrc(tokenId, showBayc);

  const handleImageError = async (e) => {
    if (e.target.dataset.triedFallback) return;
    e.target.dataset.triedFallback = 'true';

    if (showBayc) {
      const metadata = getBaycMetadata(tokenId);
      if (metadata?.image) {
        e.target.src = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      return;
    }

    const { default: imageCids } = await import('../data/image_cids.json');
    const cid = imageCids[tokenId];
    if (cid) {
      e.target.src = `https://ipfs.io/ipfs/${cid}`;
    }
  };

  return (
    <div
      id={`nft-${tokenId}`}
      className={`nft-cell ${isMinted ? 'minted' : 'unminted'}${isSelected ? ' selected' : ''}`}
      onClick={onClick}
      title={isMinted ? `#${tokenId} — ${owner?.slice(0, 8)}…` : `#${tokenId}`}
      style={{ width: zoom, height: zoom }}
    >
      <img
        src={src}
        alt={`#${tokenId}`}
        loading="lazy"
        decoding="async"
        width={zoom}
        height={zoom}
        onError={handleImageError}
      />
    </div>
  );
}, (prev, next) =>
  prev.tokenId === next.tokenId &&
  prev.zoom === next.zoom &&
  prev.isMinted === next.isMinted &&
  prev.showBayc === next.showBayc &&
  prev.isSelected === next.isSelected &&
  prev.owner === next.owner
);

NFTCell.displayName = 'NFTCell';

export default NFTCell;
