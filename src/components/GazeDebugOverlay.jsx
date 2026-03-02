import React, { useRef, useEffect } from 'react';
import { useWebGazer } from '../utils/WebGazerContext';

export default function GazeDebugOverlay() {
  const { currentGaze } = useWebGazer();
  const dotRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot || currentGaze.x == null || currentGaze.y == null) {
      if (dot) dot.style.display = 'none';
      return;
    }
    dot.style.display = 'block';
    const x = Math.max(0, Math.min(window.innerWidth - 15, currentGaze.x));
    const y = Math.max(0, Math.min(window.innerHeight - 15, currentGaze.y));
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
  }, [currentGaze]);

  return (
    <div
      ref={dotRef}
      style={{
        position: 'fixed',
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: 'rgba(244, 67, 54, 0.6)',
        border: '2px solid #d32f2f',
        boxShadow: '0 0 12px rgba(244, 67, 54, 0.4)',
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'translate(-50%, -50%)',
        transition: 'left 0.03s linear, top 0.03s linear',
        display: 'none',
      }}
    />
  );
}
