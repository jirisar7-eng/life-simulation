import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WorldRenderer } from '../rendering/WorldRenderer';
import { ZoomIn, ZoomOut, RotateCcw, Move, Compass } from 'lucide-react';

export interface WorldMapViewportProps {
  className?: string;
}

export const WorldMapViewport: React.FC<WorldMapViewportProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WorldRenderer | null>(null);
  const [cameraStats, setCameraStats] = useState({ x: 0, y: 0, zoom: 1.0 });
  const [cursorWorldPos, setCursorWorldPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; camX: number; camY: number } | null>(null);

  const updateStats = useCallback(() => {
    if (!rendererRef.current) return;
    const state = rendererRef.current.camera.getState();
    setCameraStats({
      x: Math.round(state.x * 10) / 10,
      y: Math.round(state.y * 10) / 10,
      zoom: Math.round(state.zoom * 100) / 100,
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new WorldRenderer({
      width: container.clientWidth || 800,
      height: container.clientHeight || 500,
      backgroundColor: 0x090d16, // Dark slate
      preference: 'webgl',
    });
    rendererRef.current = renderer;

    let isMounted = true;

    renderer.initialize(container).then(() => {
      if (isMounted) {
        updateStats();
      }
    });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          renderer.resize(entry.contentRect.width, entry.contentRect.height);
          updateStats();
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [updateStats]);

  // Handle Pan Interaction (Mouse Drag)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rendererRef.current) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      camX: rendererRef.current.camera.x,
      camY: rendererRef.current.camera.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rendererRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const screenPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const worldPos = rendererRef.current.screenToWorld(screenPos);
    setCursorWorldPos({
      x: Math.round(worldPos.x),
      y: Math.round(worldPos.y),
    });

    if (isDragging && dragStartRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) / rendererRef.current.camera.zoom;
      const dy = (e.clientY - dragStartRef.current.y) / rendererRef.current.camera.zoom;
      rendererRef.current.camera.x = dragStartRef.current.camX - dx;
      rendererRef.current.camera.y = dragStartRef.current.camY - dy;
      rendererRef.current.render();
      updateStats();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Handle Zoom (Wheel)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!rendererRef.current || !containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const pivot = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    rendererRef.current.camera.zoomBy(zoomFactor, pivot);
    rendererRef.current.render();
    updateStats();
  };

  const handleZoomIn = () => {
    if (!rendererRef.current) return;
    rendererRef.current.camera.zoomBy(1.25);
    rendererRef.current.render();
    updateStats();
  };

  const handleZoomOut = () => {
    if (!rendererRef.current) return;
    rendererRef.current.camera.zoomBy(0.8);
    rendererRef.current.render();
    updateStats();
  };

  const handleResetCamera = () => {
    if (!rendererRef.current) return;
    rendererRef.current.camera.setState({ x: 0, y: 0, zoom: 1.0 });
    rendererRef.current.render();
    updateStats();
  };

  return (
    <div
      id="world-map-viewport"
      className={`relative w-full h-[540px] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden select-none flex flex-col ${className}`}
    >
      {/* Viewport Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing flex-1"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Top Header Overlay */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-2 shadow-lg">
          <Compass className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-100">World View (WebGL Renderer)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80">
            PixiJS 8.x
          </span>
        </div>
      </div>

      {/* Floating Camera Controls Toolbar */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md shadow-xl">
        <button
          id="btn-zoom-in"
          onClick={handleZoomIn}
          title="Přiblížit (Zoom In)"
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={handleZoomOut}
          title="Oddálit (Zoom Out)"
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-800 mx-0.5" />
        <button
          id="btn-camera-reset"
          onClick={handleResetCamera}
          title="Resetovat Kameru na střed (0, 0)"
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Telemetry HUD */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/90 backdrop-blur-md text-[11px] font-mono text-slate-300 shadow-md">
          <Move className="w-3.5 h-3.5 text-slate-400" />
          <span>Camera:</span>
          <span className="text-indigo-300 font-semibold">X: {cameraStats.x}</span>
          <span className="text-indigo-300 font-semibold">Y: {cameraStats.y}</span>
          <span className="text-slate-600">|</span>
          <span>Zoom:</span>
          <span className="text-emerald-400 font-semibold">{cameraStats.zoom}x</span>
        </div>

        {cursorWorldPos && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/90 backdrop-blur-md text-[11px] font-mono text-slate-300 shadow-md">
            <span className="text-slate-400">Cursor World:</span>
            <span className="text-amber-300 font-semibold">X: {cursorWorldPos.x}</span>
            <span className="text-amber-300 font-semibold">Y: {cursorWorldPos.y}</span>
          </div>
        )}
      </div>
    </div>
  );
};
