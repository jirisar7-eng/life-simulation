import { Application, Container, Graphics } from 'pixi.js';
import { Camera } from './camera/Camera';
import { RendererConfig, WorldPosition, ScreenPosition } from './types';
import { DEFAULT_RENDERER_CONFIG } from './RendererConfig';
import { WorldMap, TerrainType } from '../models/map';

export class WorldRenderer {
  private _app: Application | null = null;
  private _camera: Camera;
  private _config: RendererConfig;
  private _worldContainer: Container | null = null;
  private _mapContainer: Container | null = null;
  private _mapGraphics: Graphics | null = null;
  private _debugGraphics: Graphics | null = null;
  private _worldMap: WorldMap | null = null;
  private _isInitialized = false;
  private _isDestroyed = false;

  constructor(config: Partial<RendererConfig> = {}) {
    this._config = { ...DEFAULT_RENDERER_CONFIG, ...config };
    this._camera = new Camera({
      viewportWidth: this._config.width,
      viewportHeight: this._config.height,
    });
  }

  public get camera(): Camera {
    return this._camera;
  }

  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  public get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  public get app(): Application | null {
    return this._app;
  }

  public get canvas(): HTMLCanvasElement | null {
    if (!this._app || !this._app.canvas) return null;
    return this._app.canvas as HTMLCanvasElement;
  }

  public get worldMap(): WorldMap | null {
    return this._worldMap;
  }

  public setWorldMap(map: WorldMap | null): void {
    this._worldMap = map;
    if (this._isInitialized && !this._isDestroyed) {
      this._renderMapTiles();
      this.render();
    }
  }

  public async initialize(targetElement?: HTMLElement | HTMLCanvasElement): Promise<void> {
    if (this._isInitialized || this._isDestroyed) return;

    const app = new Application();
    await app.init({
      width: this._config.width,
      height: this._config.height,
      backgroundColor: this._config.backgroundColor,
      antialias: this._config.antialias,
      resolution: this._config.resolution,
      autoDensity: this._config.autoDensity,
      preference: this._config.preference || 'webgl',
      canvas: targetElement instanceof HTMLCanvasElement ? targetElement : undefined,
    });

    // If destroy was called while app.init() was resolving (e.g. React StrictMode unmount)
    if (this._isDestroyed) {
      try {
        app.destroy(true, { children: true, texture: true });
      } catch {
        // ignore
      }
      return;
    }

    this._app = app;

    if (targetElement && !(targetElement instanceof HTMLCanvasElement) && app.canvas) {
      targetElement.appendChild(app.canvas);
    }

    this._worldContainer = new Container();
    app.stage.addChild(this._worldContainer);

    this._mapContainer = new Container();
    this._worldContainer.addChild(this._mapContainer);

    this._mapGraphics = new Graphics();
    this._mapContainer.addChild(this._mapGraphics);

    this._debugGraphics = new Graphics();
    this._worldContainer.addChild(this._debugGraphics);

    this._buildGridAxes();
    this._renderMapTiles();

    this._isInitialized = true;
    this.render();
  }

  public resize(width: number, height: number): void {
    if (!this._app || !this._app.renderer || !this._isInitialized || this._isDestroyed) return;

    const safeW = Math.max(10, width);
    const safeH = Math.max(10, height);

    this._config.width = safeW;
    this._config.height = safeH;
    this._camera.setViewport(safeW, safeH);
    this._app.renderer.resize(safeW, safeH);

    this.render();
  }

  public render(): void {
    if (!this._app || !this._app.renderer || !this._worldContainer || !this._isInitialized || this._isDestroyed) return;

    // Apply Camera transform to world container
    // Pivot at center of screen
    const screenCenter = {
      x: this._camera.viewportWidth / 2,
      y: this._camera.viewportHeight / 2,
    };

    this._worldContainer.position.set(
      screenCenter.x - this._camera.x * this._camera.zoom,
      screenCenter.y - this._camera.y * this._camera.zoom
    );
    this._worldContainer.scale.set(this._camera.zoom);

    this._app.render();
  }

  public worldToScreen(worldPos: WorldPosition): ScreenPosition {
    return this._camera.worldToScreen(worldPos);
  }

  public screenToWorld(screenPos: ScreenPosition): WorldPosition {
    return this._camera.screenToWorld(screenPos);
  }

  public destroy(): void {
    this._isDestroyed = true;
    this._isInitialized = false;

    const app = this._app;
    this._app = null;
    this._worldContainer = null;
    this._mapContainer = null;
    this._mapGraphics = null;
    this._debugGraphics = null;
    this._worldMap = null;

    if (app) {
      try {
        if (app.canvas && app.canvas.parentElement) {
          app.canvas.parentElement.removeChild(app.canvas);
        }
        app.destroy(true, { children: true, texture: true });
      } catch {
        // safe fallback if already destroyed
      }
    }
  }

  private _renderMapTiles(): void {
    if (!this._mapGraphics) return;

    this._mapGraphics.clear();

    if (!this._worldMap) {
      // Fallback: render basic sample geometric objects if no map is attached
      this._buildSampleFallbackObjects();
      return;
    }

    const tileSize = this._worldMap.tileSize;
    const mapBounds = this._worldMap.getMapBounds();
    const halfWidth = (mapBounds.width * tileSize) / 2;
    const halfHeight = (mapBounds.height * tileSize) / 2;

    const tiles = this._worldMap.getAllTiles();

    for (const tile of tiles) {
      const tileWorldX = tile.x * tileSize - halfWidth;
      const tileWorldY = tile.y * tileSize - halfHeight;

      const color = this._getTerrainColor(tile.terrain);
      const strokeColor = this._getTerrainStrokeColor(tile.terrain);

      this._mapGraphics
        .rect(tileWorldX, tileWorldY, tileSize - 1, tileSize - 1)
        .fill({ color, alpha: 0.9 })
        .stroke({ width: 1, color: strokeColor });
    }
  }

  private _getTerrainColor(terrain: TerrainType): number {
    switch (terrain) {
      case TerrainType.OCEAN:
        return 0x0284c7; // Sky-600 deep blue
      case TerrainType.COAST:
        return 0x38bdf8; // Sky-400 coastal waters
      case TerrainType.PLAINS:
        return 0x22c55e; // Green-500 lush plains
      case TerrainType.FOREST:
        return 0x15803d; // Green-700 deep forest
      case TerrainType.HILLS:
        return 0x84cc16; // Lime-500 rolling hills
      case TerrainType.MOUNTAINS:
        return 0x64748b; // Slate-500 mountain rock
      case TerrainType.DESERT:
        return 0xeab308; // Yellow-500 desert sands
      default:
        return 0x475569; // Slate-600
    }
  }

  private _getTerrainStrokeColor(terrain: TerrainType): number {
    switch (terrain) {
      case TerrainType.OCEAN:
        return 0x0369a1;
      case TerrainType.COAST:
        return 0x0284c7;
      case TerrainType.PLAINS:
        return 0x16a34a;
      case TerrainType.FOREST:
        return 0x166534;
      case TerrainType.HILLS:
        return 0x65a30d;
      case TerrainType.MOUNTAINS:
        return 0x475569;
      case TerrainType.DESERT:
        return 0xca8a04;
      default:
        return 0x334155;
    }
  }

  private _buildGridAxes(): void {
    if (!this._debugGraphics) return;

    this._debugGraphics.clear();

    // 1. Grid Axes (World Origin 0,0)
    this._debugGraphics
      .moveTo(-1000, 0)
      .lineTo(1000, 0)
      .stroke({ width: 2, color: 0x334155, alpha: 0.7 });

    this._debugGraphics
      .moveTo(0, -1000)
      .lineTo(0, 1000)
      .stroke({ width: 2, color: 0x334155, alpha: 0.7 });

    // 2. World Origin Indicator (0,0)
    this._debugGraphics
      .circle(0, 0, 8)
      .fill({ color: 0x6366f1 }) // Indigo-500
      .stroke({ width: 2, color: 0xffffff });
  }

  private _buildSampleFallbackObjects(): void {
    if (!this._mapGraphics) return;

    // Region A indicator (Top-Left)
    this._mapGraphics
      .rect(-300, -200, 120, 80)
      .fill({ color: 0x0ea5e9, alpha: 0.8 })
      .stroke({ width: 2, color: 0x38bdf8 });

    // Region B indicator (Top-Right)
    this._mapGraphics
      .circle(260, -180, 50)
      .fill({ color: 0x10b981, alpha: 0.8 })
      .stroke({ width: 2, color: 0x34d399 });

    // Settlement C indicator (Bottom-Right)
    this._mapGraphics
      .poly([
        { x: 200, y: 150 },
        { x: 280, y: 220 },
        { x: 140, y: 220 },
      ])
      .fill({ color: 0xf59e0b, alpha: 0.85 })
      .stroke({ width: 2, color: 0xfbbf24 });

    // Landmark D indicator (Bottom-Left)
    this._mapGraphics
      .star(-240, 180, 5, 45, 20)
      .fill({ color: 0xec4899, alpha: 0.85 })
      .stroke({ width: 2, color: 0xf472b6 });
  }
}
