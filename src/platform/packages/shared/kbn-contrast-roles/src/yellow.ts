/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// Yellow corrections. Yellow darker than base reads as brown or olive (c3 color naming), so:
// 1. colors darker than base turn toward orange;
// 2. on a dark surface, the stack pair is a lighter yellow, then base;
// 3. on a dark surface, base is less colorful (as a large "Other" it dominated).
import type { Params } from './types';

// OKLCH hues that count as yellow.
const BAND = [60, 105];
export const isYellow = (angle: number) => angle >= BAND[0] && angle <= BAND[1];

// Degrees toward orange, reached this far (OKLab L) below base.
const DARK_TURN = 15;
const TURN_FADE = 0.1;

export function yellowHueAt(angle: number, L: number, Lb: number) {
  if (!isYellow(angle) || L >= Lb) return angle;
  return angle - DARK_TURN * Math.min(1, (Lb - L) / TURN_FADE);
}

// Base's chroma on a dark surface, as a share of its own. Every dark yellow role follows, as they cap at base's.
const DARK_BASE_CHROMA = 0.8;
export const yellowBaseChroma = (angle: number, surfaceL: number) =>
  isYellow(angle) && surfaceL < 0.5 ? DARK_BASE_CHROMA : 1;

// The lighter partner: an Lc target and a chroma as a share of base's. On Borealis: #F4CA76.
export const LIGHT_PARTNER = { lc: 67, chroma: 0.7 };

// Yellow on a dark surface, when muted sits below base.
export const leadsWithLightPartner = (angle: number, surfaceL: number, { lc }: Params) =>
  isYellow(angle) && surfaceL < 0.5 && lc.muted < lc.base;
