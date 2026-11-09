/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// Seeds to six base colors, one hex for both modes. Seeds move into the lightness band; the rest are filled from it
// (docs/hue-generation.md).
import { argbFromHex, DislikeAnalyzer, Hct } from '@material/material-color-utilities';
import { differenceCiede2000, type Color } from 'culori';
import seedrandom from 'seedrandom';
import {
  apcaLc,
  hexToOklch,
  maxChroma,
  oklchToHex,
  pairDifference,
  type Hex,
  type HueInput,
  type Params,
  type Theme,
} from '@kbn/contrast-roles';
import { FLOOR_VISIONS, simulate, type FloorVision } from './checks';
import { distinctNames, nameDistance, nameOf, saliency } from './naming';
import { HUE_COUNT, type Ignored, type Seed } from './inputs';

export const BAND_LC = 38; // min |Lc| on both surfaces, Borealis's dimmest
export const STEP = 3;
export const L_STEP = 0.01;
export const MARK_WIDTH = 25; // px, for pairDifference: a bar, legend swatch or area, not a thin line
const SEED_MIN = 1;
export const MIN_PAIR = 1;
export const MIN_NAME = 0.5;
export const MIN_CVD = 1; // noticeable differences at MARK_WIDTH under deutan and protan simulation
export const SPREAD_REF = 3;
export const NEAR_REF = 60;
export const SALIENCY_WEIGHT = 0.15;
export const SHUFFLE_STD = 0.75;
export const STATUS_DE = 5;

export interface BrandHue {
  name: string;
  basic: string;
  base: Hex;
  angle: number;
  seed?: Hex;
  seedDE?: number;
}

export interface BrandOptions {
  surfaces: Theme['surfaces'];
  params: Params;
  pull: number; // 0-1, how close fills stay to the seeds
  band?: number;
  status: Hex[];
  trace?: boolean;
  shuffle?: number; // random seed; 0 picks the best
}

export interface Candidate {
  base: Hex;
  angle: number;
  L: number;
  out?: 'status' | 'disliked';
}
export interface FillStep {
  w: number;
  r: number; // relaxation of the pair and name floors, 1 = none
  rD: number; // deutan floor
  rP: number; // protan floor, relaxed first
  scored: {
    base: Hex;
    pair: number;
    name: number;
    deutan: number;
    protan: number;
    near: number;
    saliency: number;
    score: number;
    pass: boolean;
  }[];
  taken: Hex[];
  pick: Hex;
}
export interface BrandTrace {
  candidates: Candidate[];
  steps: FillStep[];
}
// Two seeds under the colorblind floor: seeds are kept as given, so the fill can't fix it.
export interface SeedWarning {
  seeds: [Hex, Hex];
  vision: FloorVision;
  value: number;
}

const dE = differenceCiede2000();

const best = <T>(xs: T[], score: (x: T) => number) =>
  xs.reduce((a, b) => (score(b) > score(a) ? b : a));
function pickNearBest<T extends { c: { name: string } }>(
  xs: T[],
  score: (x: T) => number,
  random: () => number
) {
  const s = xs.map(score);
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  const sd = Math.sqrt(s.reduce((a, b) => a + (b - mean) ** 2, 0) / s.length);
  const floor = Math.max(...s) - SHUFFLE_STD * sd;
  const byName = new Map<string, T>();
  for (const x of xs) {
    if (score(x) < floor) continue;
    const held = byName.get(x.c.name);
    if (!held || score(x) > score(held)) byName.set(x.c.name, x);
  }
  const options = [...byName.values()].sort((a, b) => score(b) - score(a));
  return options[Math.floor(random() * options.length)];
}

export function generateHues(
  seeds: Seed[],
  { surfaces, params, pull, band = BAND_LC, status, trace, shuffle = 0 }: BrandOptions
): { hues: BrandHue[]; ignored: Ignored[]; warnings: SeedWarning[]; trace?: BrandTrace } {
  const seen: BrandTrace | undefined = trace ? { candidates: [], steps: [] } : undefined;
  const random = seedrandom(String(shuffle));
  const inBand = (hex: Hex) =>
    [surfaces.light, surfaces.dark].every((s) => Math.abs(apcaLc(hex, s)) >= band);

  const worst = (hex: Hex) =>
    Math.min(...[surfaces.light, surfaces.dark].map((s) => Math.abs(apcaLc(hex, s))));
  const place = (hex: Hex): Hex => {
    const { L, C: seedC, h } = hexToOklch(hex);
    const C = Math.min(seedC, params.chroma.ceiling);
    const capped = C < seedC ? oklchToHex(L, Math.min(C, maxChroma(L, h)), h) : hex;
    if (inBand(capped)) return capped;
    const options = Array.from({ length: 111 }, (_, i) => 0.4 + i * 0.005).map((l) => ({
      l,
      hex: oklchToHex(l, Math.min(C, maxChroma(l, h)), h),
    }));
    const fit = options.filter((o) => inBand(o.hex));
    if (!fit.length) return options.reduce((a, b) => (worst(b.hex) > worst(a.hex) ? b : a)).hex;
    return fit.reduce((a, b) => (Math.abs(b.l - L) < Math.abs(a.l - L) ? b : a)).hex;
  };

  interface Chosen {
    base: Hex;
    angle: number;
    name: string;
    basic: string;
    seed?: Hex;
    seedDE?: number;
  }
  const chosen: Chosen[] = [];
  const ignored: Ignored[] = [];
  for (const { hex, angle } of seeds) {
    const base = place(hex);
    const twin = chosen.find((h) => pairDifference(base, h.base, MARK_WIDTH) < SEED_MIN);
    if (twin) {
      const x = pairDifference(base, twin.base, MARK_WIDTH).toFixed(1);
      ignored.push({
        input: hex,
        reason: `looks like ${twin.seed} at base (${x}x the noticeable difference)`,
      });
    } else if (chosen.length === HUE_COUNT)
      ignored.push({ input: hex, reason: `more than ${HUE_COUNT} hues` });
    else chosen.push({ base, angle, ...nameOf(base), seed: hex, seedDE: dE(hex, base) });
  }
  const seedBases = chosen.map((h) => h.base);
  const warnings: SeedWarning[] = [];
  const seedSims = seedBases.map(simulate);
  for (let i = 0; i < chosen.length; i++)
    for (let j = i + 1; j < chosen.length; j++)
      for (const vision of FLOOR_VISIONS) {
        const value = pairDifference(seedSims[i][vision], seedSims[j][vision], MARK_WIDTH);
        if (value < MIN_CVD)
          warnings.push({ seeds: [chosen[i].seed!, chosen[j].seed!], vision, value });
      }

  const candidates: (Chosen & { saliency: number; L: number; sim: Record<FloorVision, Color> })[] =
    [];
  for (let angle = 0; angle < 360; angle += STEP) {
    for (let L = 0.45; L <= 0.95; L += L_STEP) {
      const base = oklchToHex(L, Math.min(maxChroma(L, angle), params.chroma.ceiling), angle);
      if (!inBand(base)) continue;
      const out = status.some((s) => dE(base, s) < STATUS_DE)
        ? 'status'
        : DislikeAnalyzer.isDisliked(Hct.fromInt(argbFromHex(base)))
        ? 'disliked'
        : undefined;
      seen?.candidates.push({ base, angle, L, out });
      if (out) continue;
      candidates.push({
        base,
        angle,
        ...nameOf(base),
        saliency: saliency(base),
        L,
        sim: simulate(base),
      });
    }
  }

  const fills = HUE_COUNT - chosen.length;
  for (let i = 0; i < fills; i++) {
    const w = pull * (1 - i / fills);
    const used = new Set(chosen.map((c) => c.name));
    const open = candidates.filter((c) => !used.has(c.name));
    const pool = open.length ? open : candidates;
    const chosenSim = chosen.map((h) => simulate(h.base));
    const scored = pool.map((c) => ({
      c,
      pair: Math.min(...chosen.map((h) => pairDifference(c.base, h.base, MARK_WIDTH))),
      name: Math.min(...chosen.map((h) => nameDistance(c.base, h.base))),
      deutan: Math.min(...chosenSim.map((h) => pairDifference(c.sim.deutan, h.deutan, MARK_WIDTH))),
      protan: Math.min(...chosenSim.map((h) => pairDifference(c.sim.protan, h.protan, MARK_WIDTH))),
      near: 1 - Math.min(1, Math.min(...seedBases.map((s) => dE(c.base, s))) / NEAR_REF),
    }));
    let pass: typeof scored = [];
    // Protan relaxes first, then deutan, then pair and name, each in 20% steps down to none.
    let [r, rD, rP] = [1, 1, 1];
    for (let k = 0; !pass.length; k++) {
      [r, rD, rP] = [
        1 - 0.2 * Math.floor(k / 36),
        1 - 0.2 * (Math.floor(k / 6) % 6),
        1 - 0.2 * (k % 6),
      ];
      pass = scored.filter(
        (s) =>
          s.pair >= MIN_PAIR * r &&
          s.name >= MIN_NAME * r &&
          s.deutan >= MIN_CVD * rD &&
          s.protan >= MIN_CVD * rP
      );
    }
    const score = (s: (typeof scored)[number]) =>
      w * s.near + (1 - w) * Math.min(1, s.pair / SPREAD_REF) + SALIENCY_WEIGHT * s.c.saliency;
    const { base, angle, name, basic } = (
      shuffle ? pickNearBest(pass, score, random) : best(pass, score)
    ).c;
    chosen.push({ base, angle, name, basic });
    if (seen) {
      const passing = new Set(pass);
      seen.steps.push({
        w,
        r,
        rD,
        rP,
        scored: scored.map((s) => ({
          base: s.c.base,
          pair: s.pair,
          name: s.name,
          deutan: s.deutan,
          protan: s.protan,
          near: s.near,
          saliency: s.c.saliency,
          score: score(s),
          pass: passing.has(s),
        })),
        taken: pool === open ? candidates.filter((c) => used.has(c.name)).map((c) => c.base) : [],
        pick: base,
      });
    }
  }

  const names = distinctNames(chosen.map((h) => h.base));
  const hues = chosen.map((h, i) => ({ ...h, name: names[i], angle: hexToOklch(h.base).h }));
  return { hues, ignored, warnings, trace: seen };
}

// For base.from 'anchor'.
export const toHueInputs = (hues: BrandHue[]): HueInput[] =>
  hues.map((h) => ({ name: h.name, base: h.base }));
