/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import { themeAware, type Mode } from '@kbn/contrast-roles';
import { KbnColorFnPalette } from '../../classes/color_fn_palette';
import { KbnPalette } from '../../constants';

const build = (mode: Mode) =>
  new KbnColorFnPalette({
    id: KbnPalette.ElasticFaint,
    type: 'categorical',
    aliases: [],
    name: i18n.translate('palettes.elasticFaint.name', {
      defaultMessage: 'Elastic (faint)',
    }),
    colorCount: () => themeAware(mode).counts.elasticFaint,
    colorFn: (n) => themeAware(mode).elasticFaint(n),
  });

const lightElasticFaintPalette = build('light');
const darkElasticFaintPalette = build('dark');

/** Faint per hue, for fills behind text such as table cells and metric backgrounds. Contrast roles only. */
export const getElasticFaintPalette = (darkMode: boolean) =>
  darkMode ? darkElasticFaintPalette : lightElasticFaintPalette;
