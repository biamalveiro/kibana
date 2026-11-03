/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import {
  euiPaletteComplementary,
  euiPaletteCool,
  euiPaletteGreen,
  euiPaletteRed,
} from '@elastic/eui';
import { DEFAULT_STATE, contrastRolesStore, themeAware } from '@kbn/contrast-roles';
import { KbnPalette } from '../../constants';
import { getPalettes } from '..';
import { elasticPalette, getElasticPalette } from './elastic';
import {
  elasticLineOptimizedPalette,
  getElasticLineOptimizedPalette,
} from './elastic_line_optimized';

describe('contrast roles switch', () => {
  afterEach(() => contrastRolesStore.set(DEFAULT_STATE));

  it('switches gradients in place', () => {
    const light = getPalettes(false);
    const dark = getPalettes(true);
    expect(light.get(KbnPalette.Cool).colors(5)).toEqual(themeAware('light').cool(5));
    expect(dark.get(KbnPalette.Temperature).colors(5)).toEqual(themeAware('dark').temperature(5));
    expect(light.get('positive').colors(5)).toEqual(themeAware('light').positive(5));
    expect(dark.get(KbnPalette.Complementary).colors(5)).toEqual(
      themeAware('dark').complementary(5)
    );

    contrastRolesStore.set({ enabled: false });
    expect(getPalettes(false).get(KbnPalette.Cool).colors(5)).toEqual(euiPaletteCool(5));
    expect(getPalettes(false).get('negative').colors(5)).toEqual(euiPaletteRed(5));
    expect(getPalettes(false).get('positive').colors(5)).toEqual(euiPaletteGreen(5));
    expect(getPalettes(false).get(KbnPalette.Complementary).colors(5)).toEqual(
      euiPaletteComplementary(5)
    );
  });

  it('keeps the faint palettes on contrast roles when off', () => {
    contrastRolesStore.set({ enabled: false });
    const palettes = getPalettes(false);
    expect(palettes.get(KbnPalette.ElasticFaint).colors()).toEqual(
      themeAware('light').elasticFaint(6)
    );
    expect(palettes.get(KbnPalette.StatusFaint).colors(3)).toEqual(
      themeAware('light').statusFaint(3)
    );
  });

  it('uses contrast roles colors per mode when on', () => {
    expect(getElasticPalette(false).colors(12)).toEqual(themeAware('light').elastic(12));
    expect(getElasticPalette(true).colors(12)).toEqual(themeAware('dark').elastic(12));
    expect(getElasticLineOptimizedPalette(true).colors(12)).toEqual(
      themeAware('dark').elasticLineOptimized(12)
    );
    expect(getElasticPalette(false).colorCount).toBe(12);
    expect(getElasticPalette(false).colors()).toHaveLength(12);
  });

  it("uses EUI's colors when off", () => {
    contrastRolesStore.set({ enabled: false });
    expect(getElasticPalette(true).colors(30)).toEqual(elasticPalette.colors(30));
    expect(getElasticLineOptimizedPalette(false).colors(30)).toEqual(
      elasticLineOptimizedPalette.colors(30)
    );
    expect(getElasticPalette(false).colorCount).toBe(10);
    expect(getElasticPalette(false).colors()).toHaveLength(30);
  });

  it('builds a new registry only when the state changes', () => {
    const before = getPalettes(false);
    const beforeColors = before.get(KbnPalette.Default).colors(12);
    expect(getPalettes(false)).toBe(before);

    contrastRolesStore.set({
      params: { ...DEFAULT_STATE.params, lc: { ...DEFAULT_STATE.params.lc, muted: 40 } },
    });
    const after = getPalettes(false);
    const afterColors = after.get(KbnPalette.Default).colors(12);
    expect(after).not.toBe(before);
    expect(afterColors).toEqual(themeAware('light').elastic(12));
    expect(afterColors).not.toEqual(beforeColors);
  });
});
