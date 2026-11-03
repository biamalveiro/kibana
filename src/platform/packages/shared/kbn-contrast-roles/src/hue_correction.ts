/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// Each hue keeps its character: base sits where the hue looks like itself (EUI's /60), not exactly at the base target.
// The gap, Δ = L(base) − L(at the base target), is the hue's correction. The other roles get a share of it.
//
// EUI's /60s were tuned by eye: teal and yellow, whose cusps sit high, are well lighter than Lc 50; the others sit on
// it or just below. Color naming explains it best (yellow and teal read as themselves only when light; a dark yellow
// reads as brown); an H–K model alone fits worse.
import { shell } from './color';
import type { Params } from './types';

// The modelled correction at full strength, for hues without an anchor. One-sided: only hues whose cusp sits high are
// lifted. It doesn't depend on which other hues are in the palette.
export const cuspOffset = (angle: number, { base }: Params) =>
  base.cuspPull * Math.max(0, shell(angle).cuspL - base.cuspRef);

// How much of the correction a color at uncorrected lightness L0 gets: 1 at base (Lb0), falling linearly to 0 at the
// surface (Ls) and at the far end. The linear fade is a design choice.
export function correctionShare(L0: number, Ls: number, end: number, Lb0: number) {
  const toward = (L0 - Ls) / (Lb0 - Ls);
  const away = (end - L0) / (end - Lb0);
  return Math.max(0, Math.min(1, toward, away));
}
