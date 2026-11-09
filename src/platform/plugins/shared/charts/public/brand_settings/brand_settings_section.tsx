/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useMemo, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiColorPaletteDisplay,
  EuiDescribedFormGroup,
  EuiFilePicker,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiImage,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { IUiSettingsClient } from '@kbn/core/public';
import type { RegistryComponentProps } from '@kbn/management-settings-section-registry';
import { contrastRolesStore, type BrandHueInput } from '@kbn/contrast-roles';
import {
  BRAND_HUES_SETTING,
  BRAND_LOGO_SETTING,
  BRAND_PALETTE_SETTING,
  MAX_BRAND_COLORS,
  MAX_BRAND_LOGO_SIZE_IN_KB,
} from '../../common';
import { ColorListEditor } from './color_list_editor';

export interface BrandSettingsSectionProps extends RegistryComponentProps {
  globalClient: IUiSettingsClient;
}

interface BrandSettings {
  brandColors: string[];
  hues: BrandHueInput[];
  logo: string | null;
}

const hexColorRegex = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
// SVG only: custom content panels can show the logo only as inline SVG markup.
const supportedLogoTypes = ['image/svg+xml'];

const readSettings = (globalClient: IUiSettingsClient): BrandSettings => ({
  brandColors: globalClient.get<string[]>(BRAND_PALETTE_SETTING, []),
  hues: globalClient.get<BrandHueInput[]>(BRAND_HUES_SETTING, []),
  logo: globalClient.get<string | null>(BRAND_LOGO_SETTING, null),
});

// The generator and its color naming data are large, so they load only when hues are generated.
const generateHues = async (brandColors: string[]): Promise<BrandHueInput[]> => {
  if (brandColors.length === 0) return [];
  const { generateBrand } = await import('@kbn/brand-hues');
  return generateBrand(brandColors, { params: contrastRolesStore.get().params }).hues;
};

const savedMessage = (hadPalette: boolean, hasPalette: boolean, colorsChanged: boolean) => {
  if (!hadPalette && hasPalette) {
    return i18n.translate('charts.brandSettings.paletteAdded', {
      defaultMessage: 'Brand palette added',
    });
  }
  if (hadPalette && !hasPalette) {
    return i18n.translate('charts.brandSettings.paletteRemoved', {
      defaultMessage: 'Brand palette removed',
    });
  }
  if (hasPalette && colorsChanged) {
    return i18n.translate('charts.brandSettings.paletteUpdated', {
      defaultMessage: 'Brand palette updated',
    });
  }
  return i18n.translate('charts.brandSettings.saved', {
    defaultMessage: 'Brand settings saved',
  });
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * Global settings section to manage the organization brand colors, palettes and logo.
 */
export const BrandSettingsSection = ({
  globalClient,
  toasts,
  enableSaving,
}: BrandSettingsSectionProps) => {
  const [saved, setSaved] = useState<BrandSettings>(() => readSettings(globalClient));
  const [draft, setDraft] = useState<BrandSettings>(saved);
  const [logoError, setLogoError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  const canSave = enableSaving.global;
  const isDirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const validBrandColors = useMemo(
    () => draft.brandColors.filter((color) => hexColorRegex.test(color)),
    [draft.brandColors]
  );
  const update = (changes: Partial<BrandSettings>) => setDraft({ ...draft, ...changes });

  const onLogoChange = async (files: FileList | null) => {
    const file = files?.[0];
    setLogoError(undefined);
    if (!file) return;

    if (!supportedLogoTypes.includes(file.type)) {
      setLogoError(
        i18n.translate('charts.brandSettings.logoTypeError', {
          defaultMessage: 'Use an SVG image.',
        })
      );
      return;
    }
    if (file.size > MAX_BRAND_LOGO_SIZE_IN_KB * 1024) {
      setLogoError(
        i18n.translate('charts.brandSettings.logoSizeError', {
          defaultMessage: 'The image must be smaller than {maxSize} KB.',
          values: { maxSize: MAX_BRAND_LOGO_SIZE_IN_KB },
        })
      );
      return;
    }
    update({ logo: await readFileAsDataUrl(file) });
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const colorsChanged = JSON.stringify(validBrandColors) !== JSON.stringify(saved.brandColors);
      const hues = colorsChanged ? await generateHues(validBrandColors) : saved.hues;
      const toSave: BrandSettings = { ...draft, brandColors: validBrandColors, hues };
      await Promise.all([
        globalClient.set(BRAND_PALETTE_SETTING, toSave.brandColors),
        globalClient.set(BRAND_HUES_SETTING, JSON.stringify(toSave.hues)),
        globalClient.set(BRAND_LOGO_SETTING, toSave.logo),
      ]);
      setSaved(toSave);
      setDraft(toSave);
      toasts.addSuccess(savedMessage(saved.hues.length > 0, hues.length > 0, colorsChanged));
    } catch (error) {
      toasts.addError(error, {
        title: i18n.translate('charts.brandSettings.saveError', {
          defaultMessage: 'Unable to save the brand settings',
        }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const disabled = !canSave || isSaving;

  return (
    <EuiPanel hasBorder paddingSize="l" data-test-subj="brandSettingsSection">
      <EuiTitle size="s">
        <h2>
          {i18n.translate('charts.brandSettings.title', {
            defaultMessage: 'Custom colors for dashboards',
          })}
        </h2>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        <p>
          {i18n.translate('charts.brandSettings.description', {
            defaultMessage:
              'Use your brand colors and logo across Kibana. The brand palettes are added next to the Elastic palettes, which stay the default.',
          })}
        </p>
      </EuiText>
      <EuiSpacer size="l" />

      <EuiDescribedFormGroup
        fullWidth
        title={
          <h4>
            {i18n.translate('charts.brandSettings.logoTitle', { defaultMessage: 'Brand logo' })}
          </h4>
        }
        description={i18n.translate('charts.brandSettings.logoDescription', {
          defaultMessage:
            'Shown in a banner at the top of dashboards and available to custom panels. Use an SVG image smaller than {maxSize} KB, ideally with a transparent background.',
          values: { maxSize: MAX_BRAND_LOGO_SIZE_IN_KB },
        })}
      >
        <EuiFormRow fullWidth isInvalid={Boolean(logoError)} error={logoError}>
          <>
            {draft.logo && (
              <>
                <EuiImage
                  src={draft.logo}
                  alt={i18n.translate('charts.brandSettings.logoAlt', {
                    defaultMessage: 'Brand logo',
                  })}
                  size="m"
                />
                <EuiSpacer size="s" />
              </>
            )}
            <EuiFilePicker
              accept={supportedLogoTypes.join(',')}
              display="default"
              disabled={disabled}
              onChange={onLogoChange}
              initialPromptText={
                draft.logo
                  ? i18n.translate('charts.brandSettings.replaceLogo', {
                      defaultMessage: 'Select or drag a new logo',
                    })
                  : i18n.translate('charts.brandSettings.uploadLogo', {
                      defaultMessage: 'Select or drag your logo',
                    })
              }
            />
            {draft.logo && (
              <EuiButtonEmpty
                size="xs"
                color="danger"
                iconType="trash"
                disabled={disabled}
                onClick={() => update({ logo: null })}
              >
                {i18n.translate('charts.brandSettings.removeLogo', {
                  defaultMessage: 'Remove logo',
                })}
              </EuiButtonEmpty>
            )}
          </>
        </EuiFormRow>
      </EuiDescribedFormGroup>

      <EuiDescribedFormGroup
        fullWidth
        title={
          <h4>
            {i18n.translate('charts.brandSettings.brandColorsTitle', {
              defaultMessage: 'Brand colors',
            })}
          </h4>
        }
        description={i18n.translate('charts.brandSettings.brandColorsDescription', {
          defaultMessage:
            'Up to six brand colors, main color first. Six brand hues are generated from them when you save, and the brand palettes are built from those hues. Leave empty for no brand palettes.',
        })}
      >
        <EuiFormRow fullWidth>
          <>
            {validBrandColors.length > 0 && (
              <>
                <EuiColorPaletteDisplay type="fixed" palette={validBrandColors} size="m" />
                <EuiSpacer size="s" />
              </>
            )}
            <ColorListEditor
              colors={draft.brandColors}
              maxColors={MAX_BRAND_COLORS}
              onChange={(brandColors) => update({ brandColors })}
              disabled={disabled}
            />
          </>
        </EuiFormRow>
      </EuiDescribedFormGroup>

      {saved.hues.length > 0 && (
        <EuiDescribedFormGroup
          fullWidth
          title={
            <h4>
              {i18n.translate('charts.brandSettings.huesTitle', {
                defaultMessage: 'Brand hues',
              })}
            </h4>
          }
          description={i18n.translate('charts.brandSettings.huesDescription', {
            defaultMessage:
              'Generated from the saved brand colors. The Brand low contrast, Brand high contrast and Brand (faint) palettes use them in both light and dark mode.',
          })}
        >
          <EuiFormRow fullWidth>
            <EuiColorPaletteDisplay
              type="fixed"
              palette={saved.hues.map(({ base }) => base)}
              size="m"
            />
          </EuiFormRow>
        </EuiDescribedFormGroup>
      )}

      <EuiSpacer size="m" />
      <EuiFlexGroup justifyContent="flexEnd" gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty disabled={!isDirty || isSaving} onClick={() => setDraft(saved)}>
            {i18n.translate('charts.brandSettings.cancel', { defaultMessage: 'Cancel' })}
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            isLoading={isSaving}
            disabled={!isDirty || !canSave}
            onClick={save}
            data-test-subj="brandSettingsSave"
          >
            {i18n.translate('charts.brandSettings.save', { defaultMessage: 'Save brand settings' })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
