/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { contrastRolesStore, type ContrastRolesState } from '@kbn/contrast-roles';
import { KbnPalettes } from '../classes/palettes';
import type { IKbnPalette } from '../classes/types';
import { createBrandPalettes, getBrandColors } from './brand';
import {
  elasticPalette,
  elasticLineOptimizedPalette,
  getElasticFaintPalette,
  getHighContrastPalette,
  getLowContrastPalette,
  getNeutralPalette,
  revisedPalette,
  severityPalette,
} from './categorical';
import { elasticClassicPalette, kibana4Palette, kibana7Palette } from './legacy/categorical';
import {
  compareToPalette,
  complementaryPalette,
  coolPalette,
  getThemeAwareComplementaryPalette,
  getThemeAwareCoolPalette,
  getThemeAwareGreenPalette,
  getThemeAwareRedPalette,
  getThemeAwareTemperaturePalette,
  getThemeAwareWarmPalette,
  grayPalette,
  greenPalette,
  redPalette,
  statusPalette,
  temperaturePalette,
  warmPalette,
} from './gradient';
export { logLevelPalette } from './semantic';

const buildKbnPalettes = (
  darkMode: boolean,
  defaultPalette: IKbnPalette,
  lineOptimizedPalette: IKbnPalette
) =>
  new KbnPalettes(
    [
      defaultPalette,
      lineOptimizedPalette,
      revisedPalette,
      getHighContrastPalette(darkMode),
      getLowContrastPalette(darkMode),
      getElasticFaintPalette(darkMode),
      severityPalette,
      kibana7Palette,
      kibana4Palette,
      getNeutralPalette(darkMode),
      complementaryPalette,
      coolPalette,
      grayPalette,
      greenPalette,
      redPalette,
      statusPalette,
      temperaturePalette,
      warmPalette,
      getThemeAwareComplementaryPalette(darkMode),
      getThemeAwareCoolPalette(darkMode),
      getThemeAwareGreenPalette(darkMode),
      getThemeAwareRedPalette(darkMode),
      getThemeAwareTemperaturePalette(darkMode),
      getThemeAwareWarmPalette(darkMode),
      elasticClassicPalette,
      compareToPalette,
    ],
    defaultPalette
  );

const buildRegistries = (brandColors: readonly string[] | undefined) => {
  if (!brandColors) {
    return {
      light: buildKbnPalettes(false, elasticPalette, elasticLineOptimizedPalette),
      dark: buildKbnPalettes(true, elasticPalette, elasticLineOptimizedPalette),
    };
  }
  const { brandPalette, brandLineOptimizedPalette } = createBrandPalettes(brandColors, {
    defaultPalette: elasticPalette,
    lineOptimizedPalette: elasticLineOptimizedPalette,
  });
  return {
    light: buildKbnPalettes(false, brandPalette, brandLineOptimizedPalette),
    dark: buildKbnPalettes(true, brandPalette, brandLineOptimizedPalette),
  };
};

// A new registry per contrast roles state and brand colors, so consumers memoized on it recompute when either
// changes; the contrast roles palettes inside read the state when called.
let cached:
  | { state: ContrastRolesState; brandKey: string; light: KbnPalettes; dark: KbnPalettes }
  | undefined;

export const getPalettes = (darkMode: boolean): KbnPalettes => {
  const state = contrastRolesStore.get();
  const brandColors = getBrandColors();
  const brandKey = brandColors?.join(',') ?? '';
  if (cached?.state !== state || cached.brandKey !== brandKey) {
    cached = { state, brandKey, ...buildRegistries(brandColors) };
  }
  return darkMode ? cached.dark : cached.light;
};

export { setBrandColors, getBrandColors } from './brand';
export { elasticPalette, elasticLineOptimizedPalette } from './categorical';
export * from './get_kbn_palettes';
