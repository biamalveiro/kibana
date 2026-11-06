/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { type ReactNode } from 'react';
import { EuiBadge, EuiLink } from '@elastic/eui';
import classNames from 'classnames';
import type { PaletteOutput } from '@kbn/coloring';
import type { CustomPaletteState } from '@kbn/charts-plugin/common';
import type { RawValue } from '@kbn/data-plugin/common';
import { MISSING_TOKEN } from '@kbn/field-formats-common';
import { i18n } from '@kbn/i18n';
import {
  categoricalForTable,
  rampForTable,
  roleFor,
  type TableColorUse,
} from '@kbn/contrast-roles';
import type { DatatableColumnConfig } from '../../../../common/expressions';
import { getContrastColor } from '../../../shared_components/coloring/utils';
import type {
  CellColorFn,
  ContrastRolesColoring,
} from '../../../shared_components/coloring/get_cell_color_fn';

export type RenderMode = 'badge' | 'progress' | 'link' | 'formatted';

export type Alignment = 'left' | 'right' | 'center' | undefined;

export type ColumnConfigWithIndex = DatatableColumnConfig['columns'][number] & { colIndex: number };

// -----------------------------
// Utility functions
// -----------------------------

export const getBadgeLabel = (value: unknown) =>
  i18n.translate('xpack.lens.table.dynamicColoring.badge.filterLabel', {
    defaultMessage: 'Filter by value: {value}',
    values: { value: String(value) },
  });

export const buildColumnConfigLookup = (
  columns: DatatableColumnConfig['columns']
): Map<string, ColumnConfigWithIndex> => {
  const lookup = new Map<string, ColumnConfigWithIndex>();
  columns.forEach((column, colIndex) => {
    // Keep the first matching column to preserve previous findIndex() behavior.
    if (!lookup.has(column.columnId)) {
      lookup.set(column.columnId, { ...column, colIndex });
    }
  });
  return lookup;
};

export const getCellClassName = (
  alignment: Alignment,
  fitRowToContent?: boolean,
  isColored = false
) =>
  classNames({
    'lnsTableCell--multiline': fitRowToContent,
    'lnsTableCell--colored': isColored,
    ...(alignment ? { [`lnsTableCell--${alignment}`]: true } : {}),
  });

export const getRenderMode = (
  colorMode: string,
  isClickable: boolean,
  isNonColorable: boolean
): RenderMode => {
  if (colorMode === 'badge' && !isNonColorable) return 'badge';
  // Progress bars only render for numeric values; empty/non-numeric cells fall back
  // to the formatted (or link) rendering so blanks stay subdued.
  if (colorMode === 'progress' && !isNonColorable) return 'progress';
  if (isClickable) return 'link';
  return 'formatted';
};

/**
 * Values that are rendered as "empty" placeholders in the table should never receive
 * dynamic coloring (cell/text/badge). They should remain subdued, consistent with
 * the non-colored ("none") mode.
 */
export const isEmptyValue = (rawValue: RawValue): boolean =>
  rawValue == null ||
  rawValue === MISSING_TOKEN ||
  rawValue === '' ||
  (typeof rawValue === 'number' && Number.isNaN(rawValue));

const toMode = (isDarkMode: boolean) => (isDarkMode ? 'dark' : 'light');

/**
 * A contrast roles color as a table cell shows it: faint for backgrounds, strong for text. Ramp backgrounds use the
 * ramp's colors as is; ramp text keeps each step's position, with no text color for the neutral middle.
 */
export const getContrastRolesCellColor = (
  color: string,
  coloring: ContrastRolesColoring,
  use: TableColorUse,
  isDarkMode: boolean
): string | undefined => {
  if (coloring === 'ramp') {
    return use === 'fill' ? color : rampForTable(color, toMode(isDarkMode), use);
  }
  return categoricalForTable(color, toMode(isDarkMode), use) ?? color;
};

/** A contrast roles badge: its hue's faint background (along the ramp, for ramps) and ink text. */
export const getContrastRolesBadgeColors = (
  color: string,
  coloring: ContrastRolesColoring,
  isDarkMode: boolean
): { fill: string; text: string } | undefined => {
  const role = roleFor(color, toMode(isDarkMode));
  if (!role) return undefined;
  const fill =
    coloring === 'ramp' ? rampForTable(color, toMode(isDarkMode), 'fill') ?? color : role.faint;
  return { fill, text: role.ink };
};

export interface ApplyColoringArgs {
  colorMode: string;
  columnId: string;
  palette?: PaletteOutput<CustomPaletteState>;
  colorMapping?: string;
  rawValue: RawValue;
  getCellColor: (
    originalId: string,
    palette?: PaletteOutput<CustomPaletteState>,
    colorMapping?: string
  ) => CellColorFn;
  isDarkMode: boolean;
}

export const applyCellColoring = ({
  colorMode,
  columnId,
  palette,
  colorMapping,
  rawValue,
  getCellColor,
  isDarkMode,
}: ApplyColoringArgs): React.CSSProperties | null => {
  // 'none'/'badge' have no cell/text style; 'progress' renders its own Meter colors.
  if (colorMode === 'none' || colorMode === 'badge' || colorMode === 'progress') return null;
  if (isEmptyValue(rawValue)) return null;

  const colorFn = getCellColor(columnId, palette, colorMapping);
  const paletteColor = colorFn(rawValue);
  const color =
    paletteColor && colorFn.contrastRoles
      ? getContrastRolesCellColor(
          paletteColor,
          colorFn.contrastRoles,
          colorMode === 'cell' ? 'fill' : 'text',
          isDarkMode
        )
      : paletteColor;
  if (!color) return null;

  const style: React.CSSProperties = {
    [colorMode === 'cell' ? 'backgroundColor' : 'color']: color,
  };

  if (colorMode === 'cell') {
    style.color = getContrastColor(color, isDarkMode);
  }

  return style;
};

// -----------------------------
// Cell renderers
// -----------------------------

export interface FormattedCellProps {
  content: ReactNode;
  alignment: Alignment;
  fitRowToContent?: boolean;
  isColored: boolean;
}

export const FormattedCell = ({
  content,
  alignment,
  fitRowToContent,
  isColored,
}: FormattedCellProps) => (
  <div
    data-test-subj="lnsTableCellContent"
    className={getCellClassName(alignment, fitRowToContent, isColored)}
  >
    {content}
  </div>
);

export interface LinkCellProps {
  content: ReactNode;
  linkColor?: string;
  onClick: () => void;
  alignment: Alignment;
  fitRowToContent?: boolean;
}

export const LinkCell = ({
  content,
  linkColor,
  onClick,
  alignment,
  fitRowToContent,
}: LinkCellProps) => (
  <div
    data-test-subj="lnsTableCellContent"
    className={getCellClassName(alignment, fitRowToContent)}
  >
    <EuiLink
      // Pin primary so these stay action-colored if EuiLink's default becomes `text`.
      color="primary"
      style={linkColor ? { color: linkColor } : undefined}
      onClick={onClick}
    >
      {content}
    </EuiLink>
  </div>
);

export interface BadgeCellProps {
  label: string;
  badgeColor: string | null;
  /** Set when the badge color comes from a contrast roles palette. */
  contrastRoles?: ContrastRolesColoring;
  isClickable: boolean;
  onClick: () => void;
  isDarkMode: boolean;
  alignment: Alignment;
  fitRowToContent?: boolean;
}

export const BadgeCell = ({
  label,
  badgeColor,
  contrastRoles,
  isClickable,
  onClick,
  isDarkMode,
  alignment,
  fitRowToContent,
}: BadgeCellProps) => {
  const cellClassName = getCellClassName(alignment, fitRowToContent);
  const roleColors =
    badgeColor && contrastRoles
      ? getContrastRolesBadgeColors(badgeColor, contrastRoles, isDarkMode)
      : undefined;
  const fill = roleColors?.fill ?? badgeColor;
  const badgeTextColor =
    roleColors?.text ?? (fill ? getContrastColor(fill, isDarkMode) : undefined);
  const clickProps = isClickable ? { onClick, onClickAriaLabel: getBadgeLabel(label) } : {};

  return (
    <div data-test-subj="lnsTableCellContent" className={cellClassName}>
      <EuiBadge
        data-test-subj="lnsTableCellContentBadge"
        color={fill ?? 'hollow'}
        style={badgeTextColor ? { color: badgeTextColor } : undefined}
        {...clickProps}
      >
        {label}
      </EuiBadge>
    </div>
  );
};
