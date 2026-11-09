/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { KbnPaletteId } from '@kbn/palettes';

type SystemPaletteId = KbnPaletteId | 'kibana_palette' | 'custom' | 'negative' | 'positive';

export const BRAND_PALETTE_SETTING = 'visualization:brandPalette';
export const BRAND_HUES_SETTING = 'visualization:brandHues';
export const BRAND_GENERATOR_SETTING = 'visualization:brandGenerator';
export const BRAND_LOGO_SETTING = 'visualization:brandLogo';
// Brand hue generation keeps at most six seeds, and makes six hues.
export const MAX_BRAND_COLORS = 6;
export const MAX_BRAND_HUES = 6;
export const MAX_BRAND_LOGO_SIZE_IN_KB = 200;

/** How the brand hues are generated from the brand colors. */
export interface BrandGeneratorOptions {
  /** Min |Lc| of each hue's base on both the light and dark surfaces. */
  band: number;
  /** 0 for the best fills; any other value picks at random among the near-best fills. */
  shuffle: number;
}

// The default band must match BAND_LC in @kbn/brand-hues, which the charts plugin loads only on demand.
export const DEFAULT_BRAND_GENERATOR: BrandGeneratorOptions = { band: 38, shuffle: 0 };
export const BRAND_BAND_RANGE = { min: 20, max: 50 } as const;
export const MAX_BRAND_SHUFFLE = 99999;

// Currently supported palettes. This list might be extended dynamically in a later release
export const paletteIds: SystemPaletteId[] = [
  'default',
  'elastic_line_optimized',
  'kibana_palette',
  'custom',
  'status',
  'temperature',
  'complementary',
  'negative',
  'positive',
  'cool',
  'warm',
  'gray',
];

// This set of defaults originated in Canvas, which, at present, is the primary
// consumer of this function.  Changing this default requires a change in Canvas
// logic, which would likely be a breaking change in 7.x.
export const defaultCustomColors = [
  '#882E72',
  '#B178A6',
  '#D6C1DE',
  '#1965B0',
  '#5289C7',
  '#7BAFDE',
  '#4EB265',
  '#90C987',
  '#CAE0AB',
  '#F7EE55',
  '#F6C141',
  '#F1932D',
  '#E8601C',
  '#DC050C',
];
