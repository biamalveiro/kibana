/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

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

  it('uses contrast roles colors per mode when on', () => {
    expect(getElasticPalette(false).colors(12)).toEqual(themeAware('light').elastic(12));
    expect(getElasticPalette(true).colors(12)).toEqual(themeAware('dark').elastic(12));
    expect(getElasticLineOptimizedPalette(true).colors(12)).toEqual(
      themeAware('dark').elasticLineOptimized(12)
    );
    expect(getElasticPalette(false).colorCount).toBe(12);
    expect(getElasticPalette(false).colors()).toHaveLength(12);
  });

  it("keeps EUI's palettes under their own IDs, whatever the switch", () => {
    for (const darkMode of [false, true]) {
      const palettes = getPalettes(darkMode);
      expect(palettes.get(KbnPalette.ElasticEui).colors(30)).toEqual(elasticPalette.colors(30));
      expect(palettes.get(KbnPalette.ElasticLineOptimizedEui).colors(30)).toEqual(
        elasticLineOptimizedPalette.colors(30)
      );
    }
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
});
