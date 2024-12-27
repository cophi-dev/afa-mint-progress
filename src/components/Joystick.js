import React, { useState, useEffect, useRef } from 'react';

function Joystick() {
  const [selectedPosition, setSelectedPosition] = useState({ x: 0, y: 0 });
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const joystickRef = useRef(null);

  // Check if device has touch capability
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const firstItem = document.querySelector('.nft-cell');
    if (firstItem) {
      firstItem.classList.add('virtual-hover');
    }
  }, []);

  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDragging || !joystickRef.current) return;

    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    let deltaX = touch.clientX - center.x;
    let deltaY = touch.clientY - center.y;

    // Limit joystick movement radius
    const radius = rect.width / 3;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > radius) {
      deltaX = (deltaX / distance) * radius;
      deltaY = (deltaY / distance) * radius;
    }

    setJoystickPos({ x: deltaX, y: deltaY });

    // Update selection
    const newX = Math.max(0, Math.min(99, selectedPosition.x + Math.round(deltaX / 20)));
    const newY = Math.max(0, Math.min(99, selectedPosition.y + Math.round(deltaY / 20)));
    setSelectedPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setJoystickPos({ x: 0, y: 0 });
  };

  useEffect(() => {
    const index = selectedPosition.y * 100 + selectedPosition.x;
    const items = document.querySelectorAll('.nft-cell');
    items.forEach(item => item.classList.remove('virtual-hover'));
    if (items[index]) {
      items[index].classList.add('virtual-hover');
    }
  }, [selectedPosition]);

  // Don't render if not a touch device
  if (!isTouchDevice) return null;

  return (
    <div className="mobile-controls">
      <div className="joystick-base"
           ref={joystickRef}
           onTouchStart={handleTouchStart}
           onTouchMove={handleTouchMove}
           onTouchEnd={handleTouchEnd}>
        <div className="joystick-stick"
             style={{
               transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
             }} />
      </div>
    </div>
  );
}

export default Joystick; 