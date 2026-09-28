/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { euiPaletteColorBlind } from '@elastic/eui';
import { paletteSize } from './elastic';
import { swapColorPairs, reorderDarkFirst } from './elastic_line_optimized';

const BASE = euiPaletteColorBlind({ rotations: 1 });

describe('swapColorPairs', () => {
  it('swaps red (index 6) with yellow (index 8) and their light variants', () => {
    const result = swapColorPairs(BASE);
    expect(result[6]).toBe(BASE[8]); // yellow dark moved to red position
    expect(result[8]).toBe(BASE[6]); // red dark moved to yellow position
    expect(result[7]).toBe(BASE[9]); // yellow light moved to red-light position
    expect(result[9]).toBe(BASE[7]); // red light moved to yellow-light position
  });

  it('leaves non-swapped indices unchanged', () => {
    const result = swapColorPairs(BASE);
    expect(result.slice(0, 6)).toEqual(BASE.slice(0, 6));
    // purple pair follows the swapped red/yellow indices
    expect(result.slice(10, paletteSize)).toEqual(BASE.slice(10, paletteSize));
  });

  it('applies swaps per group in multi-rotation palettes', () => {
    const base = euiPaletteColorBlind({ rotations: 2 });
    const result = swapColorPairs(base);
    expect(result[6]).toBe(base[8]);
    expect(result[paletteSize + 6]).toBe(base[paletteSize + 8]);
  });
});

describe('reorderDarkFirst', () => {
  it('places dark tones (even indices) before light tones (odd indices) within each group of 10', () => {
    const result = reorderDarkFirst(BASE);
    const firstGroup = BASE.slice(0, 10);
    const remainder = BASE.slice(10);
    expect(result).toEqual([
      ...firstGroup.filter((_, i) => i % 2 === 0),
      ...firstGroup.filter((_, i) => i % 2 !== 0),
      ...remainder.filter((_, i) => i % 2 === 0),
      ...remainder.filter((_, i) => i % 2 !== 0),
    ]);
  });

  it('preserves relative order within dark and light groups', () => {
    const result = reorderDarkFirst(BASE);
    expect(result[0]).toBe(BASE[0]); // first dark
    expect(result[4]).toBe(BASE[8]); // last dark of the first group of 10
    expect(result[5]).toBe(BASE[1]); // first light
    expect(result[9]).toBe(BASE[9]); // last light of the first group of 10
  });
});
