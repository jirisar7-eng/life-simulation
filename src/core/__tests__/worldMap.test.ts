import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  WorldMap,
  createWorldMap,
  createSampleWorldMap,
  TerrainType,
  BiomeType,
  WaterState,
} from '../../models/map';

describe('WorldMap Data Foundation', () => {
  test('creates map with valid bounds and initialized default tiles', () => {
    const map = createWorldMap({
      width: 10,
      height: 8,
      tileSize: 32,
      defaultTerrain: TerrainType.PLAINS,
      defaultBiome: BiomeType.TEMPERATE,
      defaultElevation: 12,
      defaultWater: WaterState.NONE,
    });

    assert.strictEqual(map.width, 10);
    assert.strictEqual(map.height, 8);
    assert.strictEqual(map.tileSize, 32);
    assert.strictEqual(map.totalTiles, 80);

    const bounds = map.getMapBounds();
    assert.deepStrictEqual(bounds, {
      minX: 0,
      maxX: 9,
      minY: 0,
      maxY: 7,
      width: 10,
      height: 8,
    });

    const tile = map.getTile(0, 0);
    assert.ok(tile !== undefined);
    assert.strictEqual(tile?.x, 0);
    assert.strictEqual(tile?.y, 0);
    assert.strictEqual(tile?.terrain, TerrainType.PLAINS);
    assert.strictEqual(tile?.biome, BiomeType.TEMPERATE);
    assert.strictEqual(tile?.elevation, 12);
    assert.strictEqual(tile?.water, WaterState.NONE);
  });

  test('rejects non-positive dimensions during map creation', () => {
    assert.throws(() => {
      createWorldMap({ width: 0, height: 10 });
    }, /Invalid map dimensions/);

    assert.throws(() => {
      createWorldMap({ width: 10, height: -5 });
    }, /Invalid map dimensions/);
  });

  test('validates coordinate boundaries for isWithinBounds and getTile', () => {
    const map = createWorldMap({ width: 5, height: 5 });

    assert.strictEqual(map.isWithinBounds(0, 0), true);
    assert.strictEqual(map.isWithinBounds(4, 4), true);
    assert.strictEqual(map.isWithinBounds(2, 3), true);

    // Out of bounds
    assert.strictEqual(map.isWithinBounds(-1, 0), false);
    assert.strictEqual(map.isWithinBounds(0, -1), false);
    assert.strictEqual(map.isWithinBounds(5, 0), false);
    assert.strictEqual(map.isWithinBounds(0, 5), false);
    assert.strictEqual(map.isWithinBounds(2.5, 3), false);

    assert.strictEqual(map.getTile(-1, 2), undefined);
    assert.strictEqual(map.getTile(5, 5), undefined);
  });

  test('updates tile attributes via setTile() safely', () => {
    const map = createWorldMap({ width: 4, height: 4 });

    const success = map.setTile(2, 2, {
      terrain: TerrainType.MOUNTAINS,
      elevation: 95,
      water: WaterState.NONE,
      biome: BiomeType.COLD,
    });
    assert.strictEqual(success, true);

    const tile = map.getTile(2, 2);
    assert.ok(tile !== undefined);
    assert.strictEqual(tile?.x, 2);
    assert.strictEqual(tile?.y, 2);
    assert.strictEqual(tile?.terrain, TerrainType.MOUNTAINS);
    assert.strictEqual(tile?.elevation, 95);
    assert.strictEqual(tile?.biome, BiomeType.COLD);

    // Invalid tile update
    const failed = map.setTile(10, 10, { terrain: TerrainType.DESERT });
    assert.strictEqual(failed, false);
  });

  test('ensures getTile() returns decoupled clone avoiding external mutations', () => {
    const map = createWorldMap({ width: 3, height: 3 });
    const tile = map.getTile(1, 1);
    assert.ok(tile !== undefined);

    // Mutate the returned object
    tile.elevation = 999;

    // Verify stored state in map was not altered
    const freshTile = map.getTile(1, 1);
    assert.notStrictEqual(freshTile?.elevation, 999);
  });

  test('generates sample map deterministically with SeededRandom', () => {
    const map1 = createSampleWorldMap(12, 10, 1337);
    const map2 = createSampleWorldMap(12, 10, 1337);
    const map3 = createSampleWorldMap(12, 10, 9999);

    const tiles1 = map1.getAllTiles();
    const tiles2 = map2.getAllTiles();
    const tiles3 = map3.getAllTiles();

    assert.strictEqual(tiles1.length, tiles2.length);
    assert.deepStrictEqual(tiles1, tiles2, 'Maps generated with same seed must be 100% identical');

    // Maps with different seeds should differ
    const isDifferent = tiles1.some((t1, idx) => {
      const t3 = tiles3[idx];
      return t1.terrain !== t3.terrain || t1.elevation !== t3.elevation;
    });
    assert.strictEqual(isDifferent, true, 'Maps with different seeds should differ');
  });
});
