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

// Faint gradients: fills behind text, such as metric backgrounds. Contrast roles only, whatever the switch.

export const getCoolFaintPalette = withContrastRoles(
  {
    id: KbnPalette.CoolFaint,
    type: 'gradient',
    name: i18n.translate('palettes.coolFaint.name', {
      defaultMessage: 'Cool (faint)',
    }),
  },
  ({ coolFaint }) => coolFaint
);

export const getRedFaintPalette = withContrastRoles(
  {
    id: KbnPalette.RedFaint,
    type: 'gradient',
    name: i18n.translate('palettes.redFaint.name', {
      defaultMessage: 'Negative (faint)',
    }),
  },
  ({ redFaint }) => redFaint
);

export const getTemperatureFaintPalette = withContrastRoles(
  {
    id: KbnPalette.TemperatureFaint,
    type: 'gradient',
    name: i18n.translate('palettes.temperatureFaint.name', {
      defaultMessage: 'Temperature (faint)',
    }),
  },
  ({ temperatureFaint }) => temperatureFaint
);

export const getGreenFaintPalette = withContrastRoles(
  {
    id: KbnPalette.GreenFaint,
    type: 'gradient',
    name: i18n.translate('palettes.greenFaint.name', {
      defaultMessage: 'Positive (faint)',
    }),
  },
  ({ positiveFaint }) => positiveFaint
);

export const getComplementaryFaintPalette = withContrastRoles(
  {
    id: KbnPalette.ComplementaryFaint,
    type: 'gradient',
    name: i18n.translate('palettes.complementaryFaint.name', {
      defaultMessage: 'Complementary (faint)',
    }),
  },
  ({ complementaryFaint }) => complementaryFaint
);

export const getStatusFaintPalette = withContrastRoles(
  {
    id: KbnPalette.StatusFaint,
    type: 'gradient',
    name: i18n.translate('palettes.statusFaint.name', {
      defaultMessage: 'Status (faint)',
    }),
  },
  ({ statusFaint }) => statusFaint
);
