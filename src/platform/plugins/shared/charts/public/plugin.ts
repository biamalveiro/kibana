/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { Subscription, filter } from 'rxjs';
import type { Plugin, CoreSetup, IUiSettingsClient } from '@kbn/core/public';
import type { ExpressionsSetup } from '@kbn/expressions-plugin/public';
import type { AdvancedSettingsSetup } from '@kbn/advanced-settings-plugin/public';
import { contrastRolesStore, type BrandHueInput } from '@kbn/contrast-roles';
import { palette, systemPalette, BRAND_HUES_SETTING } from '../common';

import { ThemeService } from './services';
import { PaletteService } from './services/palettes/service';
import { ActiveCursor } from './services/active_cursor';
import { registerBrandSettingsSection } from './brand_settings';

const loadBrandHues = (globalClient: IUiSettingsClient) => {
  const hues = globalClient.get<BrandHueInput[]>(BRAND_HUES_SETTING, []);
  contrastRolesStore.set({ brand: hues.length > 0 ? hues : undefined });
};

interface SetupDependencies {
  expressions: ExpressionsSetup;
  advancedSettings?: AdvancedSettingsSetup;
}

/** @public */
export interface ChartsPluginSetup {
  theme: Omit<ThemeService, 'init'>;
  palettes: ReturnType<PaletteService['setup']>;
}

/** @public */
export type ChartsPluginStart = ChartsPluginSetup & {
  activeCursor: ActiveCursor;
};

/** @public */
export class ChartsPlugin implements Plugin<ChartsPluginSetup, ChartsPluginStart> {
  private readonly themeService = new ThemeService();
  private readonly paletteService = new PaletteService();
  private readonly activeCursor = new ActiveCursor();

  private readonly subscriptions = new Subscription();

  private palettes: undefined | ReturnType<PaletteService['setup']>;

  public setup(core: CoreSetup, dependencies: SetupDependencies): ChartsPluginSetup {
    dependencies.expressions.registerFunction(palette);
    dependencies.expressions.registerFunction(systemPalette);
    const { globalClient } = core.settings;
    // The brand hues are loaded before any palette is built, and again whenever they are saved, so
    // charts get the brand palettes without a page reload.
    loadBrandHues(globalClient);
    this.subscriptions.add(
      globalClient
        .getUpdate$()
        .pipe(filter(({ key }) => key === BRAND_HUES_SETTING))
        .subscribe(() => loadBrandHues(globalClient))
    );
    if (dependencies.advancedSettings) {
      registerBrandSettingsSection(dependencies.advancedSettings, globalClient);
    }
    this.themeService.init(core.theme);
    this.palettes = this.paletteService.setup(core.theme.theme$);
    this.activeCursor.setup();

    return {
      theme: this.themeService,
      palettes: this.palettes,
    };
  }

  public start(): ChartsPluginStart {
    return {
      theme: this.themeService,
      palettes: this.palettes!,
      activeCursor: this.activeCursor,
    };
  }

  public stop() {
    this.subscriptions.unsubscribe();
  }
}
