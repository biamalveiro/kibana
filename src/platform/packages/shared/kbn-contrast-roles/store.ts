/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { BehaviorSubject, type Observable } from 'rxjs';
import { DEFAULT_PARAMS, type Params } from './src';

export interface ContrastRolesState {
  params: Params;
  /** High contrast's muted target, used instead of `params.lc.muted`: past base, as today's dark stacks pair /60 with /30. */
  highContrast: { muted: number };
}

export const DEFAULT_STATE: ContrastRolesState = {
  params: DEFAULT_PARAMS,
  highContrast: { muted: 73 }, // by eye, as in the workbench
};

const subject = new BehaviorSubject<ContrastRolesState>(DEFAULT_STATE);

/** Live contrast roles parameters for this page load. */
export const contrastRolesStore: {
  readonly state$: Observable<ContrastRolesState>;
  readonly get: () => ContrastRolesState;
  readonly set: (next: Partial<ContrastRolesState>) => void;
} = {
  state$: subject.asObservable(),
  get: () => subject.getValue(),
  set: (next) => subject.next({ ...subject.getValue(), ...next }),
};

/** High contrast's parameters: the state's, with muted at High contrast's target. */
export const highContrastParams = ({ params, highContrast }: ContrastRolesState): Params => ({
  ...params,
  lc: { ...params.lc, muted: highContrast.muted },
});
