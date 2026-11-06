/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { themeAware, type Mode, type ThemeAwarePalettes } from '@kbn/contrast-roles';
import { KbnColorFnPalette, type KbnColorFnPaletteConfig } from '../classes/color_fn_palette';

type ColorFn = (n: number) => string[];

/** A palette per mode with contrast roles colors on that mode's surface. */
export const withContrastRoles = (
  config: Omit<KbnColorFnPaletteConfig, 'colorFn'>,
  pick: (palettes: ThemeAwarePalettes) => ColorFn
): ((darkMode: boolean) => KbnColorFnPalette) => {
  const build = (mode: Mode) =>
    new KbnColorFnPalette({ ...config, colorFn: (n) => pick(themeAware(mode))(n) });
  const light = build('light');
  const dark = build('dark');
  return (darkMode) => (darkMode ? dark : light);
};
