import {
  MapTile,
  TerrainType,
  BiomeType,
  WaterState,
  MapBounds,
  WorldMapOptions,
} from './types';
import { TerrainGenerator } from './TerrainGenerator';

export class WorldMap {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _width: number;
  private readonly _height: number;
  private readonly _tileSize: number;
  private readonly _seed: number | string;
  private readonly _tiles: Map<string, MapTile>;

  constructor(options: WorldMapOptions) {
    if (options.width <= 0 || options.height <= 0) {
      throw new Error(`Invalid map dimensions: width and height must be positive integers, got ${options.width}x${options.height}`);
    }

    this._id = options.id ?? `map_${Date.now()}`;
    this._name = options.name ?? 'World Map';
    this._width = Math.floor(options.width);
    this._height = Math.floor(options.height);
    this._tileSize = options.tileSize ?? 32;
    this._seed = options.seed ?? 12345;
    this._tiles = new Map();

    const defaultTerrain = options.defaultTerrain ?? TerrainType.PLAINS;
    const defaultBiome = options.defaultBiome ?? BiomeType.TEMPERATE;
    const defaultElevation = options.defaultElevation ?? 0.5;
    const defaultWater = options.defaultWater ?? WaterState.NONE;

    // Initialize map grid with deterministic default tiles
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const key = this._getCoordKey(x, y);
        this._tiles.set(key, {
          id: `tile_${x}_${y}`,
          x,
          y,
          elevation: defaultElevation,
          terrain: defaultTerrain,
          water: defaultWater,
          biome: defaultBiome,
        });
      }
    }
  }

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get seed(): number | string {
    return this._seed;
  }

  public get width(): number {
    return this._width;
  }

  public get height(): number {
    return this._height;
  }

  public get tileSize(): number {
    return this._tileSize;
  }

  public get totalTiles(): number {
    return this._tiles.size;
  }

  public isWithinBounds(x: number, y: number): boolean {
    return x >= 0 && x < this._width && y >= 0 && y < this._height && Number.isInteger(x) && Number.isInteger(y);
  }

  public getTile(x: number, y: number): MapTile | undefined {
    if (!this.isWithinBounds(x, y)) {
      return undefined;
    }
    const tile = this._tiles.get(this._getCoordKey(x, y));
    return tile ? { ...tile } : undefined;
  }

  public setTile(x: number, y: number, patch: Partial<Omit<MapTile, 'id' | 'x' | 'y'>>): boolean {
    if (!this.isWithinBounds(x, y)) {
      return false;
    }
    const key = this._getCoordKey(x, y);
    const existing = this._tiles.get(key);
    if (!existing) {
      return false;
    }

    this._tiles.set(key, {
      ...existing,
      ...patch,
      id: existing.id,
      x: existing.x,
      y: existing.y,
    });
    return true;
  }

  public getMapBounds(): MapBounds {
    return {
      minX: 0,
      maxX: this._width - 1,
      minY: 0,
      maxY: this._height - 1,
      width: this._width,
      height: this._height,
    };
  }

  public getAllTiles(): MapTile[] {
    return Array.from(this._tiles.values()).map(tile => ({ ...tile }));
  }

  private _getCoordKey(x: number, y: number): string {
    return `${x},${y}`;
  }
}

/**
 * Factory function to create a new WorldMap instance
 */
export function createWorldMap(options: WorldMapOptions): WorldMap {
  return new WorldMap(options);
}

/**
 * Sample generator powered deterministically by TerrainGenerator
 */
export function createSampleWorldMap(
  width = 32,
  height = 24,
  seed: number | string = 12345
): WorldMap {
  const generator = new TerrainGenerator({ seed });
  return generator.generate(width, height);
}
