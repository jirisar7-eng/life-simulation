import { WorldPosition, ScreenPosition, CameraState, CameraOptions } from '../types';

export class Camera {
  private _x: number;
  private _y: number;
  private _zoom: number;
  private _minZoom: number;
  private _maxZoom: number;
  private _viewportWidth: number;
  private _viewportHeight: number;

  constructor(options: CameraOptions = {}) {
    this._x = options.x ?? 0;
    this._y = options.y ?? 0;
    this._minZoom = options.minZoom ?? 0.1;
    this._maxZoom = options.maxZoom ?? 10.0;
    this._zoom = this._clampZoom(options.zoom ?? 1.0);
    this._viewportWidth = options.viewportWidth ?? 800;
    this._viewportHeight = options.viewportHeight ?? 600;
  }

  public get x(): number {
    return this._x;
  }

  public set x(value: number) {
    this._x = value;
  }

  public get y(): number {
    return this._y;
  }

  public set y(value: number) {
    this._y = value;
  }

  public get zoom(): number {
    return this._zoom;
  }

  public set zoom(value: number) {
    this._zoom = this._clampZoom(value);
  }

  public get minZoom(): number {
    return this._minZoom;
  }

  public set minZoom(value: number) {
    this._minZoom = Math.max(0.001, value);
    this._zoom = this._clampZoom(this._zoom);
  }

  public get maxZoom(): number {
    return this._maxZoom;
  }

  public set maxZoom(value: number) {
    this._maxZoom = Math.max(this._minZoom, value);
    this._zoom = this._clampZoom(this._zoom);
  }

  public get viewportWidth(): number {
    return this._viewportWidth;
  }

  public get viewportHeight(): number {
    return this._viewportHeight;
  }

  public setViewport(width: number, height: number): void {
    this._viewportWidth = Math.max(1, width);
    this._viewportHeight = Math.max(1, height);
  }

  public getState(): CameraState {
    return {
      x: this._x,
      y: this._y,
      zoom: this._zoom,
    };
  }

  public setState(state: Partial<CameraState>): void {
    if (state.x !== undefined) this._x = state.x;
    if (state.y !== undefined) this._y = state.y;
    if (state.zoom !== undefined) this._zoom = this._clampZoom(state.zoom);
  }

  // Camera API Methods
  public setPosition(x: number, y: number): void {
    this._x = x;
    this._y = y;
  }

  public move(dx: number, dy: number): void {
    this._x += dx;
    this._y += dy;
  }

  public pan(dx: number, dy: number): void {
    this.move(dx, dy);
  }

  public setZoom(zoom: number): void {
    this.zoom = zoom;
  }

  public zoomIn(factor = 1.25, pivot?: ScreenPosition): void {
    this.zoomBy(factor, pivot);
  }

  public zoomOut(factor = 0.8, pivot?: ScreenPosition): void {
    this.zoomBy(factor, pivot);
  }

  public zoomBy(factor: number, pivot?: ScreenPosition): void {
    const nextZoom = this._clampZoom(this._zoom * factor);
    if (pivot) {
      const worldBefore = this.screenToWorld(pivot);
      this._zoom = nextZoom;
      const worldAfter = this.screenToWorld(pivot);
      this._x += worldBefore.x - worldAfter.x;
      this._y += worldBefore.y - worldAfter.y;
    } else {
      this._zoom = nextZoom;
    }
  }

  public reset(): void {
    this._x = 0;
    this._y = 0;
    this._zoom = 1.0;
  }

  public worldToScreen(worldPos: WorldPosition): ScreenPosition {
    return {
      x: (worldPos.x - this._x) * this._zoom + this._viewportWidth / 2,
      y: (worldPos.y - this._y) * this._zoom + this._viewportHeight / 2,
    };
  }

  public screenToWorld(screenPos: ScreenPosition): WorldPosition {
    return {
      x: (screenPos.x - this._viewportWidth / 2) / this._zoom + this._x,
      y: (screenPos.y - this._viewportHeight / 2) / this._zoom + this._y,
    };
  }

  private _clampZoom(zoom: number): number {
    if (Number.isNaN(zoom)) return 1.0;
    return Math.min(Math.max(zoom, this._minZoom), this._maxZoom);
  }
}
