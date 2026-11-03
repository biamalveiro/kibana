/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// How colorful each role is. Every color stays in the sRGB gamut; on top of that, two rules to compare:
// - 'cap' (ours): up to the gamut at that lightness, capped by base's chroma, and tapering toward the surface and
//   toward white. Colors lighter than base fade by `taper` (against neon teal and yellow pastels), darker ones by the
//   softer `taperDark` (EUI's darks keep their chroma). Design choices.
// - 'even' (Harmonizer): each role gets one chroma for every hue, the lowest of the hues' in-gamut maxima at that
//   role. It needs the whole hue set, so it's computed in contrast_roles.ts. Base keeps its own chroma either way.
import { maxChroma } from './color';
import type { BaseColor, Params } from './types';

// 'cap': the share falls with contrast (target as a share of base's) and, above base, with lightness toward white.
export function capChroma(angle: number, L: number, target: number, base: BaseColor, p: Params) {
  const share = Math.min(1, target / p.lc.base, L > base.L ? (1 - L) / (1 - base.L) : 1);
  const exponent = L < base.L ? p.chroma.taperDark : p.chroma.taper;
  return Math.min(maxChroma(L, angle), base.C * Math.max(0, share) ** exponent);
}

// A fixed chroma, clipped to the gamut at this lightness.
export const fixedChroma = (angle: number, L: number, C: number) =>
  Math.min(maxChroma(L, angle), C);
