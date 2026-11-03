/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// Contrast roles: every color = hue + role, resolved against a known surface.
//
// Each role has one APCA |Lc| target against the surface, the same for every hue and both modes, as contrast-based
// systems do (apcach, Harmonizer, Leonardo). The lightness that hits it is solved along the hue (solve.ts), then
// shifted by the hue's correction (hue_correction.ts), with chroma from the chosen rule (chroma.ts). Ink is text on
// its faint fill, so its target is against faint. Ramps run from just off the surface up to base; the diverging
// middle is a small lightness step off the surface.
import { capChroma, fixedChroma } from './chroma';
import { hexToOklch, maxChroma, oklchToHex } from './color';
import { correctionShare, cuspOffset } from './hue_correction';
import { assemble } from './palettes';
import { clampL, createSolver } from './solve';
import type { BaseColor, Color, Hex, Hue, Palettes, Params, Role, Theme } from './types';

// The diverging middle sits this far (OKLab L) off the surface. APCA can't place it: it reports 0 below about Lc 7.5,
// and its smallest target is already a visible grey on white (#EEEDED).
const NEUTRAL_DL = 0.025;
// Below this chroma a surface counts as having no hue; the neutral middle then borrows the theme's neutralTint.
const ACHROMATIC = 0.005;

export type ContrastRoles = ReturnType<typeof createContrastRoles>;

export function createContrastRoles(theme: Theme) {
  const hues: Hue[] = theme.hues.map((h) => ({
    name: h.name,
    angle: h.angle ?? hexToOklch(h.base!).h,
    anchor: h.base,
  }));
  const anchorByAngle = new Map(hues.filter((h) => h.anchor).map((h) => [h.angle, h.anchor!]));
  const lightEnd = hexToOklch(theme.surfaces.light).L; // the far end on a dark surface
  const darkEnd = hexToOklch(theme.surfaces.dark).L; // the far end on a light surface
  const farEnd = (Ls: number) => (Ls < 0.5 ? lightEnd : darkEnd);
  const neutralTint = theme.neutralTint ? hexToOklch(theme.neutralTint) : null;
  const solveLightness = createSolver();

  // Base on this surface. L0 is where the hue hits the base target. Then either the hue's anchor itself ('anchor';
  // hues without one fall back to the model), or L0 plus the modelled correction, with chroma the gamut under the
  // ceiling ('model'). L − L0 is the hue's correction.
  function baseColor(angle: number, surface: Hex, p: Params): BaseColor {
    const Ls = hexToOklch(surface).L;
    const ceil = p.chroma.ceiling;
    const L0 = solveLightness({
      angle,
      target: p.lc.base,
      against: surface,
      from: Ls,
      to: farEnd(Ls),
      chromaAt: (L) => fixedChroma(angle, L, ceil),
      key: `base|${ceil}`,
    });
    const anchor = p.base.from === 'anchor' && anchorByAngle.get(angle);
    if (anchor) {
      const { L, C } = hexToOklch(anchor);
      return { hex: anchor, L, L0, C, h: angle };
    }
    const L = clampL(L0 + cuspOffset(angle, p));
    const C = fixedChroma(angle, L, ceil);
    return { hex: oklchToHex(L, C, angle), L, L0, C, h: angle };
  }

  // One color: hue + target |Lc| on a surface. `against` is what the target is measured against (the surface, or the
  // faint fill for ink). fixedC: one chroma for this color instead of the 'cap' rule (even mode).
  function contrastColor(
    angle: number,
    target: number,
    surface: Hex,
    p: Params,
    against: Hex = surface,
    fixedC: number | null = null
  ): Color {
    const Ls = hexToOklch(surface).L;
    const end = farEnd(Ls);
    const base = baseColor(angle, surface, p);
    const chromaAt =
      fixedC === null
        ? (L: number) => capChroma(angle, L, target, base, p)
        : (L: number) => fixedChroma(angle, L, fixedC);
    const L0 = solveLightness({
      angle,
      target,
      against,
      from: against === surface ? Ls : hexToOklch(against).L,
      to: end,
      chromaAt,
      key: `${base.C}|${base.L}|${p.chroma.taper}|${p.chroma.taperDark}|${p.lc.base}|${fixedC}`,
    });
    const L = clampL(L0 + (base.L - base.L0) * correctionShare(L0, Ls, end, base.L0));
    const C = chromaAt(L);
    return { hex: oklchToHex(L, C, angle), L, C, h: angle };
  }

  // 'even' chroma: the lowest of the hues' in-gamut maxima at this target, under the ceiling.
  function evenChroma(
    target: number,
    surface: Hex,
    p: Params,
    againstFor: (angle: number) => Hex = () => surface
  ) {
    const untapered = { ...p, chroma: { ...p.chroma, taper: 0 } };
    const maxima = hues.map((h) =>
      maxChroma(contrastColor(h.angle, target, surface, untapered, againstFor(h.angle)).L, h.angle)
    );
    return Math.min(p.chroma.ceiling, ...maxima);
  }

  // Just off the surface, in the surface's own tint (or the theme's neutral tint on an achromatic surface).
  function neutralColor(surface: Hex): Hex {
    const s = hexToOklch(surface);
    const L = clampL(s.L + Math.sign(farEnd(s.L) - s.L) * NEUTRAL_DL);
    const tint = s.C < ACHROMATIC && neutralTint ? neutralTint : s;
    return oklchToHex(L, tint.C, tint.h);
  }

  // Every palette on one surface.
  function palettes(surface: Hex, p: Params): Palettes {
    const even = p.chroma.mode === 'even';
    const faintHex = (angle: number, C: number | null) =>
      contrastColor(angle, p.lc.faint, surface, p, surface, C).hex;
    // Even mode: one chroma per role, computed once per palette.
    const evenC: Partial<Record<Role, number>> = {};
    if (even) {
      for (const k of ['faint', 'muted', 'strong'] as const)
        evenC[k] = evenChroma(p.lc[k], surface, p);
      evenC.ink = evenChroma(p.lc.ink, surface, p, (angle) => faintHex(angle, evenC.faint!));
    }
    const role = (angle: number, k: Role) => {
      if (k === 'base') return baseColor(angle, surface, p).hex;
      const C = even ? evenC[k]! : null;
      if (k !== 'ink') return contrastColor(angle, p.lc[k], surface, p, surface, C).hex;
      // Ink is text on the faint fill, so its target is measured against faint.
      return contrastColor(
        angle,
        p.lc.ink,
        surface,
        p,
        faintHex(angle, even ? evenC.faint! : null),
        C
      ).hex;
    };
    const rampC: Record<number, number> = {};
    const ramp = (angle: number, t: number) => {
      const target = p.ramp.from + (p.ramp.to - p.ramp.from) * t;
      // A step at base's target is base itself, so ramps end on the base color in both chroma modes.
      if (target === p.lc.base) return baseColor(angle, surface, p).hex;
      if (even && !(target in rampC)) rampC[target] = evenChroma(target, surface, p);
      return contrastColor(angle, target, surface, p, surface, even ? rampC[target] : null).hex;
    };
    return assemble(hues, role, ramp, neutralColor(surface));
  }

  return {
    hues,
    hueNames: hues.map((h) => h.name),
    hueAngle: (name: string) => hues.find((h) => h.name === name)!.angle,
    baseColor,
    contrastColor,
    palettes,
  };
}
