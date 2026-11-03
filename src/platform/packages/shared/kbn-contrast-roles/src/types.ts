/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// The vocabulary of contrast roles: colors, roles, the theme it's resolved against, and its parameters.

export type Hex = string;
export interface Oklch {
  L: number;
  C: number;
  h: number;
}

// What a color is drawn as. Each role has one APCA |Lc| target against the surface.
export type Role = 'faint' | 'muted' | 'base' | 'strong' | 'ink';
export const ROLES: Role[] = ['faint', 'muted', 'base', 'strong', 'ink'];

// The input: the two mode surfaces and the hues. Each mode's far end is the other mode's surface (on white, as dark
// as navy; on navy, as light as white). A hue is named by its base color (its anchor, e.g. EUI's /60), or by an OKLCH
// hue angle when there is no anchor. neutralTint colors the diverging middle on a surface with no hue of its own.
export interface HueInput {
  name: string;
  base?: Hex;
  angle?: number;
}
export interface Theme {
  surfaces: { light: Hex; dark: Hex };
  hues: HueInput[];
  neutralTint?: Hex;
}
export interface Hue {
  name: string;
  angle: number;
  anchor?: Hex;
}

// Tunables. See defaults.ts for what each one does and where its value comes from.
export interface Params {
  // Lc target per role against the surface (ink: against its faint fill).
  lc: Record<Role, number>;
  // Base: the hue's anchor color, or modelled from the base target plus a lift for hues whose cusp sits high.
  base: { from: 'anchor' | 'model'; cuspPull: number; cuspRef: number };
  // Chroma: the most base can carry, and how the other roles get theirs.
  chroma: { ceiling: number; mode: 'cap' | 'even'; taper: number; taperDark: number };
  // Sequential ramps: Lc of the first and last step.
  ramp: { from: number; to: number };
}

// A resolved color, with its lightness before the hue correction for base (L0).
export type Color = Oklch & { hex: Hex };
export type BaseColor = Color & { L0: number };

export type RoleColors = { name: string; angle: number } & Record<Role, Hex>;
export interface Palettes {
  roles: RoleColors[];
  // Stacked bars and areas: base and muted per hue.
  intertwined: Hex[];
  // Lines: every base, then every strong.
  lines: Hex[];
  sequential: (hue: string, n: number) => Hex[];
  diverging: (from: string, to: string, n: number) => Hex[];
}
