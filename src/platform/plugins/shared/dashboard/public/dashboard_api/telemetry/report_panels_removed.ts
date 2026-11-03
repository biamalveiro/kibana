/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { METRIC_TYPE } from '@kbn/analytics';
import type { DashboardLayout } from '../layout_manager';
import { usageCollectionService } from '../../services/kibana_services';
import { DASHBOARD_UI_METRIC_ID } from '../../utils/telemetry_constants';

/**
 * Reports a `<panel_type>:panel_remove` counter for each grid panel in `prevLayout` that is missing from `nextLayout`.
 * Only call it for layout changes made by the grid itself (e.g. deleting a section with its panels);
 * removals through `removePanel` are reported by the Remove panel action.
 */
export const reportPanelsRemoved = (
  prevLayout: DashboardLayout,
  nextLayout: DashboardLayout
): void => {
  Object.entries(prevLayout.panels).forEach(([id, { type }]) => {
    if (nextLayout.panels[id]) return;
    usageCollectionService?.reportUiCounter(
      DASHBOARD_UI_METRIC_ID,
      METRIC_TYPE.CLICK,
      `${type}:panel_remove`
    );
  });
};
