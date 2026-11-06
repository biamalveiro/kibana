/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { useEuiTheme } from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { contrastRolesStore } from '@kbn/contrast-roles';
import { getPalettes } from '../palettes';
import { getLegacyKbnPalettes } from '../palettes/legacy';

export function useKbnPalettes() {
  const {
    euiTheme: { themeName },
    colorMode,
  } = useEuiTheme();
  // Re-render when the contrast roles parameters change.
  useObservable(contrastRolesStore.state$, contrastRolesStore.get());

  if (themeName === 'EUI_THEME_BOREALIS') {
    return getPalettes(colorMode === 'DARK');
  }

  return getLegacyKbnPalettes(colorMode === 'DARK');
}
