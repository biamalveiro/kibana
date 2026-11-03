/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { DashboardLayout } from '../layout_manager';
import { usageCollectionService } from '../../services/kibana_services';
import { reportPanelsRemoved } from './report_panels_removed';

const prevLayout: DashboardLayout = {
  panels: {
    panel1: { type: 'lens', grid: { x: 0, y: 0, w: 12, h: 8 } },
    panel2: { type: 'search', grid: { x: 0, y: 0, w: 12, h: 8, sectionId: 'section1' } },
    panel3: { type: 'lens', grid: { x: 12, y: 0, w: 12, h: 8, sectionId: 'section1' } },
  },
  sections: { section1: { title: 'Section', collapsed: false, grid: { y: 8 } } },
  pinnedPanels: {},
};

describe('reportPanelsRemoved', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports a panel_remove counter for each removed panel', () => {
    reportPanelsRemoved(prevLayout, {
      panels: { panel1: prevLayout.panels.panel1 },
      sections: {},
      pinnedPanels: {},
    });

    expect(usageCollectionService?.reportUiCounter).toHaveBeenCalledTimes(2);
    expect(usageCollectionService?.reportUiCounter).toHaveBeenCalledWith(
      'dashboard',
      'click',
      'search:panel_remove'
    );
    expect(usageCollectionService?.reportUiCounter).toHaveBeenCalledWith(
      'dashboard',
      'click',
      'lens:panel_remove'
    );
  });

  it('does not report panels that were moved', () => {
    reportPanelsRemoved(prevLayout, {
      panels: {
        panel1: prevLayout.panels.panel1,
        panel2: { type: 'search', grid: { x: 0, y: 8, w: 12, h: 8 } },
        panel3: { type: 'lens', grid: { x: 12, y: 8, w: 12, h: 8 } },
      },
      sections: {},
      pinnedPanels: {},
    });

    expect(usageCollectionService?.reportUiCounter).not.toHaveBeenCalled();
  });
});
