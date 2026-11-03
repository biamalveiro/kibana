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

const EUI_COLOR_COUNT = 10;

const commonProps = {
  id: KbnPalette.Default,
  type: 'categorical',
  aliases: [
    KbnPalette.Default, // needed when switching between new and old themes
    'elastic_borealis', // placeholder - not yet used
    KbnPalette.Amsterdam, // to assign to existing default palettes
  ],
  defaultNumberOfColors: 30,
  name: i18n.translate('palettes.elastic.name', {
    defaultMessage: 'Elastic',
  }),
  tag: i18n.translate('palettes.elastic.tag', {
    defaultMessage: 'Default',
  }),
} satisfies Omit<KbnColorFnPaletteConfig, 'colorFn'>;

// Return exact colors requested given enough rotations
const euiColors = (n: number) =>
  euiPaletteColorBlind({ rotations: Math.ceil(n / EUI_COLOR_COUNT) }).slice(0, n);

/**
 * This is not correctly returning the updated vis colors from eui.
 * All gradient function work correctly.
 */
export const elasticPalette = new KbnColorFnPalette({
  ...commonProps,
  colorCount: EUI_COLOR_COUNT,
  colorFn: euiColors,
});

const withContrastRoles = (mode: Mode) => {
  const isOn = () => contrastRolesStore.get().enabled;
  return new KbnColorFnPalette({
    ...commonProps,
    // When on, the defaults stop at the palette's length: past it the colors repeat.
    colorCount: () => (isOn() ? themeAware(mode).counts.elastic : EUI_COLOR_COUNT),
    defaultNumberOfColors: () =>
      isOn() ? themeAware(mode).counts.elastic : commonProps.defaultNumberOfColors,
    colorFn: (n) => (isOn() ? themeAware(mode).elastic(n) : euiColors(n)),
  });
};

const lightElasticPalette = withContrastRoles('light');
const darkElasticPalette = withContrastRoles('dark');

/** The Elastic palette for a mode: contrast roles colors when the switch is on, EUI's otherwise. */
export const getElasticPalette = (darkMode: boolean) =>
  darkMode ? darkElasticPalette : lightElasticPalette;
