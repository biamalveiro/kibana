/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import { euiPaletteColorBlind } from '@elastic/eui';
import { contrastRolesStore, themeAware, type Mode } from '@kbn/contrast-roles';
import { KbnPalette } from '../../constants';
import { KbnColorFnPalette, type KbnColorFnPaletteConfig } from '../../classes/color_fn_palette';

/**
 * Index pairs to swap within each group of 10 palette colors.
 * Moves red tones away from pink for better adjacent-color contrast.
 */
const COLOR_SWAP_PAIRS: Array<[number, number]> = [
  [6, 8], // red <-> yellow (dark tones)
  [7, 9], // light-red <-> light-yellow
];

/**
 * Swaps color pairs within each group of 10 to increase contrast
 * between adjacent hues (e.g., separating pink and red).
 */
export function swapColorPairs(colors: string[]): string[] {
  const result = [...colors];
  for (let groupStart = 0; groupStart < result.length; groupStart += 10) {
    if (groupStart + 9 < result.length) {
      for (const [a, b] of COLOR_SWAP_PAIRS) {
        [result[groupStart + a], result[groupStart + b]] = [
          result[groupStart + b],
          result[groupStart + a],
        ];
      }
    }
  }
  return result;
}

/**
 * Reorders colors so dark tones (even indices) come before light tones (odd indices)
 * within each group of 10 colors.
 */
export function reorderDarkFirst(colors: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < colors.length; i += 10) {
    const group = colors.slice(i, i + 10);
    const dark = group.filter((_, idx) => idx % 2 === 0);
    const light = group.filter((_, idx) => idx % 2 !== 0);
    result.push(...dark, ...light);
  }
  return result;
}

const EUI_COLOR_COUNT = 10;

const commonProps = {
  id: KbnPalette.ElasticLineOptimized,
  type: 'categorical',
  aliases: [],
  defaultNumberOfColors: 30,
  name: i18n.translate('palettes.elasticLineOptimized.name', {
    defaultMessage: 'Elastic (line optimized)',
  }),
} satisfies Omit<KbnColorFnPaletteConfig, 'colorFn'>;

const euiColors = (n: number) => {
  const base = reorderDarkFirst(swapColorPairs(euiPaletteColorBlind()));
  // Repeat the base 10 colors without lightening on each rotation. In lines, lighter tones contrast is too low
  // + differences between rotations are hard to perceive.
  return Array.from({ length: n }, (_, i) => base[i % base.length]);
};

export const elasticLineOptimizedPalette = new KbnColorFnPalette({
  ...commonProps,
  colorCount: EUI_COLOR_COUNT,
  colorFn: euiColors,
});

const withContrastRoles = (mode: Mode) => {
  const isOn = () => contrastRolesStore.get().enabled;
  return new KbnColorFnPalette({
    ...commonProps,
    // When on, the defaults stop at the palette's length: past it the colors repeat.
    colorCount: () => (isOn() ? themeAware(mode).counts.elasticLineOptimized : EUI_COLOR_COUNT),
    defaultNumberOfColors: () =>
      isOn() ? themeAware(mode).counts.elasticLineOptimized : commonProps.defaultNumberOfColors,
    colorFn: (n) => (isOn() ? themeAware(mode).elasticLineOptimized(n) : euiColors(n)),
  });
};

const lightElasticLineOptimizedPalette = withContrastRoles('light');
const darkElasticLineOptimizedPalette = withContrastRoles('dark');

/** The line optimized palette for a mode: contrast roles colors when the switch is on, EUI's otherwise. */
export const getElasticLineOptimizedPalette = (darkMode: boolean) =>
  darkMode ? darkElasticLineOptimizedPalette : lightElasticLineOptimizedPalette;
