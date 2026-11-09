# @kbn/brand-hues

Experimental: six hues from a logo or a few brand hexes, for `@kbn/contrast-roles` to resolve. Not for merging as is.

- `src/`: a copy of `src/brand-hues` from the vis-color-workbench repo (its `README.md` and `docs/hue-generation.md`
  have the API and the method), changed only by Kibana's lint fixes (license header, Prettier, `interface` over `type`),
  snake_case filenames (`c3/c3_data.json`) and importing the color helpers from `@kbn/contrast-roles`.
- `src/c3`: Heer & Stone's c3 color naming data, trimmed by the workbench's `scripts/trim-c3.ts`, under its own license.

A separate package from `@kbn/contrast-roles` because `c3_data.json` is about 450 KB: `@kbn/contrast-roles` is a UI
shared dependency loaded on every page, while this package is only for generating hues, so load it lazily.

```ts
import { generateHues, readSeeds, toHueInputs, BAND_LC } from '@kbn/brand-hues';
import { createContrastRoles, DEFAULT_PARAMS } from '@kbn/contrast-roles';

// Or from an image: readSeeds(extractSeeds(imageData.data, 4, fallbackHex).map(({ hex }) => hex))
const { seeds } = readSeeds(['#0B64DD', '#FEC514']);
const { hues } = generateHues(seeds, { surfaces, params: DEFAULT_PARAMS, pull: 0.7, band: BAND_LC, status });
const roles = createContrastRoles({ surfaces, hues: toHueInputs(hues) });
```
