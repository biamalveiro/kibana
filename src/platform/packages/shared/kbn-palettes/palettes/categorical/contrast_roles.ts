/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import { CATEGORICAL_COUNTS, revised } from '@kbn/contrast-roles';
import { KbnColorFnPalette } from '../../classes/color_fn_palette';
import { KbnPalette } from '../../constants';
import { withContrastRoles } from '../contrast_roles';

/** Base and muted per hue, light mode's colors in both modes. */
export const revisedPalette = new KbnColorFnPalette({
  id: KbnPalette.Revised,
  type: 'categorical',
  name: i18n.translate('palettes.revised.name', {
    defaultMessage: 'Revised',
  }),
  colorCount: CATEGORICAL_COUNTS.stacks,
  colorFn: revised,
});

/** Base and muted per hue on each mode's surface, with muted past base. */
export const getHighContrastPalette = withContrastRoles(
  {
    id: KbnPalette.HighContrast,
    type: 'categorical',
    name: i18n.translate('palettes.highContrast.name', {
      defaultMessage: 'High contrast',
    }),
    colorCount: CATEGORICAL_COUNTS.stacks,
  },
  ({ highContrast }) => highContrast
);

/** Base and muted per hue on each mode's surface. */
export const getLowContrastPalette = withContrastRoles(
  {
    id: KbnPalette.LowContrast,
    type: 'categorical',
    name: i18n.translate('palettes.lowContrast.name', {
      defaultMessage: 'Low contrast',
    }),
    colorCount: CATEGORICAL_COUNTS.stacks,
  },
  ({ lowContrast }) => lowContrast
);
