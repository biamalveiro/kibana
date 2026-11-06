/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { DEFAULT_STATE, contrastRolesStore, revised, themeAware } from '@kbn/contrast-roles';
import { KbnPalette } from '../constants';
import { getPalettes } from '.';
import { elasticPalette, elasticLineOptimizedPalette } from './categorical';
import { coolPalette, greenPalette, temperaturePalette } from './gradient';

describe('contrast roles palettes', () => {
  afterEach(() => contrastRolesStore.set(DEFAULT_STATE));

  it("keeps Elastic and line optimized on EUI's colors", () => {
    for (const darkMode of [false, true]) {
      const palettes = getPalettes(darkMode);
      expect(palettes.get(KbnPalette.Default)).toBe(elasticPalette);
      expect(palettes.get(KbnPalette.ElasticLineOptimized)).toBe(elasticLineOptimizedPalette);
    }
  });

  it('registers the contrast roles categorical palettes per mode', () => {
    const light = getPalettes(false);
    const dark = getPalettes(true);
    expect(light.get(KbnPalette.LowContrast).colors(12)).toEqual(
      themeAware('light').lowContrast(12)
    );
    expect(dark.get(KbnPalette.LowContrast).colors(12)).toEqual(themeAware('dark').lowContrast(12));
    expect(dark.get(KbnPalette.HighContrast).colors(12)).toEqual(
      themeAware('dark').highContrast(12)
    );
    expect(light.get(KbnPalette.ElasticFaint).colors()).toEqual(
      themeAware('light').elasticFaint(6)
    );
  });

  it("uses light mode's colors for Revised in both modes", () => {
    expect(getPalettes(true).get(KbnPalette.Revised).colors(12)).toEqual(revised(12));
    expect(getPalettes(false).get(KbnPalette.Revised).colors(12)).toEqual(revised(12));
  });

  it('stops the categorical defaults at their length', () => {
    const palette = getPalettes(false).get(KbnPalette.HighContrast);
    expect(palette.colorCount).toBe(12);
    expect(palette.colors()).toHaveLength(12);
  });

  it("keeps the original gradients on EUI's colors", () => {
    for (const darkMode of [false, true]) {
      const palettes = getPalettes(darkMode);
      expect(palettes.get(KbnPalette.Cool)).toBe(coolPalette);
      expect(palettes.get('positive')).toBe(greenPalette);
      expect(palettes.get(KbnPalette.Temperature)).toBe(temperaturePalette);
    }
  });

  it('registers the theme aware gradients per mode', () => {
    const light = getPalettes(false);
    const dark = getPalettes(true);
    expect(light.get(KbnPalette.ThemeAwareCool).colors(5)).toEqual(themeAware('light').cool(5));
    expect(dark.get(KbnPalette.ThemeAwareWarm).colors(5)).toEqual(themeAware('dark').warm(5));
    expect(dark.get(KbnPalette.ThemeAwareRed).colors(5)).toEqual(themeAware('dark').red(5));
    expect(light.get(KbnPalette.ThemeAwareGreen).colors(5)).toEqual(
      themeAware('light').positive(5)
    );
    expect(dark.get(KbnPalette.ThemeAwareTemperature).colors(5)).toEqual(
      themeAware('dark').temperature(5)
    );
    expect(dark.get(KbnPalette.ThemeAwareComplementary).colors(5)).toEqual(
      themeAware('dark').complementary(5)
    );
  });

  it('builds a new registry only when the parameters change', () => {
    const before = getPalettes(false);
    const beforeColors = before.get(KbnPalette.LowContrast).colors(12);
    expect(getPalettes(false)).toBe(before);

    contrastRolesStore.set({
      params: { ...DEFAULT_STATE.params, lc: { ...DEFAULT_STATE.params.lc, muted: 40 } },
    });
    const after = getPalettes(false);
    const afterColors = after.get(KbnPalette.LowContrast).colors(12);
    expect(after).not.toBe(before);
    expect(afterColors).toEqual(themeAware('light').lowContrast(12));
    expect(afterColors).not.toEqual(beforeColors);
  });
});
