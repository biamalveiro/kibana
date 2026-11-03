/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { borealis, SURFACES, type Mode } from './borealis';
import { contrastRolesStore } from './store';
import type { Hex, Palettes, Params } from './src';

export interface ThemeAwarePalettes {
  /** `default`: base and muted interleaved per hue. */
  elastic: (n: number) => Hex[];
  /** `elastic_line_optimized`: every base, then every strong. */
  elasticLineOptimized: (n: number) => Hex[];
  /** Elastic faint: faint per hue, for fills such as table cells and metric backgrounds. */
  elasticFaint: (n: number) => Hex[];
  /** `cool`: blue ramp. */
  cool: (n: number) => Hex[];
  /** `warm`: red ramp. */
  warm: (n: number) => Hex[];
  /** `negative`: red ramp. */
  red: (n: number) => Hex[];
  /** `temperature`: blue to red, with a surface-tinted middle. */
  temperature: (n: number) => Hex[];
  /** Distinct colors per categorical palette, before they repeat. */
  counts: { elastic: number; elasticLineOptimized: number; elasticFaint: number };
}

// Past their length, categorical palettes repeat.
const repeat =
  (colors: Hex[]) =>
  (n: number): Hex[] =>
    Array.from({ length: n }, (_, i) => colors[i % colors.length]);

const cache = new Map<Mode, { params: Params; palettes: Palettes }>();

const palettesFor = (mode: Mode, params: Params): Palettes => {
  const hit = cache.get(mode);
  if (hit?.params === params) return hit.palettes;
  const palettes = borealis.palettes(SURFACES[mode], params);
  cache.set(mode, { params, palettes });
  return palettes;
};

/** Contrast roles palettes on the given mode's surface, from the store's current parameters. */
export const themeAware = (mode: Mode): ThemeAwarePalettes => {
  const { roles, intertwined, lines, sequential, diverging } = palettesFor(
    mode,
    contrastRolesStore.get().params
  );
  return {
    elastic: repeat(intertwined),
    elasticLineOptimized: repeat(lines),
    elasticFaint: repeat(roles.map(({ faint }) => faint)),
    cool: (n) => sequential('blue', n),
    warm: (n) => sequential('red', n),
    red: (n) => sequential('red', n),
    temperature: (n) => diverging('blue', 'red', n),
    counts: {
      elastic: intertwined.length,
      elasticLineOptimized: lines.length,
      elasticFaint: roles.length,
    },
  };
};
