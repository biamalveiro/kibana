/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import { euiPaletteCool } from '@elastic/eui';
import { KbnPalette } from '../../constants';
import { withContrastRoles } from '../contrast_roles';

export const getCoolPalette = withContrastRoles(
  {
    id: KbnPalette.Cool,
    type: 'gradient',
    name: i18n.translate('palettes.cool.name', {
      defaultMessage: 'Cool',
    }),
  },
  ({ cool }) => cool,
  euiPaletteCool
);
