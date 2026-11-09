/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// Hue set checks: closest neighbors by noticeable difference at a bar width (Szafir 2018), also under full protan,
// deutan and tritan simulation (Machado et al. 2009, on linear sRGB), and by name.
import {
  converter,
  filterDeficiencyDeuter,
  filterDeficiencyProt,
  filterDeficiencyTrit,
  parse,
  type Color,
} from 'culori';
import { pairDifference, type Hex } from '@kbn/contrast-roles';
import { nameDistance } from './naming';

const toLrgb = converter('lrgb');
// culori applies Machado's matrices to gamma-encoded rgb; they are meant for linear sRGB, so feed it linear values.
const linear =
  (filter: (c: Color) => Color) =>
  (c: Color): Color => {
    const { r, g, b } = toLrgb(c);
    const out = filter({ mode: 'rgb', r, g, b }) as { r: number; g: number; b: number };
    return { mode: 'lrgb', r: out.r, g: out.g, b: out.b };
  };

export type Vision = 'typical' | 'protan' | 'deutan' | 'tritan';
export const VISION: Record<Vision, (c: Color) => Color> = {
  typical: (c) => c,
  protan: linear(filterDeficiencyProt(1)),
  deutan: linear(filterDeficiencyDeuter(1)),
  tritan: linear(filterDeficiencyTrit(1)),
};
// The colorblind floors, red-green: deutan (about 6% of men) holds longest, protan (about 2%) relaxes first. Tritan
// (about 0.01%) is reported, not enforced.
export const FLOOR_VISIONS = ['deutan', 'protan'] as const;
export type FloorVision = (typeof FLOOR_VISIONS)[number];

export const simulate = (hex: Hex): Record<FloorVision, Color> => {
  const c = parse(hex)!;
  return { deutan: VISION.deutan(c), protan: VISION.protan(c) };
};

export interface Nearest {
  index: number;
  value: number;
}
export interface HueCheck {
  byVision: Record<Vision, Nearest>;
  byName: Nearest;
}

const nearest = (i: number, n: number, d: (j: number) => number): Nearest =>
  Array.from({ length: n }, (_, j) => j)
    .filter((j) => j !== i)
    .map((j) => ({ index: j, value: d(j) }))
    .reduce((a, b) => (b.value < a.value ? b : a));

// Closest pair on each measure, noticeable differences at bars `widthPx` wide.
export interface SetMetrics {
  pair: number;
  deutan: number;
  protan: number;
  tritan: number;
  name: number;
}
const pairs = <T>(xs: T[]) => xs.flatMap((a, i) => xs.slice(i + 1).map((b) => [a, b] as const));
export function setMetrics(colors: Hex[], widthPx: number): SetMetrics {
  const parsed = colors.map((c) => parse(c)!);
  const ps = pairs(colors.map((_, i) => i));
  const under = (v: Vision) =>
    Math.min(
      ...ps.map(([i, j]) => pairDifference(VISION[v](parsed[i]), VISION[v](parsed[j]), widthPx))
    );
  return {
    pair: under('typical'),
    deutan: under('deutan'),
    protan: under('protan'),
    tritan: under('tritan'),
    name: Math.min(...ps.map(([i, j]) => nameDistance(colors[i], colors[j]))),
  };
}

export function checkHues(colors: Hex[], widthPx: number): HueCheck[] {
  const parsed = colors.map((c) => parse(c)!);
  const seen = Object.fromEntries(
    Object.entries(VISION).map(([k, f]) => [k, parsed.map((c) => f(c))])
  ) as Record<Vision, Color[]>;
  return colors.map((c, i) => ({
    byVision: Object.fromEntries(
      (Object.keys(VISION) as Vision[]).map((v) => [
        v,
        nearest(i, colors.length, (j) => pairDifference(seen[v][i], seen[v][j], widthPx)),
      ])
    ) as Record<Vision, Nearest>,
    byName: nearest(i, colors.length, (j) => nameDistance(c, colors[j])),
  }));
}
