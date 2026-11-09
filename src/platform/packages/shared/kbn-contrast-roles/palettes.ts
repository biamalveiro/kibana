/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { borealis, borealisStatus, brandRoles, SURFACES, type Mode } from './borealis';
import {
  contrastRolesStore,
  highContrastParams,
  type BrandHueInput,
  type ContrastRolesState,
} from './store';
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
  /** Low contrast on the brand hues. */
  brandLowContrast: (n: number) => Hex[];
  /** High contrast on the brand hues. */
  brandHighContrast: (n: number) => Hex[];
  /** Elastic faint on the brand hues. */
  brandFaint: (n: number) => Hex[];
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

interface ResolvedHues {
  model: ContrastRoles;
  palettes: Palettes;
  highContrast: Palettes;
}

interface Resolved extends ResolvedHues {
  params: Params;
  status: Palettes;
  /** The brand hues, next to Borealis's, when the state has them. */
  brand?: ResolvedHues;
}

const resolveHues = (model: ContrastRoles, surface: Hex, state: ContrastRolesState) => {
  const { params } = state;
  return {
    model,
    palettes: model.palettes(surface, params),
    // Yellow's stack pair keeps the usual muted (src/contrast_roles.ts).
    highContrast: model.palettes(surface, highContrastParams(state), params.lc.muted),
  };
};

const resolve = (mode: Mode, state: ContrastRolesState): Resolved => {
  const surface = SURFACES[mode];
  const { params, brand } = state;
  return {
    params,
    ...resolveHues(borealis, surface, state),
    status: borealisStatus.palettes(surface, params),
    brand: brand && resolveHues(brandRoles(brand), surface, state),
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
  const { palettes, highContrast, status, brand } = resolved(mode);
  const { sequential, diverging } = palettes;
  const faint = ({ roles }: Palettes) => repeat(roles.map((role) => role.faint));
  // Without brand hues, the brand palettes show Borealis's.
  const brandHues = brand ?? { palettes, highContrast };
  return {
    lowContrast: repeat(palettes.intertwined),
    highContrast: repeat(highContrast.intertwined),
    elasticFaint: faint(palettes),
    brandLowContrast: repeat(brandHues.palettes.intertwined),
    brandHighContrast: repeat(brandHues.highContrast.intertwined),
    brandFaint: faint(brandHues.palettes),
    cool: (n) => sequential('blue', n),
    warm: (n) => sequential('red', n),
    red: (n) => sequential('red', n),
    temperature: (n) => diverging('blue', 'red', n),
    positive: (n) => status.sequential('success', n),
    complementary: (n) => diverging('blue', 'yellow', n),
  };
};

/** The brand palettes' distinct colors for these hues on the given mode's surface, before they repeat. */
export interface BrandPreview {
  lowContrast: Hex[];
  highContrast: Hex[];
  faint: Hex[];
}

/** The brand palettes that these hues would give, for previewing hues that are not saved yet. */
export const brandPreview = (
  hues: readonly BrandHueInput[],
  mode: Mode,
  state = contrastRolesStore.get()
): BrandPreview => {
  const { palettes, highContrast } = resolveHues(brandRoles(hues), SURFACES[mode], state);
  return {
    lowContrast: palettes.intertwined,
    highContrast: highContrast.intertwined,
    faint: palettes.roles.map((role) => role.faint),
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

/** Where a color comes from: a categorical palette (Borealis or brand hues) or a ramp (Borealis hues only). */
export type ColorSource = 'categorical' | 'ramp';

const matchesOf = ({ model, palettes }: ResolvedHues): HueMatch[] =>
  palettes.roles.map((role) => ({ role, model }));

// The role set of a color's hue on this mode's surface: an exact role color first, then the nearest hue.
const matchHue = (color: string, mode: Mode, source: ColorSource): HueMatch | undefined => {
  const here = resolved(mode);
  const { status, brand } = here;
  const candidates: HueMatch[] = [
    ...matchesOf(here),
    ...(source === 'categorical' && brand ? matchesOf(brand) : []),
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
export const roleFor = (
  color: string,
  mode: Mode,
  source: ColorSource = 'categorical'
): RoleColors | undefined => matchHue(color, mode, source)?.role;

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
  const match = matchHue(color, mode, 'ramp');
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
  const addPairs = (hereRoles: RoleColors[], thereRoles: RoleColors[]) =>
    hereRoles.forEach((role, i) => ROLES.forEach((r) => pairs.push([thereRoles[i][r], role[r]])));
  addPairs(here.palettes.roles, there.palettes.roles);
  addPairs(here.status.roles, there.status.roles);
  if (here.brand && there.brand) addPairs(here.brand.palettes.roles, there.brand.palettes.roles);
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
