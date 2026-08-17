import { TerrainType, BiomeType, WaterState, MapTile } from './types';
import { WorldMap } from './WorldMap';
import { DeterministicNoise } from './noise';
import { SeededRandom } from '../../core/random';

export interface TerrainGeneratorConfig {
  seed?: number | string;
  elevationScale?: number;
  moistureScale?: number;
  octaves?: number;
  deepWaterThreshold?: number;
  shallowWaterThreshold?: number;
  beachThreshold?: number;
  plainsThreshold?: number;
  forestThreshold?: number;
  hillsThreshold?: number;
  mountainThreshold?: number;
  islandFalloff?: boolean;
}

export const DEFAULT_TERRAIN_CONFIG: Required<TerrainGeneratorConfig> = {
  seed: 12345,
  elevationScale: 0.06,
  moistureScale: 0.04,
  octaves: 4,
  deepWaterThreshold: 0.28,
  shallowWaterThreshold: 0.40,
  beachThreshold: 0.45,
  plainsThreshold: 0.65,
  forestThreshold: 0.76,
  hillsThreshold: 0.88,
  mountainThreshold: 1.00,
  islandFalloff: true,
};

export class TerrainGenerator {
  private readonly _config: Required<TerrainGeneratorConfig>;
  private readonly _elevationNoise: DeterministicNoise;
  private readonly _moistureNoise: DeterministicNoise;

  constructor(config: TerrainGeneratorConfig = {}) {
    this._config = { ...DEFAULT_TERRAIN_CONFIG, ...config };
    const seedStr = String(this._config.seed);
    this._elevationNoise = new DeterministicNoise(`${seedStr}_elevation`);
    this._moistureNoise = new DeterministicNoise(`${seedStr}_moisture`);
  }

  public get seed(): number | string {
    return this._config.seed;
  }

  /**
   * Generates a 2D heightmap matrix of normalized elevations [0.0, 1.0]
   */
  public generateHeightMap(width: number, height: number): number[][] {
    const heightMap: number[][] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let y = 0; y < height; y++) {
      heightMap[y] = [];
      for (let x = 0; x < width; x++) {
        let elevation = this._elevationNoise.fractal(
          x * this._config.elevationScale,
          y * this._config.elevationScale,
          this._config.octaves
        );

        if (this._config.islandFalloff) {
          // Subtle circular falloff towards edges to guarantee surrounding ocean
          const dx = (x - centerX) / centerX;
          const dy = (y - centerY) / centerY;
          const distSq = dx * dx + dy * dy;
          const falloff = Math.max(0, 1 - distSq * 0.65);
          elevation = elevation * falloff;
        }

        // Clamp to strictly [0.0, 1.0] and round to 4 decimals for precision
        elevation = Math.min(Math.max(elevation, 0.0), 1.0);
        heightMap[y][x] = Math.round(elevation * 10000) / 10000;
      }
    }
    return heightMap;
  }

  /**
   * Evaluates terrain type, water state, and biome from height and moisture
   */
  public classifyTile(
    x: number,
    y: number,
    elevation: number,
    width: number,
    height: number
  ): { terrain: TerrainType; water: WaterState; biome: BiomeType; moisture: number } {
    const rawMoisture = this._moistureNoise.fractal(
      x * this._config.moistureScale,
      y * this._config.moistureScale,
      3
    );
    const moisture = Math.min(Math.max(rawMoisture, 0.0), 1.0);

    // Latitude gradient for temperature / biome (warmer at bottom/center, colder at top)
    const latitude = y / Math.max(1, height);

    let terrain: TerrainType;
    let water: WaterState;
    let biome: BiomeType;

    if (elevation < this._config.deepWaterThreshold) {
      terrain = TerrainType.DEEP_WATER;
      water = WaterState.DEEP;
      biome = BiomeType.TEMPERATE;
    } else if (elevation < this._config.shallowWaterThreshold) {
      terrain = TerrainType.SHALLOW_WATER;
      water = WaterState.SHALLOW;
      biome = BiomeType.TEMPERATE;
    } else if (elevation < this._config.beachThreshold) {
      terrain = TerrainType.BEACH;
      water = WaterState.OCEAN;
      biome = BiomeType.TEMPERATE;
    } else if (elevation < this._config.plainsThreshold) {
      water = WaterState.NONE;
      if (moisture < 0.28) {
        terrain = TerrainType.DESERT;
        biome = BiomeType.ARID;
      } else {
        terrain = TerrainType.PLAINS;
        biome = latitude < 0.2 ? BiomeType.TUNDRA : (latitude > 0.8 ? BiomeType.TROPICAL : BiomeType.TEMPERATE);
      }
    } else if (elevation < this._config.forestThreshold) {
      water = WaterState.NONE;
      if (moisture > 0.45) {
        terrain = TerrainType.FOREST;
        biome = latitude > 0.75 ? BiomeType.TROPICAL : BiomeType.TEMPERATE;
      } else {
        terrain = TerrainType.PLAINS;
        biome = BiomeType.TEMPERATE;
      }
    } else if (elevation < this._config.hillsThreshold) {
      water = WaterState.NONE;
      terrain = TerrainType.HILLS;
      biome = latitude < 0.3 ? BiomeType.COLD : BiomeType.TEMPERATE;
    } else {
      water = WaterState.NONE;
      terrain = TerrainType.MOUNTAINS;
      biome = BiomeType.COLD;
    }

    return { terrain, water, biome, moisture };
  }

  /**
   * Generates a fully populated WorldMap instance
   */
  public generate(
    width = 32,
    height = 24,
    options: { tileSize?: number; name?: string; id?: string } = {}
  ): WorldMap {
    const map = new WorldMap({
      id: options.id ?? `procedural_map_${this.seed}`,
      name: options.name ?? `World ${this.seed}`,
      width,
      height,
      tileSize: options.tileSize ?? 32,
      seed: this.seed,
      defaultTerrain: TerrainType.DEEP_WATER,
      defaultElevation: 0,
      defaultWater: WaterState.DEEP,
    });

    const heightMap = this.generateHeightMap(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const elevation = heightMap[y][x];
        const tileInfo = this.classifyTile(x, y, elevation, width, height);

        map.setTile(x, y, {
          elevation,
          terrain: tileInfo.terrain,
          water: tileInfo.water,
          biome: tileInfo.biome,
          moisture: tileInfo.moisture,
        });
      }
    }

    return map;
  }
}

/**
 * Factory function to create procedural world map
 */
export function createProceduralWorldMap(
  width = 32,
  height = 24,
  seed: number | string = 12345,
  config: Partial<TerrainGeneratorConfig> = {}
): WorldMap {
  const generator = new TerrainGenerator({ seed, ...config });
  return generator.generate(width, height);
}
