/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import { schema } from '@kbn/config-schema';
import type { UiSettingsParams } from '@kbn/core/server';
import {
  BRAND_BAND_RANGE,
  BRAND_GENERATOR_SETTING,
  BRAND_HUES_SETTING,
  BRAND_LOGO_SETTING,
  BRAND_PALETTE_SETTING,
  DEFAULT_BRAND_GENERATOR,
  MAX_BRAND_COLORS,
  MAX_BRAND_HUES,
  MAX_BRAND_LOGO_SIZE_IN_KB,
  MAX_BRAND_SHUFFLE,
} from '../common';

const BRAND_CATEGORY = 'brand';
const MAX_LOGO_SIZE_IN_BASE64 = Math.floor((MAX_BRAND_LOGO_SIZE_IN_KB * 1024 * 8) / 6);

const hexColorRegex = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
// SVG only: custom content panels can show the logo only as inline SVG markup.
const svgDataUrlRegex = /^data:image\/svg\+xml;base64,/;

const validateBrandColor = (color: string) => {
  if (!hexColorRegex.test(color)) {
    return i18n.translate('charts.uiSettings.brandPalette.invalidColor', {
      defaultMessage: '{color} is not a valid hex color, such as #0B64DD.',
      values: { color },
    });
  }
};

// The Brand section of the global settings page edits these settings, so hide their rows.
const hiddenFromAdvancedSettings = { readonly: true, readonlyMode: 'ui' } as const;

const brandColorsSchema = (maxSize: number) =>
  schema.arrayOf(schema.string({ maxLength: 7, validate: validateBrandColor }), { maxSize });

const brandHuesSchema = schema.arrayOf(
  schema.object({
    name: schema.string({ maxLength: 40 }),
    base: schema.string({ maxLength: 7, validate: validateBrandColor }),
  }),
  { maxSize: MAX_BRAND_HUES }
);

// JSON settings are stored as strings, so parse before checking the hues.
const validateBrandHues = (value: string) => {
  try {
    brandHuesSchema.validate(JSON.parse(value));
  } catch (error) {
    return i18n.translate('charts.uiSettings.brandHues.invalid', {
      defaultMessage: 'Brand hues must be a list of names and hex colors: {message}',
      values: { message: error.message },
    });
  }
};

const brandGeneratorSchema = schema.object({
  band: schema.number(BRAND_BAND_RANGE),
  shuffle: schema.number({ min: 0, max: MAX_BRAND_SHUFFLE }),
});

const validateBrandGenerator = (value: string) => {
  try {
    brandGeneratorSchema.validate(JSON.parse(value));
  } catch (error) {
    return i18n.translate('charts.uiSettings.brandGenerator.invalid', {
      defaultMessage: 'Brand hue options must have a band and a shuffle number: {message}',
      values: { message: error.message },
    });
  }
};

const validateBrandLogo = (logo: string) => {
  if (!svgDataUrlRegex.test(logo)) {
    return i18n.translate('charts.uiSettings.brandLogo.invalidFile', {
      defaultMessage: 'Use an SVG image.',
    });
  }
};

export const getUiSettings = (): Record<string, UiSettingsParams> => ({
  [BRAND_PALETTE_SETTING]: {
    name: i18n.translate('charts.uiSettings.brandPalette.name', {
      defaultMessage: 'Brand colors',
    }),
    description: i18n.translate('charts.uiSettings.brandPalette.description', {
      defaultMessage:
        'Hex colors, separated by commas, main color first, that the brand hues are generated from. Leave empty for no brand palettes.',
    }),
    value: [],
    type: 'array',
    order: 1,
    ...hiddenFromAdvancedSettings,
    category: [BRAND_CATEGORY],
    schema: brandColorsSchema(MAX_BRAND_COLORS),
  },
  [BRAND_HUES_SETTING]: {
    name: i18n.translate('charts.uiSettings.brandHues.name', {
      defaultMessage: 'Brand hues',
    }),
    description: i18n.translate('charts.uiSettings.brandHues.description', {
      defaultMessage:
        'The hues generated from the brand colors, as names and base hex colors. The brand palettes are built from them, next to the Elastic palettes.',
    }),
    value: '[]',
    type: 'json',
    order: 2,
    ...hiddenFromAdvancedSettings,
    category: [BRAND_CATEGORY],
    schema: schema.string({ maxLength: 1024, validate: validateBrandHues }),
  },
  [BRAND_GENERATOR_SETTING]: {
    name: i18n.translate('charts.uiSettings.brandGenerator.name', {
      defaultMessage: 'Brand hue options',
    }),
    description: i18n.translate('charts.uiSettings.brandGenerator.description', {
      defaultMessage: 'The options the brand hues were generated with.',
    }),
    value: JSON.stringify(DEFAULT_BRAND_GENERATOR),
    type: 'json',
    order: 2,
    ...hiddenFromAdvancedSettings,
    category: [BRAND_CATEGORY],
    schema: schema.string({ maxLength: 200, validate: validateBrandGenerator }),
  },
  [BRAND_LOGO_SETTING]: {
    name: i18n.translate('charts.uiSettings.brandLogo.name', {
      defaultMessage: 'Brand logo',
    }),
    description: i18n.translate('charts.uiSettings.brandLogo.description', {
      defaultMessage:
        'Your organization logo as an SVG image smaller than {maxSize} KB, for use in dashboards and custom panels.',
      values: { maxSize: MAX_BRAND_LOGO_SIZE_IN_KB },
    }),
    value: null,
    type: 'image',
    order: 3,
    requiresPageReload: true,
    ...hiddenFromAdvancedSettings,
    category: [BRAND_CATEGORY],
    schema: schema.nullable(
      schema.string({ maxLength: MAX_LOGO_SIZE_IN_BASE64, validate: validateBrandLogo })
    ),
  },
});
