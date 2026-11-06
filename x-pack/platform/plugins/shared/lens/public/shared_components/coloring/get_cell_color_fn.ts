/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ColorMappingInputData, PaletteOutput, PaletteRegistry } from '@kbn/coloring';
import { getSpecialString, getValueKey } from '@kbn/coloring';
import type { CustomPaletteState } from '@kbn/charts-plugin/common';
import { CONTRAST_ROLES_CATEGORICAL_PALETTES, type KbnPalettes } from '@kbn/palettes';
import { isContrastRolesRamp } from '@kbn/contrast-roles';
import type { RawValue } from '@kbn/data-plugin/common';
import { getColorAccessorFn } from './color_mapping_accessor';

/** How a column's contrast roles colors map to a table's roles: by hue, or by hue and position along a ramp. */
export type ContrastRolesColoring = 'categorical' | 'ramp';

export interface CellColorFn {
  (value: RawValue): string | null;
  /** Set when the column's colors come from a contrast roles palette. */
  contrastRoles?: ContrastRolesColoring;
}

const isContrastRolesColorMapping = (colorMapping: string): boolean => {
  const { paletteId } = JSON.parse(colorMapping) as { paletteId?: string };
  return paletteId !== undefined && CONTRAST_ROLES_CATEGORICAL_PALETTES.includes(paletteId);
};

export function getCellColorFn(
  paletteService: PaletteRegistry,
  palettes: KbnPalettes,
  data: ColorMappingInputData,
  colorByTerms: boolean,
  isDarkMode: boolean,
  syncColors: boolean,
  palette?: PaletteOutput<CustomPaletteState>,
  colorMapping?: string
): CellColorFn {
  if (!colorByTerms && palette && data.type === 'ranges') {
    const colorFn: CellColorFn = (value) => {
      if (value === null || value === undefined || typeof value !== 'number') return null;

      return (
        paletteService.get(palette.name).getColorForValue?.(value, palette.params, data) ?? null
      );
    };
    if (isContrastRolesRamp(palette.params?.colors ?? [])) colorFn.contrastRoles = 'ramp';
    return colorFn;
  }

  if (colorByTerms && data.type === 'categories') {
    if (colorMapping) {
      const colorFn: CellColorFn = getColorAccessorFn(palettes, colorMapping, data, isDarkMode);
      if (isContrastRolesColorMapping(colorMapping)) colorFn.contrastRoles = 'categorical';
      return colorFn;
    } else if (palette) {
      return (value: RawValue) => {
        if (value === undefined || value === null) return null;

        const key = getValueKey(value);

        return paletteService.get(palette.name).getCategoricalColor(
          [
            {
              name: getSpecialString(key), // needed to sync special categories (i.e. '')
              rankAtDepth: Math.max(
                data.categories.findIndex((v) => v === key),
                0
              ),
              totalSeriesAtDepth: data.categories.length || 1,
            },
          ],
          {
            maxDepth: 1,
            totalSeries: data.categories.length || 1,
            behindText: false,
            syncColors,
          },
          palette?.params ?? { colors: [] }
        );
      };
    }
  }

  return () => null;
}
