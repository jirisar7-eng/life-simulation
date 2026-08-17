/**
 * Deterministic Random Number Generator Interface and Implementation.
 * Ensures the simulation never depends on Math.random() for core logic.
 */

export interface RandomSource {
  /** Returns a float in range [0, 1) */
  next(): number;
  /** Returns an integer in range [min, max] inclusive */
  nextInt(min: number, max: number): number;
  /** Returns a boolean with the specified probability (0.0 to 1.0) */
  nextBoolean(probability?: number): number extends 1 ? boolean : boolean;
  /** Current seed identifier */
  getSeed(): number | string;
  /** Resets the generator state with an optional new seed */
  reset(seed?: number | string): void;
}

/**
 * Fast 32-bit Mulberry32 PRNG. Deterministic across all platforms.
 */
export class SeededRandom implements RandomSource {
  private initialSeed: number | string;
  private state: number;

  constructor(seed: number | string = 1337) {
    this.initialSeed = seed;
    this.state = this.hashSeed(seed);
  }

  private hashSeed(seed: number | string): number {
    if (typeof seed === 'number') {
      return (seed >>> 0) || 1;
    }
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    }
    return (h >>> 0) || 1;
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    return Math.floor(this.next() * (high - low + 1)) + low;
  }

  public nextBoolean(probability = 0.5): boolean {
    return this.next() < probability;
  }

  public getSeed(): number | string {
    return this.initialSeed;
  }

  public reset(seed?: number | string): void {
    if (seed !== undefined) {
      this.initialSeed = seed;
    }
    this.state = this.hashSeed(this.initialSeed);
  }
}
