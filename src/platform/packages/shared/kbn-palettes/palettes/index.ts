/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { KbnPalettes } from '../classes/palettes';
import {
  elasticEuiPalette,
  elasticLineOptimizedEuiPalette,
  getElasticPalette,
  getElasticLineOptimizedPalette,
  getNeutralPalette,
  severityPalette,
} from './categorical';
import { elasticClassicPalette, kibana4Palette, kibana7Palette } from './legacy/categorical';
import {
  compareToPalette,
  complementaryPalette,
  coolPalette,
  grayPalette,
  greenPalette,
  redPalette,
  statusPalette,
  temperaturePalette,
  warmPalette,
} from './gradient';
export { logLevelPalette } from './semantic';

const darkKbnPalettes = new KbnPalettes(
  [
    getElasticPalette(true),
    getElasticLineOptimizedPalette(true),
    elasticEuiPalette,
    elasticLineOptimizedEuiPalette,
    severityPalette,
    kibana7Palette,
    kibana4Palette,
    getNeutralPalette(true),
    complementaryPalette,
    coolPalette,
    grayPalette,
    greenPalette,
    redPalette,
    statusPalette,
    temperaturePalette,
    warmPalette,
    elasticClassicPalette,
    compareToPalette,
  ],
  getElasticPalette(true)
);

const lightKbnPalettes = new KbnPalettes(
  [
    getElasticPalette(false),
    getElasticLineOptimizedPalette(false),
    elasticEuiPalette,
    elasticLineOptimizedEuiPalette,
    severityPalette,
    kibana7Palette,
    kibana4Palette,
    getNeutralPalette(false),
    complementaryPalette,
    coolPalette,
    grayPalette,
    greenPalette,
    redPalette,
    statusPalette,
    temperaturePalette,
    warmPalette,
    elasticClassicPalette,
    compareToPalette,
  ],
  getElasticPalette(false)
);

export const getPalettes = (darkMode: boolean) => (darkMode ? darkKbnPalettes : lightKbnPalettes);

export { elasticPalette, elasticLineOptimizedPalette } from './categorical';
export * from './get_kbn_palettes';
