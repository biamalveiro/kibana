/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { DEFAULT_PARAMS } from './src';
import { SURFACES, borealis, borealisStatus } from './borealis';
import { themeAware } from './palettes';

// From `npm run check` in vis-color-workbench, with DEFAULT_PARAMS.
const EXPECTED = {
  light: {
    teal: ['#AEF3EF', '#7AE2DD', '#16C5C0', '#00938F', '#005A58'],
    blue: ['#D0E3FF', '#A4C9FF', '#61A2FF', '#3978D2', '#003F8B'],
    yellow: ['#FFE6B7', '#FDCE71', '#EAAE01', '#AF8100', '#715200'],
    purple: ['#E6DAFF', '#D1B8FF', '#B386F9', '#8C5ECD', '#54208C'],
  },
  dark: {
    teal: ['#006765', '#009390', '#16C5C0', '#76E0DB', '#C1FAF7'],
    blue: ['#2A5694', '#4379C7', '#61A2FF', '#A1C8FF', '#DBEAFF'],
    yellow: ['#7B5A00', '#AE8000', '#EAAE01', '#FCCD6D', '#FFF1D5'],
    purple: ['#634491', '#8963C3', '#B386F9', '#D0B6FF', '#EBE1FF'],
  },
};

describe('contrast roles on Borealis', () => {
  it('reads the surfaces from the theme', () => {
    expect(SURFACES).toEqual({ light: '#FFFFFF', dark: '#111C2C' });
  });

  it.each(['light', 'dark'] as const)('matches the workbench in %s mode', (mode) => {
    const { roles } = borealis.palettes(SURFACES[mode], DEFAULT_PARAMS);
    for (const [hue, expected] of Object.entries(EXPECTED[mode])) {
      const role = roles.find(({ name }) => name === hue);
      expect(role && [role.faint, role.muted, role.base, role.strong, role.ink]).toEqual(expected);
    }
  });

  it('repeats categorical palettes past their length', () => {
    const colors = themeAware('light').elastic(14);
    expect(colors.slice(0, 2)).toEqual(['#16C5C0', '#7AE2DD']);
    expect(colors.slice(12)).toEqual(colors.slice(0, 2));
  });

  it('ends ramps on the base color', () => {
    const cool = themeAware('dark').cool(5);
    expect(cool).toHaveLength(5);
    expect(cool[4]).toBe('#61A2FF');
  });

  it.each(['light', 'dark'] as const)('runs faint ramps from faint to muted in %s mode', (mode) => {
    const [, blue] = Object.values(EXPECTED[mode]);
    const coolFaint = themeAware(mode).coolFaint(4);
    expect(coolFaint[0]).toBe(blue[0]);
    expect(coolFaint[3]).toBe(blue[1]);
  });

  it.each(['light', 'dark'] as const)('ramps positive on the success hue in %s mode', (mode) => {
    const [success] = borealisStatus.palettes(SURFACES[mode], DEFAULT_PARAMS).roles;
    const { positive, positiveFaint } = themeAware(mode);
    expect([positive(5)[0], positive(5)[4]]).toEqual([success.faint, success.base]);
    expect([positiveFaint(4)[0], positiveFaint(4)[3]]).toEqual([success.faint, success.muted]);
  });

  it.each(['light', 'dark'] as const)(
    'steps status faint through each status faint in %s mode',
    (mode) => {
      const faints = borealisStatus
        .palettes(SURFACES[mode], DEFAULT_PARAMS)
        .roles.map(({ faint }) => faint);
      const status = themeAware(mode).statusFaint(5);
      expect(new Set(status).size).toBe(5);
      expect([status[0], status[2], status[4]]).toEqual(faints);
    }
  );
});
