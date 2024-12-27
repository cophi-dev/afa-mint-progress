import React, { useState, useRef, useEffect } from 'react';
import './Header.css';

function Header({ mintedCount, latestMints }) {
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 200 });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const headerRef = useRef(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e) => {
    if (isMobile) return;
    isDragging.current = true;
    const rect = headerRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || isMobile) return;

    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;

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

  useEffect(() => {
    if (!isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isMobile]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <header 
      ref={headerRef}
      className="header" 
      onMouseDown={handleMouseDown}
      style={!isMobile ? {
        transform: `translate(${position.x}px, ${position.y}px)`,
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0
      } : undefined}
    >
      <div className="header-content">
        <div className="header-title">
          <h1>AFA Mint Progress</h1>
          <p>{mintedCount} / 10000 minted</p>
        </div>
        <div className="latest-mints">
          <ul>
            {latestMints.slice(0, 3).map((mint) => (
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