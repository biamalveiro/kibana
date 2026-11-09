/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { DEFAULT_PARAMS, apcaLc, hexToOklch, type Hex } from './src';
import {
  STATUS_COLORS,
  SURFACES,
  borealis,
  borealisStatus,
  brandRoles,
  type Mode,
} from './borealis';
import {
  brandPreview,
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

const rolesOn = (mode: Mode) => borealis.palettes(SURFACES[mode], DEFAULT_PARAMS).roles;
const lightness = (hex: string) => hexToOklch(hex as Hex).L;
const lcOn = (hex: string, mode: Mode) => Math.abs(apcaLc(hex, SURFACES[mode]));

describe('contrast roles on Borealis', () => {
  afterEach(() => contrastRolesStore.set(DEFAULT_STATE));

  it('reads the surfaces from the theme', () => {
    expect(SURFACES).toEqual({ light: '#FFFFFF', dark: '#111C2C' });
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

  it('reads the status colors brand hues avoid from the theme', () => {
    expect(STATUS_COLORS).toEqual(['#008A5E', '#C61E25', '#24C292', '#F6726A']);
  });

  describe('with brand hues', () => {
    const BRAND = [
      { name: 'orange', base: '#EB7D20' },
      { name: 'green', base: '#80BC43' },
    ] as const;
    const brandRolesOn = (mode: Mode) =>
      brandRoles(BRAND).palettes(SURFACES[mode], DEFAULT_PARAMS).roles;

    beforeEach(() => contrastRolesStore.set({ brand: BRAND }));

    it.each(['light', 'dark'] as const)(
      'adds brand palettes next to the Borealis ones in %s mode',
      (mode) => {
        contrastRolesStore.set({ brand: undefined });
        const elastic = themeAware(mode).lowContrast(4);
        contrastRolesStore.set({ brand: BRAND });

        const [orange] = brandRolesOn(mode);
        expect(orange.base).toBe('#EB7D20');
        expect(themeAware(mode).brandLowContrast(2)).toEqual([orange.base, orange.muted]);
        expect(themeAware(mode).lowContrast(4)).toEqual(elastic);
      }
    );

    it('previews the brand palettes of hues that are not in the store', () => {
      contrastRolesStore.set({ brand: undefined });
      const preview = brandPreview(BRAND, 'dark');
      const [orange, green] = brandRolesOn('dark');
      expect(preview.lowContrast.slice(0, 2)).toEqual([orange.base, orange.muted]);
      expect(preview.faint).toEqual([orange.faint, green.faint]);
    });

    it('falls back to Borealis for the brand palettes when no brand is set', () => {
      contrastRolesStore.set({ brand: undefined });
      expect(themeAware('light').brandLowContrast(4)).toEqual(themeAware('light').lowContrast(4));
    });

    it('keeps the ramps on Borealis', () => {
      contrastRolesStore.set({ brand: undefined });
      const cool = themeAware('light').cool(5);
      contrastRolesStore.set({ brand: BRAND });
      expect(themeAware('light').cool(5)).toEqual(cool);
      expect(isContrastRolesRamp(cool)).toBe(true);
    });

    it('colors tables from the brand for categorical colors and from Borealis for ramps', () => {
      const [orange] = brandRolesOn('light');
      expect(categoricalForTable(orange.base, 'light', 'fill')).toBe(orange.faint);
      const [blue] = themeAware('light').cool(1);
      expect(roleFor(blue, 'light', 'ramp')?.name).toBe('blue');
    });

    it('maps saved brand colors from the other mode', () => {
      const [lightOrange] = brandRolesOn('light');
      const [darkOrange] = brandRolesOn('dark');
      expect(toMode(lightOrange.faint, 'dark')).toBe(darkOrange.faint);
    });
  });
});
