/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// The palette lists a product needs, from a function that gives a role's color and one that gives a ramp step.
import { ROLES, type Hex, type Hue, type Palettes, type Role, type RoleColors } from './types';

export function assemble(
  hues: Hue[],
  roleHex: (angle: number, role: Role) => Hex,
  rampHex: (angle: number, t: number) => Hex,
  neutralHex: Hex
): Palettes {
  const roles = hues.map(
    (h) =>
      ({
        name: h.name,
        angle: h.angle,
        ...Object.fromEntries(ROLES.map((k) => [k, roleHex(h.angle, k)])),
      } as RoleColors)
  );
  const angleOf = (name: string) => hues.find((h) => h.name === name)!.angle;
  const ramp = (name: string, n: number) =>
    Array.from({ length: n }, (_, k) => rampHex(angleOf(name), n > 1 ? k / (n - 1) : 1));
  return {
    roles,
    intertwined: roles.flatMap((r) => [r.base, r.muted]),
    lines: [...roles.map((r) => r.base), ...roles.map((r) => r.strong)],
    sequential: ramp,
    // A neutral middle just off the surface; each arm is a sequential ramp of its hue.
    diverging: (from, to, n) => {
      const half = (n - 1) / 2;
      const steps = Math.ceil(half);
      return Array.from({ length: n }, (_, k) => {
        const i = k - half;
        if (i === 0) return neutralHex;
        const j = Math.ceil(Math.abs(i)); // steps from the middle, 1..
        return rampHex(angleOf(i < 0 ? from : to), steps > 1 ? (j - 1) / (steps - 1) : 1);
      });
    },
  };
}
