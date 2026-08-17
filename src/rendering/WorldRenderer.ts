import { Application, Container, Graphics } from 'pixi.js';
import { Camera } from './camera/Camera';
import { RendererConfig, WorldPosition, ScreenPosition } from './types';
import { DEFAULT_RENDERER_CONFIG } from './RendererConfig';

export class WorldRenderer {
  private _app: Application | null = null;
  private _camera: Camera;
  private _config: RendererConfig;
  private _worldContainer: Container | null = null;
  private _debugGraphics: Graphics | null = null;
  private _isInitialized = false;

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

  public get app(): Application | null {
    return this._app;
  }

  public get canvas(): HTMLCanvasElement | null {
    return this._app ? (this._app.canvas as HTMLCanvasElement) : null;
  }

  public async initialize(targetElement?: HTMLElement | HTMLCanvasElement): Promise<void> {
    if (this._isInitialized) return;

    this._app = new Application();
    await this._app.init({
      width: this._config.width,
      height: this._config.height,
      backgroundColor: this._config.backgroundColor,
      antialias: this._config.antialias,
      resolution: this._config.resolution,
      autoDensity: this._config.autoDensity,
      preference: this._config.preference || 'webgl',
      canvas: targetElement instanceof HTMLCanvasElement ? targetElement : undefined,
    });

    if (targetElement && !(targetElement instanceof HTMLCanvasElement)) {
      targetElement.appendChild(this._app.canvas);
    }

    this._worldContainer = new Container();
    this._app.stage.addChild(this._worldContainer);

    this._debugGraphics = new Graphics();
    this._worldContainer.addChild(this._debugGraphics);

    this._buildTestScene();
    this._isInitialized = true;
    this.render();
  }

  public resize(width: number, height: number): void {
    if (!this._app || !this._isInitialized) return;

    const safeW = Math.max(10, width);
    const safeH = Math.max(10, height);

    this._config.width = safeW;
    this._config.height = safeH;
    this._camera.setViewport(safeW, safeH);
    this._app.renderer.resize(safeW, safeH);

    this.render();
  }

  public render(): void {
    if (!this._app || !this._worldContainer || !this._isInitialized) return;

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
    if (!this._app) return;

    this._isInitialized = false;
    this._worldContainer = null;
    this._debugGraphics = null;

    try {
      this._app.destroy(true, { children: true, texture: true });
    } catch {
      // safe fallback if already destroyed
    }
    this._app = null;
  }

  private _buildTestScene(): void {
    if (!this._debugGraphics) return;

    this._debugGraphics.clear();

    // 1. Grid Axes (World Origin 0,0)
    // Horizontal axis X
    this._debugGraphics
      .moveTo(-1000, 0)
      .lineTo(1000, 0)
      .stroke({ width: 2, color: 0x334155 }); // Slate-700

    // Vertical axis Y
    this._debugGraphics
      .moveTo(0, -1000)
      .lineTo(0, 1000)
      .stroke({ width: 2, color: 0x334155 });

    // Grid ticks (-400, -200, 200, 400)
    for (let pos = -800; pos <= 800; pos += 200) {
      if (pos === 0) continue;
      this._debugGraphics
        .moveTo(pos, -10)
        .lineTo(pos, 10)
        .stroke({ width: 1, color: 0x475569 });
      this._debugGraphics
        .moveTo(-10, pos)
        .lineTo(10, pos)
        .stroke({ width: 1, color: 0x475569 });
    }

    // 2. World Origin Indicator (0,0)
    this._debugGraphics
      .circle(0, 0, 12)
      .fill({ color: 0x6366f1 }) // Indigo-500
      .stroke({ width: 3, color: 0xffffff });

    // 3. Test Geometric Shapes (World Coordinates)
    // Region A indicator (Top-Left)
    this._debugGraphics
      .rect(-300, -200, 120, 80)
      .fill({ color: 0x0ea5e9, alpha: 0.8 }) // Sky-500
      .stroke({ width: 2, color: 0x38bdf8 });

    // Region B indicator (Top-Right)
    this._debugGraphics
      .circle(260, -180, 50)
      .fill({ color: 0x10b981, alpha: 0.8 }) // Emerald-500
      .stroke({ width: 2, color: 0x34d399 });

    // Settlement C indicator (Bottom-Right)
    this._debugGraphics
      .poly([
        { x: 200, y: 150 },
        { x: 280, y: 220 },
        { x: 140, y: 220 },
      ])
      .fill({ color: 0xf59e0b, alpha: 0.85 }) // Amber-500
      .stroke({ width: 2, color: 0xfbbf24 });

    // Landmark D indicator (Bottom-Left)
    this._debugGraphics
      .star(-240, 180, 5, 45, 20)
      .fill({ color: 0xec4899, alpha: 0.85 }) // Pink-500
      .stroke({ width: 2, color: 0xf472b6 });
  }
}
