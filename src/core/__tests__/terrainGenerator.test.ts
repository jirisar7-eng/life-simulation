import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  TerrainGenerator,
  createProceduralWorldMap,
  TerrainType,
  BiomeType,
  WaterState,
} from '../../models/map';
import { World, createWorld } from '../../models/world';

describe('Procedural Terrain & HeightMap Generation', () => {
  test('generates heightmap with all elevations in normalized range [0.0, 1.0]', () => {
    const generator = new TerrainGenerator({ seed: 12345 });
    const width = 20;
    const height = 15;
    const heightMap = generator.generateHeightMap(width, height);

    assert.strictEqual(heightMap.length, height);
    assert.strictEqual(heightMap[0].length, width);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const elevation = heightMap[y][x];
        assert.ok(
          elevation >= 0.0 && elevation <= 1.0,
          `Elevation at (${x},${y}) was out of bounds: ${elevation}`
        );
        assert.ok(!Number.isNaN(elevation), `Elevation at (${x},${y}) was NaN`);
      }
    }
  });

  test('identical seeds produce 100% identical heightmaps and terrain (determinism)', () => {
    const genA = new TerrainGenerator({ seed: 98765 });
    const genB = new TerrainGenerator({ seed: 98765 });

    const mapA = genA.generate(24, 18);
    const mapB = genB.generate(24, 18);

    assert.strictEqual(mapA.totalTiles, mapB.totalTiles);

    const tilesA = mapA.getAllTiles();
    for (const tileA of tilesA) {
      const tileB = mapB.getTile(tileA.x, tileA.y);
      assert.ok(tileB !== undefined);
      assert.strictEqual(tileA.elevation, tileB.elevation);
      assert.strictEqual(tileA.terrain, tileB.terrain);
      assert.strictEqual(tileA.water, tileB.water);
      assert.strictEqual(tileA.biome, tileB.biome);
    }
  });

  test('different seeds produce different terrain and heightmaps', () => {
    const map1 = createProceduralWorldMap(20, 20, 1111);
    const map2 = createProceduralWorldMap(20, 20, 9999);

    const tiles1 = map1.getAllTiles();
    let differenceCount = 0;

    for (const t1 of tiles1) {
      const t2 = map2.getTile(t1.x, t1.y);
      if (t2 && (t1.elevation !== t2.elevation || t1.terrain !== t2.terrain)) {
        differenceCount++;
      }
    }

    assert.ok(
      differenceCount > 10,
      `Expected maps with different seeds to differ significantly, found only ${differenceCount} differences`
    );
  });

  test('all generated tiles have valid terrain types, elevations, and biomes', () => {
    const validTerrains = new Set(Object.values(TerrainType));
    const validBiomes = new Set(Object.values(BiomeType));
    const validWater = new Set(Object.values(WaterState));

    const map = createProceduralWorldMap(30, 20, 4242);
    const tiles = map.getAllTiles();

    assert.strictEqual(tiles.length, 30 * 20);

    const terrainDistribution = new Map<TerrainType, number>();

    for (const tile of tiles) {
      assert.ok(validTerrains.has(tile.terrain), `Unknown terrain type: ${tile.terrain}`);
      assert.ok(validBiomes.has(tile.biome), `Unknown biome type: ${tile.biome}`);
      assert.ok(validWater.has(tile.water), `Unknown water state: ${tile.water}`);
      assert.ok(tile.elevation >= 0.0 && tile.elevation <= 1.0, `Invalid elevation: ${tile.elevation}`);

      terrainDistribution.set(tile.terrain, (terrainDistribution.get(tile.terrain) ?? 0) + 1);
    }

    // Verify presence of major terrain features (water, land/plains, mountains/hills)
    assert.ok((terrainDistribution.get(TerrainType.DEEP_WATER) ?? 0) > 0, 'Deep water should be present');
    assert.ok((terrainDistribution.get(TerrainType.PLAINS) ?? 0) > 0, 'Plains should be present');
  });

  test('World class stores and exposes seed properly', () => {
    const world = createWorld('world-1', 'Eden', 'Test World', 100, undefined, {}, 54321);
    assert.strictEqual(world.seed, 54321);
    assert.strictEqual(world.identity.seed, 54321);
  });
});
