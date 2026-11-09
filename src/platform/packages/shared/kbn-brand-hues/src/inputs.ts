/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { argbFromRgb, hexFromArgb, QuantizerCelebi } from '@material/material-color-utilities';
import { formatHex, parse } from 'culori';
import { hexToOklch, hexToRgb255, type Hex } from '@kbn/contrast-roles';

export const HUE_COUNT = 6;

// Inputs: brand hexes as OKLCH hues (greys are ignored), or seeds from a logo: quantize, drop edge blends and greys,
// merge by hue, rank by share and chroma.

export interface Seed {
  hex: Hex;
  angle: number;
}
export interface Ignored {
  input: string;
  reason: string;
}

const SEED_ACHROMATIC = 0.03; // OKLCH chroma

const hueGap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

// Main color first.
export function readSeeds(inputs: string[]): { seeds: Seed[]; ignored: Ignored[] } {
  const seeds: Seed[] = [];
  const ignored: Ignored[] = [];
  for (const input of inputs) {
    const c = parse(input.startsWith('#') ? input : `#${input}`);
    if (!c) {
      ignored.push({ input, reason: 'not a hex color' });
      continue;
    }
    const hex = formatHex(c).toUpperCase();
    const { C, h } = hexToOklch(hex);
    if (C < SEED_ACHROMATIC) ignored.push({ input: hex, reason: 'grey: no hue' });
    else seeds.push({ hex, angle: h });
  }
  return { seeds, ignored };
}

const CLUSTERS = 32;
const IMAGE_ACHROMATIC = 0.04; // above SEED_ACHROMATIC: antialiased text picks up a tint
const SAME_HUE = 15;
const MIN_SHARE = 0.01;
const BLEND = 0.05; // sRGB distance from the line between two bigger clusters

export interface Extracted {
  hex: Hex;
  share: number;
}

type RGB = [number, number, number];
function toSegment(p: RGB, a: RGB, b: RGB) {
  const ab = a.map((v, i) => b[i] - v);
  const len = ab.reduce((n, v) => n + v * v, 0);
  const t = len
    ? Math.max(0, Math.min(1, ab.reduce((n, v, i) => n + v * (p[i] - a[i]), 0) / len))
    : 0;
  return { t, d: Math.hypot(...p.map((v, i) => v - (a[i] + t * ab[i]))) };
}

// rgba: ImageData.data.
// fallback: the seed to return when the image has no colored areas (Material's Score falls back to a blue the same way).
export function extractSeeds(rgba: ArrayLike<number>, max = 4, fallback?: Hex): Extracted[] {
  const pixels: number[] = [];
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] >= 128) pixels.push(argbFromRgb(rgba[i], rgba[i + 1], rgba[i + 2]));
  }
  const all = [...QuantizerCelebi.quantize(pixels, CLUSTERS)]
    .map(([argb, count]) => {
      const hex = hexFromArgb(argb).toUpperCase();
      return { hex, count, rgb: hexToRgb255(hex).map((v) => v / 255) as RGB, ...hexToOklch(hex) };
    })
    .sort((a, b) => b.count - a.count);
  const blend = (c: (typeof all)[number], i: number) =>
    all.slice(0, i).some((a, j) =>
      all.slice(j + 1, i).some((b) => {
        const { t, d } = toSegment(c.rgb, a.rgb, b.rgb);
        return t > 0 && t < 1 && d < BLEND;
      })
    );
  const clusters = all.filter((c, i) => !blend(c, i) && c.C >= IMAGE_ACHROMATIC);
  const colored = clusters.reduce((n, c) => n + c.count, 0);

  const hues: (typeof clusters)[number][] = [];
  for (const c of clusters) {
    const same = hues.find((h) => hueGap(h.h, c.h) < SAME_HUE);
    if (same) same.count += c.count;
    else hues.push({ ...c });
  }
  const seeds = hues
    .filter((h) => h.count / colored >= MIN_SHARE)
    .sort((a, b) => b.count * b.C - a.count * a.C)
    .slice(0, max)
    .map((h) => ({ hex: h.hex, share: h.count / colored }));
  return seeds.length || !fallback ? seeds : [{ hex: fallback, share: 0 }];
}
