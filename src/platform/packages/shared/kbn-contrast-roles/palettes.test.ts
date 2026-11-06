/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { DEFAULT_PARAMS, apcaLc, hexToOklch, type Hex } from './src';
import { SURFACES, borealis, borealisStatus, type Mode } from './borealis';
import {
  categoricalForTable,
  colorsToMode,
  isContrastRolesRamp,
  rampForTable,
  revised,
  roleFor,
  themeAware,
  toMode,
} from './palettes';
import { DEFAULT_STATE, contrastRolesStore, highContrastParams } from './store';

// From `npm run check` in vis-color-workbench (scripts/check-palettes.snap.json): faint, muted, base, strong, ink.
const EXPECTED = {
  light: {
    teal: ['#AEF3EF', '#7AE2DD', '#16C5C0', '#00938F', '#005A58'],
    blue: ['#D0E3FF', '#A4C9FF', '#61A2FF', '#3978D2', '#003F8B'],
    pink: ['#FFD5E3', '#FFABCA', '#EE72A6', '#C0487E', '#770043'],
    red: ['#FFD6D1', '#FFAFA7', '#F6726A', '#C84844', '#7A000D'],
    yellow: ['#FFE6B7', '#FDCE71', '#EAAE01', '#C07800', '#7C4C00'],
    purple: ['#E6DAFF', '#D1B8FF', '#B386F9', '#8C5ECD', '#54208C'],
  },
  dark: {
    teal: ['#006765', '#009390', '#16C5C0', '#76E0DB', '#C1FAF7'],
    blue: ['#2A5694', '#4379C7', '#61A2FF', '#A1C8FF', '#DBEAFF'],
    pink: ['#88355A', '#B9517E', '#EE72A6', '#FFA9C9', '#FFDCE8'],
    red: ['#8E3531', '#C0514B', '#F6726A', '#FFACA4', '#FFDEDA'],
    yellow: ['#845519', '#B77D34', '#E1B14D', '#F4CF85', '#FFF1D5'],
    purple: ['#634491', '#8963C3', '#B386F9', '#D0B6FF', '#EBE1FF'],
  },
};

const rolesOn = (mode: Mode) => borealis.palettes(SURFACES[mode], DEFAULT_PARAMS).roles;
const lightness = (hex: string) => hexToOklch(hex as Hex).L;
const lcOn = (hex: string, mode: Mode) => Math.abs(apcaLc(hex, SURFACES[mode]));

describe('contrast roles on Borealis', () => {
  afterEach(() => contrastRolesStore.set(DEFAULT_STATE));

  it('reads the surfaces from the theme', () => {
    expect(SURFACES).toEqual({ light: '#FFFFFF', dark: '#111C2C' });
  });

  it.each(['light', 'dark'] as const)('matches the workbench in %s mode', (mode) => {
    const roles = rolesOn(mode);
    for (const [hue, expected] of Object.entries(EXPECTED[mode])) {
      const role = roles.find(({ name }) => name === hue);
      expect(role && [role.faint, role.muted, role.base, role.strong, role.ink]).toEqual(expected);
    }
  });

  describe('categorical palettes', () => {
    it.each(['light', 'dark'] as const)(
      'pairs base with muted per hue for Low contrast in %s mode',
      (mode) => {
        const [teal] = rolesOn(mode);
        const colors = themeAware(mode).lowContrast(14);
        expect(colors.slice(0, 2)).toEqual([teal.base, teal.muted]);
        expect(colors.slice(12)).toEqual(colors.slice(0, 2));
      }
    );

    it.each(['light', 'dark'] as const)('puts High contrast muted past base in %s mode', (mode) => {
      const [teal] = borealis.palettes(
        SURFACES[mode],
        highContrastParams(contrastRolesStore.get())
      ).roles;
      const [base, muted] = themeAware(mode).highContrast(2);
      expect([base, muted]).toEqual([teal.base, teal.muted]);
      expect(lcOn(muted, mode)).toBeGreaterThan(lcOn(base, mode));
    });

    it.each(['light', 'dark'] as const)(
      "pairs yellow base with light's usual muted in %s mode, in both contrasts",
      (mode) => {
        const lightYellowMuted = rolesOn('light').find(({ name }) => name === 'yellow')!.muted;
        const roles = rolesOn(mode);
        const i = roles.findIndex(({ name }) => name === 'yellow');
        const yellow = roles[i];
        const { lowContrast, highContrast } = themeAware(mode);
        expect(lowContrast(12).slice(2 * i, 2 * i + 2)).toEqual([yellow.base, lightYellowMuted]);
        expect(highContrast(12).slice(2 * i, 2 * i + 2)).toEqual([yellow.base, lightYellowMuted]);
      }
    );

    it("keeps Revised on light mode's colors in both modes", () => {
      expect(revised(12)).toEqual(themeAware('light').lowContrast(12));
      expect(revised(12)).not.toEqual(themeAware('dark').lowContrast(12));
    });

    it('follows the store parameters', () => {
      const before = themeAware('light').lowContrast(2);
      contrastRolesStore.set({
        params: { ...DEFAULT_PARAMS, lc: { ...DEFAULT_PARAMS.lc, muted: 40 } },
      });
      const after = themeAware('light').lowContrast(2);
      expect(after[0]).toBe(before[0]);
      expect(lightness(after[1])).toBeLessThan(lightness(before[1]));
    });
  });

  describe('gradients', () => {
    it('ends ramps on the base color', () => {
      const cool = themeAware('dark').cool(5);
      expect(cool).toHaveLength(5);
      expect(cool[4]).toBe('#61A2FF');
    });

    it.each(['light', 'dark'] as const)('ramps positive on the success hue in %s mode', (mode) => {
      const [success] = borealisStatus.palettes(SURFACES[mode], DEFAULT_PARAMS).roles;
      expect(themeAware(mode).positive(5)[4]).toBe(success.base);
    });

    it('recognizes contrast roles ramps, forwards or reversed, in either mode', () => {
      expect(isContrastRolesRamp(themeAware('light').cool(5))).toBe(true);
      expect(isContrastRolesRamp([...themeAware('dark').temperature(7)].reverse())).toBe(true);
      expect(isContrastRolesRamp(['#123456', '#654321'])).toBe(false);
      expect(isContrastRolesRamp([])).toBe(false);
    });
  });

  describe('tables', () => {
    it.each(['light', 'dark'] as const)(
      'gives categorical colors their faint for fills and strong for text in %s mode',
      (mode) => {
        const [teal] = rolesOn(mode);
        expect(categoricalForTable(teal.base, mode, 'fill')).toBe(teal.faint);
        expect(categoricalForTable(teal.muted, mode, 'text')).toBe(teal.strong);
        const [, highContrastMuted] = themeAware(mode).highContrast(2);
        expect(roleFor(highContrastMuted, mode)?.name).toBe('teal');
      }
    );

    it.each(['light', 'dark'] as const)(
      'moves ramps to faint to muted for fills and base to strong for text in %s mode',
      (mode) => {
        const blue = rolesOn(mode)[1];
        const cool = themeAware(mode).cool(5);
        expect(rampForTable(cool[0], mode, 'fill')).toBe(blue.faint);
        expect(rampForTable(cool[4], mode, 'fill')).toBe(blue.muted);
        expect(lcOn(rampForTable(cool[0], mode, 'text')!, mode)).toBeCloseTo(50, 0);
        expect(rampForTable(cool[4], mode, 'text')).toBe(blue.strong);
        const fills = cool.map((color) => rampForTable(color, mode, 'fill')!);
        const lcs = fills.map((color) => lcOn(color, mode));
        expect([...lcs].sort((a, b) => a - b)).toEqual(lcs);
      }
    );

    it('keeps the diverging middle for fills and gives it no text color', () => {
      const middle = themeAware('light').temperature(5)[2];
      expect(rampForTable(middle, 'light', 'fill')).toBe(middle);
      expect(rampForTable(middle, 'light', 'text')).toBeUndefined();
    });
  });

  it('maps saved ramp and role colors from the other mode, and leaves other colors alone', () => {
    const [lightCool, darkCool] = [themeAware('light').cool(5), themeAware('dark').cool(5)];
    expect(colorsToMode(lightCool, 'dark')).toEqual(darkCool);
    expect(colorsToMode([...darkCool].reverse(), 'light')).toEqual([...lightCool].reverse());
    expect(colorsToMode(lightCool, 'light')).toEqual(lightCool);
    const [lightTeal] = rolesOn('light');
    const [darkTeal] = rolesOn('dark');
    expect(toMode(lightTeal.faint, 'dark')).toBe(darkTeal.faint);
    expect(toMode(lightTeal.faint, 'light')).toBe(lightTeal.faint);
    expect(toMode('#123456', 'dark')).toBe('#123456');
  });
});
