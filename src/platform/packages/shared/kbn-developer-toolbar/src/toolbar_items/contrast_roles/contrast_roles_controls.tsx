/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useState } from 'react';
import { css } from '@emotion/react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPopover,
  EuiPopoverTitle,
  EuiRange,
  EuiSpacer,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { DEFAULT_PARAMS, contrastRolesStore, type Params } from '@kbn/contrast-roles';

type Group = keyof Params;
type NumericKey<G extends Group> = {
  [K in keyof Params[G]]: Params[G][K] extends number ? K : never;
}[keyof Params[G]];
type NumericPath = { [G in Group]: [G, NumericKey<G>] }[Group];

interface Slider {
  path: NumericPath;
  label: string;
  min: number;
  max: number;
  step?: number;
  disabled?: (params: Params) => boolean;
}

interface Toggle {
  label: string;
  value: (params: Params) => string;
  options: Array<{ id: string; label: string }>;
  set: (params: Params, id: string) => Params;
}

interface ParamGroup {
  title: string;
  toggle?: Toggle;
  sliders: Slider[];
}

const anchored = ({ base }: Params) => base.from === 'anchor';
const even = ({ chroma }: Params) => chroma.mode === 'even';

// The workbench's parameter groups and ranges (vis-color-workbench src/lib/workbench.ts), without Reverse.
const PARAM_GROUPS: ParamGroup[] = [
  {
    title: 'Faint · fill',
    sliders: [{ path: ['lc', 'faint'], label: 'Lc on surface', min: 8, max: 40 }],
  },
  {
    title: 'Muted · stack second tier',
    sliders: [{ path: ['lc', 'muted'], label: 'Lc on surface', min: 8, max: 50 }],
  },
  {
    title: 'Base · mark',
    toggle: {
      label: 'Base from',
      value: ({ base }) => base.from,
      options: [
        { id: 'anchor', label: 'EUI /60' },
        { id: 'model', label: 'Modelled' },
      ],
      set: (params, id) => ({
        ...params,
        base: { ...params.base, from: id === 'model' ? 'model' : 'anchor' },
      }),
    },
    sliders: [
      { path: ['lc', 'base'], label: 'Lc on surface', min: 30, max: 75 },
      {
        path: ['base', 'cuspPull'],
        label: 'Modelled lift for light-cusp hues',
        min: 0,
        max: 0.8,
        step: 0.01,
        disabled: anchored,
      },
      {
        path: ['base', 'cuspRef'],
        label: 'Lift hues with cusp L above',
        min: 0.5,
        max: 0.9,
        step: 0.01,
        disabled: anchored,
      },
      { path: ['chroma', 'ceiling'], label: 'Chroma ceiling', min: 0.08, max: 0.3, step: 0.005 },
    ],
  },
  {
    title: 'Strong · lines 7-12',
    sliders: [{ path: ['lc', 'strong'], label: 'Lc on surface', min: 50, max: 100 }],
  },
  {
    title: 'Ink · text on faint',
    sliders: [{ path: ['lc', 'ink'], label: 'Lc on faint', min: 45, max: 90 }],
  },
  {
    title: 'Chroma · faint, muted, strong, ink, ramps',
    toggle: {
      label: 'Chroma mode',
      value: ({ chroma }) => chroma.mode,
      options: [
        { id: 'cap', label: 'Cap and taper' },
        { id: 'even', label: 'Even across hues' },
      ],
      set: (params, id) => ({
        ...params,
        chroma: { ...params.chroma, mode: id === 'even' ? 'even' : 'cap' },
      }),
    },
    sliders: [
      {
        path: ['chroma', 'taper'],
        label: 'Taper, lighter than base',
        min: 0,
        max: 2,
        step: 0.01,
        disabled: even,
      },
      {
        path: ['chroma', 'taperDark'],
        label: 'Taper, darker than base',
        min: 0,
        max: 2,
        step: 0.01,
        disabled: even,
      },
    ],
  },
  {
    title: 'Ramps · sequential and diverging',
    sliders: [
      { path: ['ramp', 'from'], label: 'Start Lc', min: 8, max: 40 },
      { path: ['ramp', 'to'], label: 'End Lc', min: 20, max: 90 },
    ],
  },
];

const getParam = (params: Params, [group, key]: NumericPath): number =>
  (params[group] as Record<string, number>)[key];

const setParam = (params: Params, [group, key]: NumericPath, value: number): Params => ({
  ...params,
  [group]: { ...params[group], [key]: value },
});

const PARAMS_TITLE = 'Contrast roles parameters';

const panelStyles = css`
  width: 320px;
  max-height: 60vh;
  overflow-y: auto;
`;

const ParamsPanel = ({ params }: { params: Params }) => {
  const update = (next: Params) => contrastRolesStore.set({ params: next });
  return (
    <div css={panelStyles}>
      {PARAM_GROUPS.map(({ title, toggle, sliders }) => (
        <React.Fragment key={title}>
          <EuiTitle size="xxs">
            <h4>{title}</h4>
          </EuiTitle>
          <EuiSpacer size="xs" />
          {toggle && (
            <EuiFormRow label={toggle.label} display="rowCompressed">
              <EuiButtonGroup
                legend={toggle.label}
                buttonSize="compressed"
                isFullWidth
                options={toggle.options}
                idSelected={toggle.value(params)}
                onChange={(id) => update(toggle.set(params, id))}
              />
            </EuiFormRow>
          )}
          {sliders.map((slider) => (
            <EuiFormRow
              key={slider.path.join('.')}
              label={slider.label}
              display="rowCompressed"
              isDisabled={slider.disabled?.(params)}
            >
              <EuiRange
                compressed
                min={slider.min}
                max={slider.max}
                step={slider.step ?? 1}
                value={getParam(params, slider.path)}
                disabled={slider.disabled?.(params)}
                showInput
                onChange={({ currentTarget }) =>
                  update(setParam(params, slider.path, Number(currentTarget.value)))
                }
              />
            </EuiFormRow>
          ))}
          <EuiSpacer size="m" />
        </React.Fragment>
      ))}
    </div>
  );
};

/** Developer toolbar item: the contrast roles before/after switch and its parameters. */
export const ContrastRolesControls = () => {
  const { enabled, params } = useObservable(contrastRolesStore.state$, contrastRolesStore.get());
  const [isOpen, setIsOpen] = useState(false);

  return (
    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
      <EuiFlexItem grow={false}>
        <EuiToolTip content="Click to switch chart colors between contrast roles and EUI's palettes.">
          <EuiBadge
            color={enabled ? 'success' : 'default'}
            iconType="palette"
            iconSide="left"
            onClick={() => contrastRolesStore.set({ enabled: !enabled })}
            onClickAriaLabel="Toggle contrast roles"
          >
            {enabled ? 'Contrast roles' : 'EUI colors'}
          </EuiBadge>
        </EuiToolTip>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiPopover
          aria-label={PARAMS_TITLE}
          isOpen={isOpen}
          closePopover={() => setIsOpen(false)}
          anchorPosition="upCenter"
          button={
            <EuiToolTip content={PARAMS_TITLE} disableScreenReaderOutput>
              <EuiButtonIcon
                iconType="controls"
                size="xs"
                color="text"
                aria-label={PARAMS_TITLE}
                onClick={() => setIsOpen(!isOpen)}
              />
            </EuiToolTip>
          }
        >
          <EuiPopoverTitle paddingSize="s">
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>{PARAMS_TITLE}</EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="xs"
                  onClick={() => contrastRolesStore.set({ params: DEFAULT_PARAMS })}
                >
                  Reset to defaults
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPopoverTitle>
          <ParamsPanel params={params} />
        </EuiPopover>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
