/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

export const DEFAULT_FALLBACK_PALETTE = 'default' as const;

export const EUI_THEME_AMSTERDAM = 'EUI_THEME_AMSTERDAM';
export const EUI_THEME_BOREALIS = 'EUI_THEME_BOREALIS';

const semantic = {
  /**
   * Log level palette
   */
  LogLevel: 'log_level' as const,
  /**
   * Severity palette
   */
  Severity: 'severity' as const,
};

const categorical = {
  /**
   * Default kibana theme
   */
  Default: DEFAULT_FALLBACK_PALETTE,
  /**
   * The Elastic palette as an option when a brand palette replaces the Default palette
   */
  Elastic: 'elastic' as const,
  /**
   * Variant of Default palette optimized for line charts: dark tones first, red/yellow swapped.
   */
  ElasticLineOptimized: 'elastic_line_optimized' as const,
  /**
   * Contrast roles faint per hue: fills behind text, such as table cells.
   */
  ElasticFaint: 'elastic_faint' as const,
  /**
   * Contrast roles base and muted per hue, light mode's colors in both modes.
   */
  Revised: 'revised' as const,
  /**
   * Contrast roles base and muted per hue on each mode's surface, with muted past base.
   */
  HighContrast: 'high_contrast' as const,
  /**
   * Contrast roles base and muted per hue on each mode's surface.
   */
  LowContrast: 'low_contrast' as const,
  /**
   * Neutral palette
   */
  Neutral: 'neutral' as const,

  // ---- Legacy Palettes ----
  /**
   * Kibana legacy theme v7 to v9
   */
  Kibana7: 'eui_amsterdam' as const,
  /**
   * Kibana behind text legacy theme v7 to v9
   */
  Kibana7BehindText: 'behind_text' as const,
  /**
   * Kibana legacy theme v4 to v7
   */
  Kibana4: 'kibana_v7_legacy' as const,
  /**
   * Elastic classic color palette
   */
  ElasticClassic: 'elastic_brand_2023' as const,
};

const gradient = {
  Cool: 'cool' as const,
  Gray: 'gray' as const,
  Red: 'red' as const,
  Green: 'green' as const,
  Warm: 'warm' as const,
  Temperature: 'temperature' as const,
  Complementary: 'complementary' as const,
  Status: 'status' as const,
  CompareTo: 'compare_to' as const,

  // Contrast roles ramps on each mode's surface.
  ThemeAwareCool: 'theme_aware_cool' as const,
  ThemeAwareWarm: 'theme_aware_warm' as const,
  ThemeAwareRed: 'theme_aware_red' as const,
  ThemeAwareGreen: 'theme_aware_green' as const,
  ThemeAwareTemperature: 'theme_aware_temperature' as const,
  ThemeAwareComplementary: 'theme_aware_complementary' as const,
};

/**
 * Categorical palettes built from contrast roles, whose colors map to a hue's roles.
 */
export const CONTRAST_ROLES_CATEGORICAL_PALETTES: readonly string[] = [
  categorical.Revised,
  categorical.HighContrast,
  categorical.LowContrast,
  categorical.ElasticFaint,
];

/**
 * Enum of all kbn palette ids, including by type
 */
export const KbnPalette = {
  // Categorical palettes
  ...categorical,

  // Gradient palettes
  ...gradient,

  // Semantic palettes
  ...semantic,

  // ---- Deprecated palettes ----
  /**
   * Amsterdam theme
   * @deprecated use `KbnPalette.kibana7`
   */
  Amsterdam: 'eui_amsterdam_color_blind' as const,
};
