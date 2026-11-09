/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

export {
  DEFAULT_PULL,
  generateBrand,
  type BrandOptions as BorealisBrandOptions,
  type GeneratedBrand,
} from './borealis';
export {
  BAND_LC,
  BASIC_NAMES,
  FLOOR_VISIONS,
  HUE_COUNT,
  L_STEP,
  MARK_WIDTH,
  MIN_CVD,
  MIN_NAME,
  MIN_PAIR,
  NEAR_REF,
  SALIENCY_WEIGHT,
  SHUFFLE_STD,
  SPREAD_REF,
  STATUS_DE,
  STEP,
  VISION,
  checkHues,
  distinctNames,
  extractSeeds,
  generateHues,
  nameDistance,
  nameOf,
  readSeeds,
  saliency,
  setMetrics,
  toHueInputs,
  type BrandHue,
  type BrandOptions,
  type BrandTrace,
  type Candidate,
  type Extracted,
  type FillStep,
  type HueCheck,
  type Ignored,
  type Nearest,
  type Seed,
  type SeedWarning,
  type SetMetrics,
  type Vision,
} from './src';
