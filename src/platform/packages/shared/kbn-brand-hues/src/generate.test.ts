/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { DEFAULT_PARAMS, type Hex } from '@kbn/contrast-roles';
import { HUE_COUNT, extractSeeds, generateHues, readSeeds } from '..';

// Borealis's backgroundBasePlain and its success and danger colors, light and dark, as in the workbench.
const SURFACES = { light: '#FFFFFF', dark: '#111C2C' } as const;
const STATUS: Hex[] = ['#008A5E', '#C61E25', '#24C292', '#F6726A'];

const hexesFor = (inputs: string[], shuffle = 0) =>
  generateHues(readSeeds(inputs).seeds, {
    surfaces: SURFACES,
    params: DEFAULT_PARAMS,
    pull: 0.7,
    status: STATUS,
    shuffle,
  }).hues.map(({ name, base }) => ({ name, base }));

describe('generateHues', () => {
  it.each([[['#0B64DD', '#FEC514']], [['#E4002B']], [['#6B2D8F', '#00A499', '#F28C28']]])(
    'fills %j up to six distinctly named hues',
    (inputs) => {
      const hues = hexesFor(inputs);
      expect(hues).toHaveLength(HUE_COUNT);
      expect(new Set(hues.map(({ name }) => name)).size).toBe(HUE_COUNT);
    }
  );

  it('keeps the seeds first and in order', () => {
    const hues = hexesFor(['#6B2D8F', '#00A499', '#F28C28']);
    expect(hues.slice(0, 3).map(({ name }) => name)).toEqual(['purple', 'teal', 'orange']);
  });

  it('gives the same hues for the same shuffle, and other hues for another', () => {
    const first = hexesFor(['#0B64DD'], 1);
    expect(hexesFor(['#0B64DD'], 1)).toEqual(first);
    expect(first).toHaveLength(HUE_COUNT);
    expect(hexesFor(['#0B64DD'], 2)).not.toEqual(first);
  });
});

describe('readSeeds', () => {
  it('ignores greys and invalid hexes', () => {
    const { seeds, ignored } = readSeeds(['#0B64DD', '#808080', 'nope']);
    expect(seeds.map(({ hex }) => hex)).toEqual(['#0B64DD']);
    expect(ignored.map(({ reason }) => reason)).toEqual(['grey: no hue', 'not a hex color']);
  });
});

describe('extractSeeds', () => {
  const pixels = (colors: Array<[number, number, number, number]>) =>
    colors.flatMap(([r, g, b, count]) =>
      Array.from({ length: count }, () => [r, g, b, 255]).flat()
    );

  it('ranks colored areas and drops white', () => {
    const rgba = pixels([
      [255, 255, 255, 600],
      [11, 100, 221, 300],
      [254, 197, 20, 100],
    ]);
    const extracted = extractSeeds(rgba, 4);
    expect(extracted.map(({ hex }) => hex)).toEqual(['#0B64DD', '#FEC514']);
    expect(extracted.map(({ share }) => share)).toEqual([0.75, 0.25]);
  });

  it('falls back when the image has no color', () => {
    const rgba = pixels([[255, 255, 255, 100]]);
    expect(extractSeeds(rgba, 4, '#0B64DD')).toEqual([{ hex: '#0B64DD', share: 0 }]);
  });
});
