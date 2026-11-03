/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// Find the lightness where a hue reaches a contrast target, as apcach does: keep the hue, let chroma follow its rule,
// and bisect lightness from the background toward the far end until |Lc| hits the target.
import { apcaLc, oklchToHex } from './color';
import type { Hex } from './types';

// Solved lightness stays a little off pure black and white, where a color loses its hue.
const L_MIN = 0.03;
const L_MAX = 0.985;
export const clampL = (L: number) => Math.min(L_MAX, Math.max(L_MIN, L));

const ITERATIONS = 30; // halves the interval to ~1e-9 of the background-to-end distance
const CACHE_LIMIT = 20000;

export interface LightnessQuery {
  angle: number; // hue
  hueAt?: (L: number) => number; // the hue at each candidate lightness, when it turns with lightness
  target: number; // |Lc| to reach
  against: Hex; // what contrast is measured against
  from: number; // lightness to start at (the background's)
  to: number; // lightness to move toward (the far end)
  chromaAt: (L: number) => number; // the color's chroma at each candidate lightness
  key: string; // identifies chromaAt for the cache
}

// A solver with its own cache. Contrast grows monotonically from `from` to `to`, so bisection is enough.
export function createSolver() {
  const cache = new Map<string, number>();
  return function solveLightness({
    angle,
    hueAt,
    target,
    against,
    from,
    to,
    chromaAt,
    key,
  }: LightnessQuery): number {
    const k = [angle, target, against, from, to, key].join('|');
    const hit = cache.get(k);
    if (hit !== undefined) return hit;
    const at = (t: number) => clampL(from + (to - from) * t);
    const lcAt = (L: number) =>
      Math.abs(apcaLc(oklchToHex(L, chromaAt(L), hueAt?.(L) ?? angle), against));
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < ITERATIONS; i++) {
      const mid = (lo + hi) / 2;
      if (lcAt(at(mid)) < target) lo = mid;
      else hi = mid;
    }
    const L = at((lo + hi) / 2);
    if (cache.size > CACHE_LIMIT) cache.clear();
    cache.set(k, L);
    return L;
  };
}
