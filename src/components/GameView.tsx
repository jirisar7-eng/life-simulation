import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WorldRenderer } from '../rendering/WorldRenderer';
import { createProceduralWorldMap } from '../models/map';
import { ZoomIn, ZoomOut, RotateCcw, Move, Compass, ShieldAlert, Dice5 } from 'lucide-react';

export interface GameViewProps {
  className?: string;
  seed?: number | string;
  onOpenArchitectureHub?: () => void;
}

export const GameView: React.FC<GameViewProps> = ({
  className = '',
  seed: initialSeed = 12345,
  onOpenArchitectureHub,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WorldRenderer | null>(null);

  const [currentSeed, setCurrentSeed] = useState<number | string>(initialSeed);
  const [cameraStats, setCameraStats] = useState({ x: 0, y: 0, zoom: 1.0 });
  const [cursorWorldPos, setCursorWorldPos] = useState<{ x: number; y: number } | null>(null);
  const [cursorTileInfo, setCursorTileInfo] = useState<{ terrain: string; elevation: number } | null>(null);
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
      width: container.clientWidth || 1024,
      height: container.clientHeight || 720,
      backgroundColor: 0x070b14, // Dark slate background
      preference: 'webgl',
    });
    rendererRef.current = renderer;

    let isMounted = true;

    // Load procedural world map with current seed
    const worldMap = createProceduralWorldMap(36, 26, currentSeed);
    renderer.setWorldMap(worldMap);

    renderer.initialize(container).then(() => {
      if (isMounted) {
        updateStats();
      }
    });

    const resizeObserver = new ResizeObserver((entries) => {
      if (!isMounted || renderer.isDestroyed) return;
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
  }, [currentSeed, updateStats]);

  // Pan Interaction (Mouse Drag)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rendererRef.current || rendererRef.current.isDestroyed) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      camX: rendererRef.current.camera.x,
      camY: rendererRef.current.camera.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rendererRef.current || !containerRef.current || rendererRef.current.isDestroyed) return;

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

    // Inspect hovered tile
    const worldMap = rendererRef.current.worldMap;
    if (worldMap) {
      const tileSize = worldMap.tileSize;
      const mapBounds = worldMap.getMapBounds();
      const halfW = (mapBounds.width * tileSize) / 2;
      const halfH = (mapBounds.height * tileSize) / 2;

      const tileX = Math.floor((worldPos.x + halfW) / tileSize);
      const tileY = Math.floor((worldPos.y + halfH) / tileSize);
      const tile = worldMap.getTile(tileX, tileY);

      if (tile) {
        setCursorTileInfo({
          terrain: tile.terrain,
          elevation: tile.elevation,
        });
      } else {
        setCursorTileInfo(null);
      }
    }

    if (isDragging && dragStartRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) / rendererRef.current.camera.zoom;
      const dy = (e.clientY - dragStartRef.current.y) / rendererRef.current.camera.zoom;
      rendererRef.current.camera.setPosition(
        dragStartRef.current.camX - dx,
        dragStartRef.current.camY - dy
      );
      rendererRef.current.render();
      updateStats();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Zoom Interaction (Mouse Wheel)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!rendererRef.current || !containerRef.current || rendererRef.current.isDestroyed) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const pivot = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (e.deltaY < 0) {
      rendererRef.current.camera.zoomIn(1.15, pivot);
    } else {
      rendererRef.current.camera.zoomOut(0.85, pivot);
    }
    rendererRef.current.render();
    updateStats();
  };

  // Camera Controls
  const handleZoomIn = () => {
    if (!rendererRef.current || rendererRef.current.isDestroyed) return;
    rendererRef.current.camera.zoomIn(1.25);
    rendererRef.current.render();
    updateStats();
  };

  const handleZoomOut = () => {
    if (!rendererRef.current || rendererRef.current.isDestroyed) return;
    rendererRef.current.camera.zoomOut(0.8);
    rendererRef.current.render();
    updateStats();
  };

  const handleResetCamera = () => {
    if (!rendererRef.current || rendererRef.current.isDestroyed) return;
    rendererRef.current.camera.reset();
    rendererRef.current.render();
    updateStats();
  };

  const handleRegenerateSeed = () => {
    // Generate next deterministic seed integer
    const nextSeed = typeof currentSeed === 'number' ? currentSeed + 1 : Number(currentSeed) + 1 || 12346;
    setCurrentSeed(nextSeed);
  };

  return (
    <div
      id="game-view"
      className={`relative w-full h-[calc(100vh-5rem)] min-h-[500px] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden select-none flex flex-col shadow-2xl ${className}`}
    >
      {/* Viewport Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing flex-1"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Top Left Header Overlay */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
        <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-2.5 shadow-xl">
          <Compass className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white tracking-wide">LIFE SIMULATION — PROCEDURAL WORLD</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80">
            Seed: {currentSeed}
          </span>
        </div>

        <button
          id="btn-regenerate-seed"
          onClick={handleRegenerateSeed}
          title="Generovat nový svět s dalším seedem"
          className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 backdrop-blur-md text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-all shadow-xl"
        >
          <Dice5 className="w-4 h-4" />
          <span className="hidden sm:inline">Další Seed</span>
        </button>
      </div>

      {/* Top Right Controls & Diagnostics Link */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {onOpenArchitectureHub && (
          <button
            id="btn-open-arch-hub"
            onClick={onOpenArchitectureHub}
            className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 backdrop-blur-md text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all shadow-xl"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Architecture Hub</span>
          </button>
        )}

        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md shadow-xl">
          <button
            id="game-zoom-in"
            onClick={handleZoomIn}
            title="Přiblížit (Zoom In)"
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="game-zoom-out"
            onClick={handleZoomOut}
            title="Oddálit (Zoom Out)"
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-800 mx-0.5" />
          <button
            id="game-camera-reset"
            onClick={handleResetCamera}
            title="Resetovat Kameru na střed (0, 0)"
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Telemetry HUD Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-md text-xs font-mono text-slate-300 shadow-xl">
          <Move className="w-3.5 h-3.5 text-slate-400" />
          <span>Camera:</span>
          <span className="text-indigo-300 font-semibold">X: {cameraStats.x}</span>
          <span className="text-indigo-300 font-semibold">Y: {cameraStats.y}</span>
          <span className="text-slate-600">|</span>
          <span>Zoom:</span>
          <span className="text-emerald-400 font-semibold">{cameraStats.zoom}x</span>
        </div>

        {cursorTileInfo && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-md text-xs font-mono text-slate-300 shadow-xl">
            <span className="text-slate-400">Tile:</span>
            <span className="text-amber-300 font-bold">{cursorTileInfo.terrain}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Height:</span>
            <span className="text-sky-300 font-semibold">{Math.round(cursorTileInfo.elevation * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
