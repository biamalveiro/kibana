# @kbn/contrast-roles

Experimental: chart colors as a hue plus a role (faint, muted, base, strong, ink), resolved against the surface they
are drawn on. Not for merging as is.

- `src/`: the algorithm, a copy of `src/contrast-roles` from the vis-color-workbench repo (its `README.md` has the
  API), changed only by Kibana's lint fixes (license header, Prettier, `interface` over `type`) and snake_case
  filenames (`contrast_roles.ts`).
- `borealis.ts`: the Borealis input (surfaces and hue anchors from `@elastic/eui-theme-borealis`).
- `store.ts`: live state for the page load: `params` (role Lc targets, taper, line order) and `highContrast.muted`,
  tuned from the developer toolbar.
- `palettes.ts`: the palettes Kibana registers on top of this package:
  - `revised(n)`: static, always the light-mode stack pairs (base + muted).
  - `themeAware(mode)`: Low contrast (the workbench's dynamic stack pairs), High contrast (pairs with muted at
    `highContrast.muted`, also for lines), Elastic faint, and the theme aware
    gradients (registered next to EUI's originals, which stay unchanged).
  - `categoricalForTable` / `rampForTable`: table cell colors (faint for backgrounds, strong for text).
