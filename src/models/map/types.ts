export enum TerrainType {
  OCEAN = 'OCEAN',
  COAST = 'COAST',
  PLAINS = 'PLAINS',
  FOREST = 'FOREST',
  HILLS = 'HILLS',
  MOUNTAINS = 'MOUNTAINS',
  DESERT = 'DESERT',
}

export enum BiomeType {
  TEMPERATE = 'temperate',
  TROPICAL = 'tropical',
  ARID = 'arid',
  COLD = 'cold',
  TUNDRA = 'tundra',
}

export enum WaterState {
  NONE = 'NONE',
  RIVER = 'RIVER',
  LAKE = 'LAKE',
  OCEAN = 'OCEAN',
}

export interface MapTile {
  id: string;
  x: number;
  y: number;
  elevation: number; // Normalized -1.0 (deep ocean) to +1.0 (high peaks) or 0 to 100
  terrain: TerrainType;
  water: WaterState;
  biome: BiomeType;
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

export interface WorldMapOptions {
  id?: string;
  name?: string;
  width: number;
  height: number;
  tileSize?: number;
  defaultTerrain?: TerrainType;
  defaultBiome?: BiomeType;
  defaultElevation?: number;
  defaultWater?: WaterState;
}
