import { RendererConfig } from './types';

export const DEFAULT_RENDERER_CONFIG: RendererConfig = {
  width: 800,
  height: 600,
  backgroundColor: 0x0f172a, // Slate-900 neutral dark tone
  antialias: true,
  resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  autoDensity: true,
  preference: 'webgl',
};
