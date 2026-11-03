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
  enabled: boolean;
  params: Params;
}

export const DEFAULT_STATE: ContrastRolesState = { enabled: true, params: DEFAULT_PARAMS };

const subject = new BehaviorSubject<ContrastRolesState>(DEFAULT_STATE);

/** Live contrast roles state (on/off and parameters) for this page load. */
export const contrastRolesStore: {
  readonly state$: Observable<ContrastRolesState>;
  readonly get: () => ContrastRolesState;
  readonly set: (next: Partial<ContrastRolesState>) => void;
} = {
  state$: subject.asObservable(),
  get: () => subject.getValue(),
  set: (next) => subject.next({ ...subject.getValue(), ...next }),
};
