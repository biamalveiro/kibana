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

/** Faint per hue, for fills behind text such as table cells. Contrast roles only. */
export const getElasticFaintPalette = withContrastRoles(
  {
    id: KbnPalette.ElasticFaint,
    type: 'categorical',
    name: i18n.translate('palettes.elasticFaint.name', {
      defaultMessage: 'Elastic (faint)',
    }),
    colorCount: CATEGORICAL_COUNTS.faint,
  },
  ({ elasticFaint }) => elasticFaint
);
