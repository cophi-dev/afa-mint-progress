import React, { useState, useRef } from 'react';
import './Header.css';

function Header({ mintedCount, latestMints }) {
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 200 });
  const headerRef = useRef(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    const rect = headerRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;

    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;

    // Keep within window bounds
    const maxX = window.innerWidth - headerRef.current.offsetWidth;
    const maxY = window.innerHeight - headerRef.current.offsetHeight;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  React.useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <header 
      ref={headerRef}
      className="header" 
      onMouseDown={handleMouseDown}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0
      }}
    >
      <div className="header-content">
        <div className="header-title">
          <h1>AFA Mint Progress</h1>
          <p>Total minted: {mintedCount} / 10000</p>
        </div>
        <div className="latest-mints">
          <h2>Latest Mints</h2>
          <ul>
            {latestMints.slice(0, 5).map((mint) => (
              <li key={mint.tokenId}>
                Token #{mint.tokenId} · {formatDate(mint.timestamp)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}

export default Header; 