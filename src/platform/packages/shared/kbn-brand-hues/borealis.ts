/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import {
  DEFAULT_PARAMS,
  STATUS_COLORS,
  SURFACES,
  type BrandHueInput,
  type Params,
} from '@kbn/contrast-roles';
import { BAND_LC, generateHues, readSeeds, type Ignored, type SeedWarning } from './src';

/** How close the filled hues stay to the seeds, from 0 to 1: the workbench's default. */
export const DEFAULT_PULL = 0.7;

export interface BrandOptions {
  params?: Params;
  pull?: number;
  band?: number;
  shuffle?: number;
}

export interface GeneratedBrand {
  hues: BrandHueInput[];
  ignored: Ignored[];
  warnings: SeedWarning[];
}

/** Six brand hues on Borealis's surfaces from brand hexes (main color first), or no hues for no usable seeds. */
export const generateBrand = (
  inputs: readonly string[],
  { params = DEFAULT_PARAMS, pull = DEFAULT_PULL, band = BAND_LC, shuffle = 0 }: BrandOptions = {}
): GeneratedBrand => {
  const { seeds, ignored: unread } = readSeeds([...inputs]);
  if (seeds.length === 0) return { hues: [], ignored: unread, warnings: [] };
  const { hues, ignored, warnings } = generateHues(seeds, {
    surfaces: SURFACES,
    params,
    pull,
    band,
    status: [...STATUS_COLORS],
    shuffle,
  });
  return {
    hues: hues.map(({ name, base }) => ({ name, base })),
    ignored: [...unread, ...ignored],
    warnings,
  };
};
