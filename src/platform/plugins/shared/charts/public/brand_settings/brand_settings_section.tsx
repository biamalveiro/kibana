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
  EuiButtonIcon,
  EuiColorPaletteDisplay,
  EuiDescribedFormGroup,
  EuiFilePicker,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiImage,
  EuiPanel,
  EuiRange,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { IUiSettingsClient } from '@kbn/core/public';
import type { RegistryComponentProps } from '@kbn/management-settings-section-registry';
import { brandPreview, type BrandHueInput } from '@kbn/contrast-roles';
import type { Extracted } from '@kbn/brand-hues';
import {
  BRAND_BAND_RANGE,
  BRAND_GENERATOR_SETTING,
  BRAND_HUES_SETTING,
  BRAND_LOGO_SETTING,
  BRAND_PALETTE_SETTING,
  DEFAULT_BRAND_GENERATOR,
  MAX_BRAND_COLORS,
  MAX_BRAND_LOGO_SIZE_IN_KB,
  MAX_BRAND_SHUFFLE,
  type BrandGeneratorOptions,
} from '../../common';
import { ColorListEditor } from './color_list_editor';
import { extractImageColors, useGeneratedBrand } from './brand_generator';
export interface BrandSettingsSectionProps extends RegistryComponentProps {
  globalClient: IUiSettingsClient;
}

interface BrandSettings {
  brandColors: string[];
  generator: BrandGeneratorOptions;
  logo: string | null;
}

interface SavedBrandSettings extends BrandSettings {
  hues: BrandHueInput[];
}

interface ImageColors {
  src: string;
  extracted: Extracted[];
}

const hexColorRegex = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
// SVG only: custom content panels can show the logo only as inline SVG markup.
const supportedLogoTypes = ['image/svg+xml'];

const readSettings = (globalClient: IUiSettingsClient): SavedBrandSettings => ({
  brandColors: globalClient.get<string[]>(BRAND_PALETTE_SETTING, []),
  hues: globalClient.get<BrandHueInput[]>(BRAND_HUES_SETTING, []),
  generator: {
    ...DEFAULT_BRAND_GENERATOR,
    ...globalClient.get<Partial<BrandGeneratorOptions>>(BRAND_GENERATOR_SETTING, {}),
  },
  logo: globalClient.get<string | null>(BRAND_LOGO_SETTING, null),
});

const toDraft = ({ brandColors, generator, logo }: SavedBrandSettings): BrandSettings => ({
  brandColors,
  generator,
  logo,
});

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

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

// The slider shows closeness, the reverse of the band: a lower minimum contrast keeps the brand colors closer.
const toCloseness = (value: number) => BRAND_BAND_RANGE.min + BRAND_BAND_RANGE.max - value;

const shuffleLabel = i18n.translate('charts.brandSettings.shuffle', {
  defaultMessage: 'Shuffle colors',
});

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * Global settings section to manage the organization brand colors, hues and logo.
 */
export const BrandSettingsSection = ({
  globalClient,
  toasts,
  enableSaving,
}: BrandSettingsSectionProps) => {
  const [saved, setSaved] = useState<SavedBrandSettings>(() => readSettings(globalClient));
  const [draft, setDraft] = useState<BrandSettings>(() => toDraft(saved));
  const [logoError, setLogoError] = useState<string>();
  const [image, setImage] = useState<ImageColors>();
  const [imageError, setImageError] = useState<string>();
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { colorMode } = useEuiTheme();
  const canSave = enableSaving.global;
  const isDirty = !same(toDraft(saved), draft);
  const validBrandColors = useMemo(
    () => draft.brandColors.filter((color) => hexColorRegex.test(color)),
    [draft.brandColors]
  );
  const update = (changes: Partial<BrandSettings>) => setDraft({ ...draft, ...changes });
  const updateGenerator = (changes: Partial<BrandGeneratorOptions>) =>
    update({ generator: { ...draft.generator, ...changes } });

  const {
    generated,
    isGenerating,
    error: generateError,
  } = useGeneratedBrand(validBrandColors, draft.generator);
  // Saved hues stay as they are until the colors or options change.
  const huesChanged =
    !same(validBrandColors, saved.brandColors) || !same(draft.generator, saved.generator);
  const hues = useMemo(() => {
    if (validBrandColors.length === 0) return [];
    return huesChanged ? generated?.hues ?? [] : saved.hues;
  }, [validBrandColors, huesChanged, generated, saved.hues]);

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

  const readImageColors = async (src: string) => {
    setImageError(undefined);
    setIsReadingImage(true);
    try {
      const extracted = await extractImageColors(src);
      setImage({ src, extracted });
      update({ brandColors: extracted.map(({ hex }) => hex) });
      if (!extracted[0]?.share) {
        setImageError(
          i18n.translate('charts.brandSettings.imageNoColors', {
            defaultMessage:
              'No colored areas found: the image is all greys, so using Borealis teal.',
          })
        );
      }
    } catch {
      setImageError(
        i18n.translate('charts.brandSettings.imageReadError', {
          defaultMessage: 'Unable to read the image.',
        })
      );
    } finally {
      setIsReadingImage(false);
    }
  };

  const onImageChange = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError(
        i18n.translate('charts.brandSettings.imageTypeError', {
          defaultMessage: 'Use an image file.',
        })
      );
      return;
    }
    await readImageColors(await readFileAsDataUrl(file));
  };

  const cancel = () => {
    setDraft(toDraft(saved));
    setImage(undefined);
    setImageError(undefined);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const toSave: SavedBrandSettings = { ...draft, brandColors: validBrandColors, hues };
      await Promise.all([
        globalClient.set(BRAND_PALETTE_SETTING, toSave.brandColors),
        globalClient.set(BRAND_HUES_SETTING, JSON.stringify(toSave.hues)),
        globalClient.set(BRAND_GENERATOR_SETTING, JSON.stringify(toSave.generator)),
        globalClient.set(BRAND_LOGO_SETTING, toSave.logo),
      ]);
      setSaved(toSave);
      setDraft(toDraft(toSave));
      setImage(undefined);
      toasts.addSuccess(savedMessage(saved.hues.length > 0, hues.length > 0, huesChanged));
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

  const previewColors = useMemo(
    () =>
      hues.length > 0
        ? brandPreview(hues, colorMode === 'DARK' ? 'dark' : 'light').lowContrast
        : [],
    [hues, colorMode]
  );

  const disabled = !canSave || isSaving;
  const isWaitingForHues =
    huesChanged && validBrandColors.length > 0 && (isGenerating || !generated);
  const ignored = generated && huesChanged ? generated.ignored : [];
  const warnings = generated && huesChanged ? generated.warnings : [];

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
            'Up to six colors, main color first. You can also pick them from an image.',
        })}
      >
        <>
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
          <EuiFormRow fullWidth isInvalid={Boolean(imageError)} error={imageError}>
            <>
              <EuiFilePicker
                accept="image/*"
                display="default"
                compressed
                disabled={disabled}
                isLoading={isReadingImage}
                onChange={onImageChange}
                initialPromptText={i18n.translate('charts.brandSettings.uploadImage', {
                  defaultMessage: 'Select or drag an image',
                })}
              />
              <EuiButtonEmpty
                size="xs"
                iconType="image"
                disabled={disabled || isReadingImage || !draft.logo}
                onClick={() => draft.logo && readImageColors(draft.logo)}
              >
                {i18n.translate('charts.brandSettings.useLogo', {
                  defaultMessage: 'Use the brand logo',
                })}
              </EuiButtonEmpty>
              {image && (
                <EuiFlexGroup gutterSize="m" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiImage
                      src={image.src}
                      alt={i18n.translate('charts.brandSettings.imageAlt', {
                        defaultMessage: 'Image the brand colors come from',
                      })}
                      size={64}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="xs" color="subdued">
                      {i18n.translate('charts.brandSettings.imageExtracted', {
                        defaultMessage: 'Main colors, by share of the colored area: {colors}',
                        values: {
                          colors: image.extracted
                            .map(({ hex, share }) => `${hex} ${Math.round(share * 100)}%`)
                            .join(', '),
                        },
                      })}
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              )}
            </>
          </EuiFormRow>
          {(ignored.length > 0 || warnings.length > 0) && (
            <EuiText size="xs">
              {ignored.length > 0 && (
                <p>
                  {i18n.translate('charts.brandSettings.ignored', {
                    defaultMessage: 'Not used: {colors}',
                    values: {
                      colors: ignored.map(({ input, reason }) => `${input} (${reason})`).join(', '),
                    },
                  })}
                </p>
              )}
              {warnings.map(({ seeds: [first, second], vision }) => (
                <p key={`${first}-${second}-${vision}`}>
                  {i18n.translate('charts.brandSettings.lookAlike', {
                    defaultMessage:
                      '{first} and {second} look alike with {vision}. Label these series directly, or change one of the colors.',
                    values: { first, second, vision },
                  })}
                </p>
              ))}
            </EuiText>
          )}
        </>
      </EuiDescribedFormGroup>

      {validBrandColors.length > 0 && (
        <EuiDescribedFormGroup
          fullWidth
          title={
            <h4>
              {i18n.translate('charts.brandSettings.palettesTitle', {
                defaultMessage: 'Data visualization palette',
              })}
            </h4>
          }
          description={i18n.translate('charts.brandSettings.palettesDescription', {
            defaultMessage: 'Generated from your brand colors.',
          })}
        >
          <>
            <EuiFormRow fullWidth isInvalid={Boolean(generateError)} error={generateError?.message}>
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                <EuiFlexItem>
                  {previewColors.length > 0 && (
                    <EuiColorPaletteDisplay type="fixed" palette={previewColors} size="m" />
                  )}
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiToolTip content={shuffleLabel} disableScreenReaderOutput>
                    <EuiButtonIcon
                      iconType="refresh"
                      display="base"
                      isLoading={isGenerating}
                      disabled={disabled}
                      aria-label={shuffleLabel}
                      onClick={() =>
                        updateGenerator({
                          shuffle: 1 + Math.floor(Math.random() * MAX_BRAND_SHUFFLE),
                        })
                      }
                    />
                  </EuiToolTip>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFormRow>
            <EuiFormRow
              fullWidth
              label={i18n.translate('charts.brandSettings.closenessLabel', {
                defaultMessage: 'Brand color match',
              })}
              helpText={i18n.translate('charts.brandSettings.closenessHelp', {
                defaultMessage:
                  'Higher keeps your brand colors as they are. Lower brings them closer to the Elastic palette.',
              })}
            >
              <EuiRange
                {...BRAND_BAND_RANGE}
                step={1}
                value={toCloseness(draft.generator.band)}
                onChange={(event) =>
                  updateGenerator({ band: toCloseness(Number(event.currentTarget.value)) })
                }
                compressed
                disabled={disabled}
              />
            </EuiFormRow>
          </>
        </EuiDescribedFormGroup>
      )}

      <EuiSpacer size="m" />
      <EuiFlexGroup justifyContent="flexEnd" gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty disabled={!isDirty || isSaving} onClick={cancel}>
            {i18n.translate('charts.brandSettings.cancel', { defaultMessage: 'Cancel' })}
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            isLoading={isSaving}
            disabled={!isDirty || !canSave || isWaitingForHues}
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
