/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

export type {
  CustomPaletteArguments,
  CustomPaletteState,
  SystemPaletteArguments,
  SystemPaletteExpressionFunctionDefinition,
} from './expressions/palette';
export { palette, systemPalette } from './expressions/palette';

export {
  paletteIds,
  defaultCustomColors,
  BRAND_PALETTE_SETTING,
  BRAND_HUES_SETTING,
  BRAND_GENERATOR_SETTING,
  BRAND_LOGO_SETTING,
  BRAND_BAND_RANGE,
  DEFAULT_BRAND_GENERATOR,
  MAX_BRAND_COLORS,
  MAX_BRAND_HUES,
  MAX_BRAND_LOGO_SIZE_IN_KB,
  MAX_BRAND_SHUFFLE,
  type BrandGeneratorOptions,
} from './constants';
export type {
  AllowedChartOverrides,
  AllowedSettingsOverrides,
  ColorSchema,
  RawColorSchema,
  ColorMap,
} from './static';
export {
  ColorSchemas,
  vislibColorMaps,
  colorSchemas,
  getHeatmapColors,
  ColorMode,
  LabelRotation,
  defaultCountLabel,
} from './static';

export type { ColorSchemaParams, Labels, Style } from './types';
