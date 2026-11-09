/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import { CATEGORICAL_COUNTS } from '@kbn/contrast-roles';
import { KbnPalette } from '../../constants';
import { withContrastRoles } from '../contrast_roles';

/** Low contrast on the brand hues. */
export const getBrandLowContrastPalette = withContrastRoles(
  {
    id: KbnPalette.BrandLowContrast,
    type: 'categorical',
    name: i18n.translate('palettes.brandLowContrast.name', {
      defaultMessage: 'Brand low contrast',
    }),
    colorCount: CATEGORICAL_COUNTS.stacks,
  },
  ({ brandLowContrast }) => brandLowContrast
);

/** High contrast on the brand hues. */
export const getBrandHighContrastPalette = withContrastRoles(
  {
    id: KbnPalette.BrandHighContrast,
    type: 'categorical',
    name: i18n.translate('palettes.brandHighContrast.name', {
      defaultMessage: 'Brand high contrast',
    }),
    colorCount: CATEGORICAL_COUNTS.stacks,
  },
  ({ brandHighContrast }) => brandHighContrast
);

/** Faint on the brand hues, for fills behind text such as table cells. */
export const getBrandFaintPalette = withContrastRoles(
  {
    id: KbnPalette.BrandFaint,
    type: 'categorical',
    name: i18n.translate('palettes.brandFaint.name', {
      defaultMessage: 'Brand (faint)',
    }),
    colorCount: CATEGORICAL_COUNTS.faint,
  },
  ({ brandFaint }) => brandFaint
);
