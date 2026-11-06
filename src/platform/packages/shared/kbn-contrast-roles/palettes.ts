/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { borealis, borealisStatus, SURFACES, type Mode } from './borealis';
import { contrastRolesStore, highContrastParams, type ContrastRolesState } from './store';
import {
  ROLES,
  apcaLc,
  hexToOklch,
  type ContrastRoles,
  type Hex,
  type Palettes,
  type Params,
  type RoleColors,
} from './src';

export interface ThemeAwarePalettes {
  /** Low contrast: base and muted per hue on this mode's surface (the workbench's Dynamic). */
  lowContrast: (n: number) => Hex[];
  /** High contrast: base and muted per hue, with muted past base (the workbench's High Contrast). */
  highContrast: (n: number) => Hex[];
  /** Elastic faint: faint per hue, for fills such as table cells. */
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
}

/** Distinct colors per categorical palette, before they repeat. */
export const CATEGORICAL_COUNTS = {
  stacks: borealis.hues.length * 2,
  faint: borealis.hues.length,
} as const;

// Past their length, categorical palettes repeat.
const repeat =
  (colors: Hex[]) =>
  (n: number): Hex[] =>
    Array.from({ length: n }, (_, i) => colors[i % colors.length]);

interface Resolved {
  params: Params;
  palettes: Palettes;
  highContrast: Palettes;
  status: Palettes;
}

const resolve = (mode: Mode, state: ContrastRolesState): Resolved => {
  const surface = SURFACES[mode];
  const { params } = state;
  return {
    params,
    palettes: borealis.palettes(surface, params),
    // Yellow's stack pair keeps the usual muted (src/contrast_roles.ts).
    highContrast: borealis.palettes(surface, highContrastParams(state), params.lc.muted),
    status: borealisStatus.palettes(surface, params),
  };
};

const cache = new Map<Mode, { state: ContrastRolesState; resolved: Resolved }>();

const resolved = (mode: Mode, state = contrastRolesStore.get()): Resolved => {
  const hit = cache.get(mode);
  if (hit?.state === state) return hit.resolved;
  const next = resolve(mode, state);
  cache.set(mode, { state, resolved: next });
  return next;
};

/** Contrast roles palettes on the given mode's surface, from the store's current parameters. */
export const themeAware = (mode: Mode): ThemeAwarePalettes => {
  const { palettes, highContrast, status } = resolved(mode);
  const { roles, intertwined, sequential, diverging } = palettes;
  return {
    lowContrast: repeat(intertwined),
    highContrast: repeat(highContrast.intertwined),
    elasticFaint: repeat(roles.map(({ faint }) => faint)),
    cool: (n) => sequential('blue', n),
    warm: (n) => sequential('red', n),
    red: (n) => sequential('red', n),
    temperature: (n) => diverging('blue', 'red', n),
    positive: (n) => status.sequential('success', n),
    complementary: (n) => diverging('blue', 'yellow', n),
  };
};

/** Revised: light mode's Low contrast colors, the same in both modes. */
export const revised = (n: number): Hex[] => themeAware('light').lowContrast(n);

// Below this chroma a color has no hue to match, such as the surface-tinted middle of diverging ramps.
const MIN_HUE_CHROMA = 0.02;

const hueDistance = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

interface HueMatch {
  role: RoleColors;
  model: ContrastRoles;
}

// The role set of a color's hue on this mode's surface: an exact role color first, then the nearest hue.
const matchHue = (color: string, mode: Mode): HueMatch | undefined => {
  const { palettes, status } = resolved(mode);
  const candidates: HueMatch[] = [
    ...palettes.roles.map((role) => ({ role, model: borealis })),
    ...status.roles.map((role) => ({ role, model: borealisStatus })),
  ];
  const hex = color.toLowerCase();
  const exact = candidates.find(({ role }) => ROLES.some((key) => role[key].toLowerCase() === hex));
  if (exact) return exact;
  const { C, h } = hexToOklch(color as Hex);
  if (C < MIN_HUE_CHROMA) return undefined;
  const [nearest] = candidates
    .map((match) => ({ match, distance: hueDistance(match.role.angle, h) }))
    .sort((a, b) => a.distance - b.distance);
  return nearest?.match;
};

/** The contrast roles of a color's hue on the given mode's surface, or undefined for colors with no hue. */
export const roleFor = (color: string, mode: Mode): RoleColors | undefined =>
  matchHue(color, mode)?.role;

/** What a table colors: the cell background, or the text. */
export type TableColorUse = 'fill' | 'text';

/** A categorical color as a table needs it: its hue's faint for fills, strong for text. */
export const categoricalForTable = (
  color: string,
  mode: Mode,
  use: TableColorUse
): Hex | undefined => {
  const role = roleFor(color, mode);
  return role && (use === 'fill' ? role.faint : role.strong);
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * A ramp color as a table needs it: the same hue and position along the ramp, moved to faint to muted for fills and
 * base to strong for text. Colors with no hue (the diverging middle) stay as they are for fills and get no text color.
 */
export const rampForTable = (color: string, mode: Mode, use: TableColorUse): Hex | undefined => {
  const match = matchHue(color, mode);
  if (!match) return use === 'fill' ? color : undefined;
  const { params } = resolved(mode);
  const { lc, ramp } = params;
  const surface = SURFACES[mode];
  const t = clamp01((Math.abs(apcaLc(color, surface)) - ramp.from) / (ramp.to - ramp.from));
  const [from, to] = use === 'fill' ? [lc.faint, lc.muted] : [lc.base, lc.strong];
  return match.model.contrastColor(match.role.angle, from + (to - from) * t, surface, params).hex;
};

const RAMPS = ['cool', 'warm', 'red', 'temperature', 'positive', 'complementary'] as const;

const otherModeOf = (mode: Mode): Mode => (mode === 'light' ? 'dark' : 'light');
const sameColors = (a: string[], b: string[]) =>
  a.length === b.length && a.every((color, i) => color.toLowerCase() === b[i].toLowerCase());

// The ramp a list of colors is, forwards or reversed, in the given mode.
const findRamp = (colors: string[], mode: Mode) => {
  const palettes = themeAware(mode);
  const n = colors.length;
  for (const ramp of RAMPS) {
    const theirs = palettes[ramp](n);
    if (sameColors(colors, theirs)) return { ramp, reversed: false };
    if (sameColors(colors, [...theirs].reverse())) return { ramp, reversed: true };
  }
  return undefined;
};

/** Whether colors are a contrast roles gradient (forwards or reversed) in either mode. */
export const isContrastRolesRamp = (colors: string[]): boolean =>
  colors.length > 0 && Boolean(findRamp(colors, 'light') ?? findRamp(colors, 'dark'));

const roleTranslations = new Map<Mode, { state: ContrastRolesState; other: Map<string, Hex> }>();

// Every role color of the other mode, keyed to the same hue and role in this mode. Colors both modes share stay.
const roleTranslationFor = (mode: Mode) => {
  const state = contrastRolesStore.get();
  const hit = roleTranslations.get(mode);
  if (hit?.state === state) return hit.other;
  const [here, there] = [resolved(mode, state), resolved(otherModeOf(mode), state)];
  const pairs: Array<[Hex, Hex]> = [];
  for (const key of ['palettes', 'status'] as const) {
    here[key].roles.forEach((role, i) =>
      ROLES.forEach((r) => pairs.push([there[key].roles[i][r], role[r]]))
    );
  }
  const own = new Set(pairs.map(([, color]) => color.toLowerCase()));
  const other = new Map<string, Hex>();
  for (const [from, to] of pairs) {
    const key = from.toLowerCase();
    if (!own.has(key) && !other.has(key)) other.set(key, to);
  }
  roleTranslations.set(mode, { state, other });
  return other;
};

/** A saved role color from the other mode, as the same hue and role in this mode; other colors as is. */
export const toMode = (color: string, mode: Mode): string =>
  roleTranslationFor(mode).get(color.toLowerCase()) ?? color;

const savedTranslations = new Map<string, { state: ContrastRolesState; colors: string[] }>();

/**
 * Saved palette colors (custom palettes) in this mode: an untouched ramp from the other mode, forwards or reversed,
 * becomes the same ramp here; otherwise each color goes through `toMode`.
 */
export const colorsToMode = (colors: string[], mode: Mode): string[] => {
  const state = contrastRolesStore.get();
  const cacheKey = `${mode}:${colors.join(',')}`;
  const hit = savedTranslations.get(cacheKey);
  if (hit?.state === state) return hit.colors;
  const there = findRamp(colors, otherModeOf(mode));
  const ramp = there && themeAware(mode)[there.ramp](colors.length);
  const result = ramp
    ? there.reversed
      ? [...ramp].reverse()
      : ramp
    : colors.map((color) => toMode(color, mode));
  savedTranslations.set(cacheKey, { state, colors: result });
  return result;
};
