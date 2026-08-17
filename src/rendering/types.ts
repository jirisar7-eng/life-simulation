export interface WorldPosition {
  x: number;
  y: number;
}

export interface ScreenPosition {
  x: number;
  y: number;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface CameraOptions {
  x?: number;
  y?: number;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  viewportWidth?: number;
  viewportHeight?: number;
}

export interface RendererConfig {
  width: number;
  height: number;
  backgroundColor?: number;
  antialias?: boolean;
  resolution?: number;
  autoDensity?: boolean;
  preference?: 'webgl' | 'webgpu';
}
