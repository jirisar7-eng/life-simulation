export enum TerrainType {
  DEEP_WATER = 'DEEP_WATER',
  SHALLOW_WATER = 'SHALLOW_WATER',
  BEACH = 'BEACH',
  PLAINS = 'PLAINS',
  FOREST = 'FOREST',
  HILLS = 'HILLS',
  MOUNTAINS = 'MOUNTAINS',
  DESERT = 'DESERT',
  // Backward compatibility aliases
  OCEAN = 'DEEP_WATER',
  COAST = 'BEACH',
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
  SHALLOW = 'SHALLOW',
  DEEP = 'DEEP',
}

export interface MapTile {
  id: string;
  x: number;
  y: number;
  elevation: number; // Normalized 0.0 to 1.0
  terrain: TerrainType;
  water: WaterState;
  biome: BiomeType;
  moisture?: number; // Normalized 0.0 to 1.0 (optional climate parameter)
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
  seed?: number | string;
  defaultTerrain?: TerrainType;
  defaultBiome?: BiomeType;
  defaultElevation?: number;
  defaultWater?: WaterState;
}
