import { describe, expect, it } from "vitest";
import {
  type Attempt,
  FIRST_ATTEMPT,
  MAX_PHOTO_BYTES,
  MAX_PHOTO_DIMENSION,
  attemptSize,
  fitWithin,
  nextAttempt,
} from "./resizePhoto";

describe("constants", () => {
  it("match what the backend accepts", () => {
    expect(MAX_PHOTO_DIMENSION).toBe(1200);
    expect(MAX_PHOTO_BYTES).toBe(1024 * 1024);
  });
});

describe("fitWithin", () => {
  it.each([
    ["landscape", 4000, 3000, { width: 1200, height: 900 }],
    ["portrait", 3000, 4000, { width: 900, height: 1200 }],
    ["square", 2500, 2500, { width: 1200, height: 1200 }],
    ["already small", 640, 480, { width: 640, height: 480 }],
    ["exactly 1200 wide", 1200, 800, { width: 1200, height: 800 }],
    ["exactly 1200 tall", 800, 1200, { width: 800, height: 1200 }],
    ["exactly 1200 square", 1200, 1200, { width: 1200, height: 1200 }],
  ])("%s %ix%i", (_name, width, height, expected) => {
    expect(fitWithin(width, height, 1200)).toEqual(expected);
  });

  it("rounds to whole pixels", () => {
    expect(fitWithin(4032, 3024, 1000)).toEqual({ width: 1000, height: 750 });
    expect(fitWithin(3000, 1999, 1200)).toEqual({ width: 1200, height: 800 });
  });

  it("keeps at least one pixel on each side", () => {
    expect(fitWithin(10000, 1, 1200)).toEqual({ width: 1200, height: 1 });
    expect(fitWithin(1, 10000, 1200)).toEqual({ width: 1, height: 1200 });
  });

  it("never scales up", () => {
    expect(fitWithin(1, 1, 1200)).toEqual({ width: 1, height: 1 });
  });
});

describe("attemptSize", () => {
  it("is the fitted size at scale 1", () => {
    expect(attemptSize(4000, 3000, 1)).toEqual({ width: 1200, height: 900 });
    expect(attemptSize(640, 480, 1)).toEqual({ width: 640, height: 480 });
  });

  it("shrinks the fitted size by the scale", () => {
    expect(attemptSize(4000, 3000, 0.8)).toEqual({ width: 960, height: 720 });
    expect(attemptSize(640, 480, 0.5)).toEqual({ width: 320, height: 240 });
  });

  it("keeps at least one pixel", () => {
    expect(attemptSize(4000, 3000, 0.0001)).toEqual({ width: 1, height: 1 });
  });
});

describe("nextAttempt", () => {
  const tooBig = MAX_PHOTO_BYTES + 1;

  it("starts at quality 0.85 and full size", () => {
    expect(FIRST_ATTEMPT).toEqual({ scale: 1, quality: 0.85 });
  });

  it("stops when the photo fits", () => {
    expect(nextAttempt(FIRST_ATTEMPT, 200_000)).toBeNull();
    expect(nextAttempt(FIRST_ATTEMPT, MAX_PHOTO_BYTES)).toBeNull();
    expect(nextAttempt({ scale: 0.64, quality: 0.5 }, 1)).toBeNull();
  });

  it("lowers the quality first, then shrinks, then lowers the quality again", () => {
    const sequence: Attempt[] = [FIRST_ATTEMPT];
    for (let i = 0; i < 6; i++) {
      const next = nextAttempt(sequence[sequence.length - 1], tooBig);
      expect(next).not.toBeNull();
      sequence.push(next!);
    }
    expect(sequence).toEqual([
      { scale: 1, quality: 0.85 },
      { scale: 1, quality: 0.75 },
      { scale: 1, quality: 0.65 },
      { scale: 1, quality: 0.55 },
      { scale: 1, quality: 0.5 },
      { scale: 0.8, quality: 0.85 },
      { scale: 0.8, quality: 0.75 },
    ]);
  });

  it("keeps shrinking by 0.8 each round until a size fits", () => {
    // Simulated encoder: only fits once the dimensions are at most half.
    const fakeSize = (attempt: Attempt) => (attempt.scale <= 0.5 ? 500_000 : tooBig);
    const tried: Attempt[] = [];
    let attempt: Attempt | null = FIRST_ATTEMPT;
    while (attempt) {
      tried.push(attempt);
      attempt = nextAttempt(attempt, fakeSize(attempt));
    }
    const scales = [...new Set(tried.map((a) => a.scale))];
    expect(scales.map((s) => Math.round(s * 1000) / 1000)).toEqual([1, 0.8, 0.64, 0.512, 0.41]);
    expect(tried[tried.length - 1]).toEqual({ scale: expect.closeTo(0.4096, 6), quality: 0.85 });
    expect(tried).toHaveLength(4 * 5 + 1);
  });

  it("never goes below quality 0.5", () => {
    for (const quality of [0.85, 0.75, 0.65, 0.55, 0.52, 0.5]) {
      const next = nextAttempt({ scale: 1, quality }, tooBig)!;
      expect(next.quality).toBeGreaterThanOrEqual(0.5);
    }
  });
});
