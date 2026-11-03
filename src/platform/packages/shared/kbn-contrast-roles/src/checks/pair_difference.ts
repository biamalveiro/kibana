/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// Can two adjacent marks be told apart? Size-dependent color difference from Stone, Szafir & Setlur (2014).
import { lab65 } from 'culori';
import type { Hex } from '../types';

// [A, B] per CIELAB axis, Stone et al. 2014 Table 4.
const ND = { l: [10.16, 1.5], a: [10.68, 3.08], b: [10.7, 5.74] } as const;
// The CSS reference pixel seen from 28 inches, in degrees.
const VIEWING_DISTANCE_IN = 28;
const DEG_PER_PX = (2 * Math.atan(1 / 96 / 2 / VIEWING_DISTANCE_IN) * 180) / Math.PI;

// The difference between two colors as a multiple of the noticeable difference for marks `widthPx` wide; at 1,
// a share `p` of viewers see a difference.
export function pairDifference(hexA: Hex, hexB: Hex, widthPx: number, p = 0.8): number {
  const s = widthPx * DEG_PER_PX;
  const [A, B] = [lab65(hexA)!, lab65(hexB)!];
  return Math.hypot(
    ...(['l', 'a', 'b'] as const).map((k) => (A[k] - B[k]) / (p * (ND[k][0] + ND[k][1] / s)))
  );
}
