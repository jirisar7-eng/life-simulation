import { RandomSource, SeededRandom } from '../../core/random';

/**
 * Lightweight deterministic 2D Gradient Noise.
 * Pure deterministic hash-based implementation without external dependencies or Math.random().
 */
export class DeterministicNoise {
  private perm: Uint8Array;

  constructor(seed: number | string = 1337) {
    const rng = new SeededRandom(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    // Fisher-Yates shuffle using deterministic SeededRandom
    for (let i = 255; i > 0; i--) {
      const j = rng.nextInt(0, i);
      const temp = p[i];
      p[i] = p[j];
      p[j] = temp;
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    switch (h) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      case 3: return -x - y;
      default: return 0;
    }
  }

  /**
   * 2D Perlin noise value in range [-1.0, 1.0]
   */
  public noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.perm[this.perm[X] + Y];
    const ab = this.perm[this.perm[X] + Y + 1];
    const ba = this.perm[this.perm[X + 1] + Y];
    const bb = this.perm[this.perm[X + 1] + Y + 1];

    const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf));
    const x2 = this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1));

    return this.lerp(v, x1, x2);
  }

  /**
   * Fractal Brownian Motion (fBm) multi-octave noise.
   * Returns a normalized value strictly in range [0.0, 1.0].
   */
  public fractal(
    x: number,
    y: number,
    octaves = 4,
    lacunarity = 2.0,
    persistence = 0.5
  ): number {
    let total = 0;
    let frequency = 1.0;
    let amplitude = 1.0;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    // Normalize from [-maxValue, maxValue] to [0.0, 1.0]
    const normalized = (total / maxValue + 1.0) / 2.0;
    return Math.min(Math.max(normalized, 0.0), 1.0);
  }
}
