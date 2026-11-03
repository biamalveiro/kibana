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
  getElasticPalette,
  getElasticLineOptimizedPalette,
  getElasticFaintPalette,
  getNeutralPalette,
  severityPalette,
} from './categorical';
import { elasticClassicPalette, kibana4Palette, kibana7Palette } from './legacy/categorical';
import {
  compareToPalette,
  getComplementaryFaintPalette,
  getComplementaryPalette,
  getCoolFaintPalette,
  getCoolPalette,
  getGreenFaintPalette,
  getGreenPalette,
  getRedFaintPalette,
  getRedPalette,
  getStatusFaintPalette,
  getTemperatureFaintPalette,
  getTemperaturePalette,
  getWarmPalette,
  grayPalette,
  statusPalette,
} from './gradient';
export { logLevelPalette } from './semantic';

const buildKbnPalettes = (darkMode: boolean) =>
  new KbnPalettes(
    [
      getElasticPalette(darkMode),
      getElasticLineOptimizedPalette(darkMode),
      getElasticFaintPalette(darkMode),
      severityPalette,
      kibana7Palette,
      kibana4Palette,
      getNeutralPalette(darkMode),
      getComplementaryPalette(darkMode),
      getCoolPalette(darkMode),
      grayPalette,
      getGreenPalette(darkMode),
      getRedPalette(darkMode),
      statusPalette,
      getTemperaturePalette(darkMode),
      getWarmPalette(darkMode),
      elasticClassicPalette,
      compareToPalette,
      getCoolFaintPalette(darkMode),
      getRedFaintPalette(darkMode),
      getTemperatureFaintPalette(darkMode),
      getGreenFaintPalette(darkMode),
      getComplementaryFaintPalette(darkMode),
      getStatusFaintPalette(darkMode),
    ],
    getElasticPalette(darkMode)
  );

// A new registry per contrast roles state, so consumers memoized on it recompute when the switch or its parameters
// change; the palettes inside read the state when called.
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
