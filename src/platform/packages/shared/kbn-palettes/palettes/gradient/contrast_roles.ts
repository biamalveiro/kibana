/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import { KbnPalette } from '../../constants';
import { withContrastRoles } from '../contrast_roles';

export const getThemeAwareCoolPalette = withContrastRoles(
  {
    id: KbnPalette.ThemeAwareCool,
    type: 'gradient',
    name: i18n.translate('palettes.themeAwareCool.name', {
      defaultMessage: 'Cool (theme aware)',
    }),
  },
  ({ cool }) => cool
);

export const getThemeAwareWarmPalette = withContrastRoles(
  {
    id: KbnPalette.ThemeAwareWarm,
    type: 'gradient',
    name: i18n.translate('palettes.themeAwareWarm.name', {
      defaultMessage: 'Warm (theme aware)',
    }),
  },
  ({ warm }) => warm
);

export const getThemeAwareRedPalette = withContrastRoles(
  {
    id: KbnPalette.ThemeAwareRed,
    type: 'gradient',
    name: i18n.translate('palettes.themeAwareRed.name', {
      defaultMessage: 'Negative (theme aware)',
    }),
  },
  ({ red }) => red
);

export const getThemeAwareGreenPalette = withContrastRoles(
  {
    id: KbnPalette.ThemeAwareGreen,
    type: 'gradient',
    name: i18n.translate('palettes.themeAwareGreen.name', {
      defaultMessage: 'Positive (theme aware)',
    }),
  },
  ({ positive }) => positive
);

export const getThemeAwareTemperaturePalette = withContrastRoles(
  {
    id: KbnPalette.ThemeAwareTemperature,
    type: 'gradient',
    name: i18n.translate('palettes.themeAwareTemperature.name', {
      defaultMessage: 'Temperature (theme aware)',
    }),
  },
  ({ temperature }) => temperature
);

export const getThemeAwareComplementaryPalette = withContrastRoles(
  {
    id: KbnPalette.ThemeAwareComplementary,
    type: 'gradient',
    name: i18n.translate('palettes.themeAwareComplementary.name', {
      defaultMessage: 'Complementary (theme aware)',
    }),
  },
  ({ complementary }) => complementary
);
