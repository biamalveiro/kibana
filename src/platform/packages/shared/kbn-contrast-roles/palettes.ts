/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { borealis, borealisStatus, SURFACES, type Mode } from './borealis';
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
  /** `positive`: success green ramp. */
  positive: (n: number) => Hex[];
  /** `complementary`: blue to yellow, with a surface-tinted middle. */
  complementary: (n: number) => Hex[];
  /** Cool faint: the blue ramp from faint to muted, for fills behind text. */
  coolFaint: (n: number) => Hex[];
  /** Negative faint: the red ramp from faint to muted. */
  redFaint: (n: number) => Hex[];
  /** Temperature faint: blue to red, each arm from faint to muted. */
  temperatureFaint: (n: number) => Hex[];
  /** Positive faint: the success green ramp from faint to muted. */
  positiveFaint: (n: number) => Hex[];
  /** Complementary faint: blue to yellow, each arm from faint to muted. */
  complementaryFaint: (n: number) => Hex[];
  /** Status faint: success to warning to danger, every step at faint. */
  statusFaint: (n: number) => Hex[];
  /** Distinct colors per categorical palette, before they repeat. */
  counts: { elastic: number; elasticLineOptimized: number; elasticFaint: number };
}

// Past their length, categorical palettes repeat.
const repeat =
  (colors: Hex[]) =>
  (n: number): Hex[] =>
    Array.from({ length: n }, (_, i) => colors[i % colors.length]);

const STATUS_ANGLES = borealisStatus.hues.map(({ angle }) => angle);

// Hue angle at t along success → warning → danger, by the shorter way round between neighbors.
const statusAngle = (t: number) => {
  const position = t * (STATUS_ANGLES.length - 1);
  const i = Math.min(Math.floor(position), STATUS_ANGLES.length - 2);
  const from = STATUS_ANGLES[i];
  const delta = ((STATUS_ANGLES[i + 1] - from + 540) % 360) - 180;
  return (from + delta * (position - i) + 360) % 360;
};

interface Resolved {
  palettes: Palettes;
  status: Palettes;
  // The same palettes with ramps from faint to muted.
  faint: Palettes;
  statusFaint: Palettes;
  statusFaintSteps: (n: number) => Hex[];
}

const resolve = (mode: Mode, params: Params): Resolved => {
  const surface = SURFACES[mode];
  const faintParams = { ...params, ramp: { from: params.lc.faint, to: params.lc.muted } };
  const statusByCount = new Map<number, Hex[]>();
  return {
    palettes: borealis.palettes(surface, params),
    status: borealisStatus.palettes(surface, params),
    faint: borealis.palettes(surface, faintParams),
    statusFaint: borealisStatus.palettes(surface, faintParams),
    statusFaintSteps: (n) => {
      const hit = statusByCount.get(n);
      if (hit) return hit;
      const colors = Array.from(
        { length: n },
        (_, k) =>
          borealisStatus.contrastColor(
            statusAngle(n > 1 ? k / (n - 1) : 0),
            params.lc.faint,
            surface,
            params
          ).hex
      );
      statusByCount.set(n, colors);
      return colors;
    },
  };
};

const cache = new Map<Mode, { params: Params; resolved: Resolved }>();

const resolved = (mode: Mode, params: Params): Resolved => {
  const hit = cache.get(mode);
  if (hit?.params === params) return hit.resolved;
  const next = resolve(mode, params);
  cache.set(mode, { params, resolved: next });
  return next;
};

/** Contrast roles palettes on the given mode's surface, from the store's current parameters. */
export const themeAware = (mode: Mode): ThemeAwarePalettes => {
  const { palettes, status, faint, statusFaint, statusFaintSteps } = resolved(
    mode,
    contrastRolesStore.get().params
  );
  const { roles, intertwined, lines, sequential, diverging } = palettes;
  return {
    elastic: repeat(intertwined),
    elasticLineOptimized: repeat(lines),
    elasticFaint: repeat(roles.map(({ faint: fill }) => fill)),
    cool: (n) => sequential('blue', n),
    warm: (n) => sequential('red', n),
    red: (n) => sequential('red', n),
    temperature: (n) => diverging('blue', 'red', n),
    positive: (n) => status.sequential('success', n),
    complementary: (n) => diverging('blue', 'yellow', n),
    coolFaint: (n) => faint.sequential('blue', n),
    redFaint: (n) => faint.sequential('red', n),
    temperatureFaint: (n) => faint.diverging('blue', 'red', n),
    positiveFaint: (n) => statusFaint.sequential('success', n),
    complementaryFaint: (n) => faint.diverging('blue', 'yellow', n),
    statusFaint: statusFaintSteps,
    counts: {
      elastic: intertwined.length,
      elasticLineOptimized: lines.length,
      elasticFaint: roles.length,
    },
  };
};
