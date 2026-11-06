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

const buildKbnPalettes = (darkMode: boolean) =>
  new KbnPalettes(
    [
      elasticPalette,
      elasticLineOptimizedPalette,
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
    elasticPalette
  );

// A new registry per contrast roles state, so consumers memoized on it recompute when its parameters change; the
// palettes inside read the state when called.
let cached: { state: ContrastRolesState; light: KbnPalettes; dark: KbnPalettes } | undefined;

export const getPalettes = (darkMode: boolean): KbnPalettes => {
  const state = contrastRolesStore.get();
  if (cached?.state !== state) {
    cached = { state, light: buildKbnPalettes(false), dark: buildKbnPalettes(true) };
  }
  return darkMode ? cached.dark : cached.light;
};

export { elasticPalette, elasticLineOptimizedPalette } from './categorical';
export * from './get_kbn_palettes';
