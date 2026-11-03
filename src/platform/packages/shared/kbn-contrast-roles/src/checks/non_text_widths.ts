/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// How much contrast a non-text mark needs for its width: Myndex's draft minimums, SAPC-APCA discussion #117
// (comment 9244796, 2024-04-27; the tables are images there, transcribed here).

export type ElementKind = 'semantic' | 'nonSemantic';

// [Lc, minimum element width in px]. Semantic: marks that carry meaning (bars, lines, points, icons).
// Non-semantic: dividers and decoration, relaxed. Rows below Lc 15 are marked not recommended.
// prettier-ignore
export const NON_TEXT: Record<ElementKind, [number, number][]> = {
  semantic: [[15, 15], [20, 10], [25, 7], [30, 5.5], [35, 4.4], [40, 3.65], [45, 3], [50, 2.67], [55, 2.33], [60, 2], [65, 1.8], [70, 1.66], [75, 1.5], [80, 1.4], [85, 1.26], [90, 1]],
  nonSemantic: [[15, 5], [20, 4], [25, 3.5], [30, 3], [35, 2.5], [40, 2.2], [45, 2], [50, 1.8], [55, 1.6], [60, 1.5], [65, 1.3], [70, 1.2], [75, 1.1], [80, 1], [90, 0.9]],
};

// Minimum |Lc| for an element `width` px wide: the lowest Lc whose minimum width fits.
export function requiredLc(kind: ElementKind, width: number): number | null {
  const row = NON_TEXT[kind].find(([, w]) => width >= w);
  return row ? row[0] : null; // null: thinner than the table covers
}
