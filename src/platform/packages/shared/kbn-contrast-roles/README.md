# @kbn/contrast-roles

Experimental: chart colors as a hue plus a role (faint, muted, base, strong, ink), resolved against the surface they
are drawn on. Not for merging as is.

- `src/`: the algorithm, a copy of `src/contrast-roles` from the vis-color-workbench repo (its `README.md` has the
  API), changed only by Kibana's lint fixes (license header, Prettier, `interface` over `type`) and snake_case
  filenames (`contrast_roles.ts`, `hue_correction.ts`, `checks/non_text_widths.ts`, `checks/pair_difference.ts`).
- `borealis.ts`: the Borealis input (surfaces and hue anchors from `@elastic/eui-theme-borealis`).
- `store.ts`: live state (`enabled`, `params`) for the page load.
- `palettes.ts`: `themeAware(mode)`, the palettes Kibana's existing palette IDs switch to.
