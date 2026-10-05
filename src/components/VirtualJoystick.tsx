import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  disabled?: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, disabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const activeTouchIdRef = useRef<number | null>(null);

  const radius = 55; // max distance knob can travel from center

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsActive(true);
    activeTouchIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateVector(e.clientX, e.clientY);

    if (navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
  };

  const updateVector = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > radius) {
        dx = (dx / dist) * radius;
        dy = (dy / dist) * radius;
      }

      setKnobPos({ x: dx, y: dy });

      // Apply deadzone and normalize
      const normX = dx / radius;
      const normY = dy / radius;
      const deadzone = 0.12;

      const filteredX = Math.abs(normX) < deadzone ? 0 : normX;
      const filteredY = Math.abs(normY) < deadzone ? 0 : normY;

      onMove({ x: filteredX, y: filteredY });
    },
    [onMove, radius]
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive || e.pointerId !== activeTouchIdRef.current) return;
    updateVector(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activeTouchIdRef.current) return;
    setIsActive(false);
    activeTouchIdRef.current = null;
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      onMove({ x: 0, y: 0 });
    };
  }, [onMove]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative flex items-center justify-center select-none touch-none"
      style={{
        width: `${radius * 2 + 36}px`,
        height: `${radius * 2 + 36}px`,
      }}
    >
      {/* Outer Glow Ring */}
      <div
        className={`absolute inset-2 rounded-full border-2 transition-colors duration-150 backdrop-blur-md flex items-center justify-center ${
          isActive
            ? 'border-emerald-400/80 bg-emerald-950/40 shadow-[0_0_24px_rgba(52,211,153,0.3)]'
            : 'border-white/20 bg-zinc-900/60 shadow-inner'
        }`}
      >
        {/* Direction indicators */}
        <div className="absolute left-2.5 w-2 h-2 rounded-full bg-white/30" />
        <div className="absolute right-2.5 w-2 h-2 rounded-full bg-white/30" />
        <div className="absolute top-2.5 w-2 h-2 rounded-full bg-white/20" />
        <div className="absolute bottom-2.5 w-2 h-2 rounded-full bg-white/20" />

        {/* Center Guide Dot */}
        <div className="w-3 h-3 rounded-full bg-white/10" />
      </div>

      {/* Floating Dynamic Thumb Knob */}
      <div
        className={`absolute w-14 h-14 rounded-full shadow-lg flex items-center justify-center pointer-events-none transition-transform will-change-transform ${
          isActive
            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 scale-105 shadow-[0_4px_16px_rgba(16,185,129,0.5)]'
            : 'bg-gradient-to-br from-zinc-600 to-zinc-800 border border-white/20'
        }`}
        style={{
          transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
          transition: isActive ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
      >
        <div className="w-5 h-5 rounded-full bg-white/30 backdrop-blur-sm" />
      </div>
    </div>
  );
};
