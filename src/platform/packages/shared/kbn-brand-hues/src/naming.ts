/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { lab65 } from 'culori';
import data from './c3/c3_data.json';

// Color naming with Heer & Stone's c3 model (2012), ported from c3.js. Data trimmed into ./c3 by scripts/trim-c3.ts.

interface Model {
  color: number[];
  terms: string[];
  T: number[];
}
const { color, terms, T: pairs } = data as unknown as Model;

const W = terms.length;
const C = color.length / 3;
// Sparse [color * W + term, count, ...].
const T = new Float64Array(C * W);
for (let i = 0; i < pairs.length; i += 2) T[pairs[i]] = pairs[i + 1];
const colorCount = new Float64Array(C);
for (let c = 0; c < C; c++) for (let w = 0; w < W; w++) colorCount[c] += T[c * W + w];

const key = (L: number, a: number, b: number) => `${L},${a},${b}`;
const bins = new Map<string, number>();
for (let c = 0; c < C; c++) bins.set(key(color[3 * c], color[3 * c + 1], color[3 * c + 2]), c);

// CIELAB D65 rounded to 5, else the nearest named bin.
const cache = new Map<string, number>();
function bin(hex: string) {
  const hit = cache.get(hex);
  if (hit !== undefined) return hit;
  const { l, a, b } = lab65(hex)!;
  const r = (v: number) => 5 * Math.round(v / 5);
  let c = bins.get(key(r(l), r(a), r(b)));
  if (c === undefined) {
    let best = Infinity;
    for (let i = 0; i < C; i++) {
      const d = (color[3 * i] - l) ** 2 + (color[3 * i + 1] - a) ** 2 + (color[3 * i + 2] - b) ** 2;
      if (d < best) [best, c] = [d, i];
    }
  }
  cache.set(hex, c!);
  return c!;
}

export const BASIC_NAMES = terms.slice(0, 9);

// p(name | color)
function nameProbs(hex: string) {
  const c = bin(hex);
  return terms.map((_, w) => T[c * W + w] / colorCount[c]);
}

export function nameOf(hex: string) {
  const p = nameProbs(hex);
  const top = p.indexOf(Math.max(...p));
  const basic = p.slice(0, BASIC_NAMES.length);
  const b = basic.indexOf(Math.max(...basic));
  return { name: terms[top], p: p[top], basic: BASIC_NAMES[b] };
}

// One name per color. A shared top name goes to the best fit; the others take the free name they lead most, else a
// number.
export function distinctNames(hexes: string[]) {
  const p = hexes.map(nameProbs);
  const top = hexes.map((hex) => terms.indexOf(nameOf(hex).name));
  const names: (string | undefined)[] = hexes.map((_, i) =>
    top.every(
      (w, j) => j === i || w !== top[i] || p[j][w] < p[i][w] || (p[j][w] === p[i][w] && j > i)
    )
      ? terms[top[i]]
      : undefined
  );
  const used = new Set(names.filter(Boolean));
  for (let left = names.filter((n) => !n).length; left > 0; left--) {
    let best = { i: -1, w: -1, lead: 0 };
    names.forEach((n, i) => {
      if (n) return;
      for (let w = 0; w < W; w++) {
        if (used.has(terms[w])) continue;
        const lead = p[i][w] - Math.max(0, ...p.map((q, j) => (j === i ? 0 : q[w])));
        if (lead > best.lead) best = { i, w, lead };
      }
    });
    if (best.i < 0) break;
    names[best.i] = terms[best.w];
    used.add(terms[best.w]);
  }
  const seen: Record<string, number> = {};
  return names.map((n, i) => {
    if (n) return n;
    const base = terms[top[i]];
    seen[base] = (seen[base] ?? 1) + 1;
    while (used.has(`${base} ${seen[base]}`)) seen[base]++;
    used.add(`${base} ${seen[base]}`);
    return `${base} ${seen[base]}`;
  });
}

// Hellinger distance between name distributions: 0 alike, 1 nothing shared.
export function nameDistance(a: string, b: string) {
  const ca = bin(a);
  const cb = bin(b);
  let bc = 0;
  for (let w = 0; w < W; w++) bc += Math.sqrt(T[ca * W + w] * T[cb * W + w]);
  return Math.sqrt(Math.max(0, 1 - bc / Math.sqrt(colorCount[ca] * colorCount[cb])));
}

// Negative name entropy, scaled 0-1: high when people agree on a name.
const entropy = (c: number) => {
  let H = 0;
  for (let w = 0; w < W; w++) {
    const p = T[c * W + w] / colorCount[c];
    if (p > 0) H -= p * Math.log2(p);
  }
  return H;
};
const entropies = Array.from({ length: C }, (_, c) => entropy(c));
const [minH, maxH] = [Math.min(...entropies), Math.max(...entropies)];
export const saliency = (hex: string) => 1 - (entropies[bin(hex)] - minH) / (maxH - minH);
