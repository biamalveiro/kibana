/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// yellow is hard. this file handles needed corrections we do. it ends up falling a bit outside the system
// Oranges through yellows (OKLCH hue). Starts above red (Borealis red is 25.6), which needs none of this.
export const isYellow = (angle: number) => angle >= 55 && angle <= 105;

// Degrees toward orange, reached this far (OKLab L) below base.
const DARK_TURN = 15;
const TURN_FADE = 0.1;

export function yellowHueAt(angle: number, L: number, Lb: number) {
  if (!isYellow(angle) || L >= Lb) return angle;
  return angle - DARK_TURN * Math.min(1, (Lb - L) / TURN_FADE);
}

export const yellowBaseChroma = (angle: number, surfaceL: number) =>
  isYellow(angle) && surfaceL < 0.5 ? 0.8 : 1;
