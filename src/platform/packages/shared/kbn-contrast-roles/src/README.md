# Contrast roles

Every chart color is a hue plus a role, resolved against the surface it's drawn on.

```ts
import { createContrastRoles, DEFAULT_PARAMS } from './contrast-roles';

const borealis = createContrastRoles({
  surfaces: { light: '#FFFFFF', dark: '#111C2C' }, // each mode's far end is the other mode's surface
  hues: [{ name: 'blue', base: '#61A2FF' } /* ... */], // base: the hue's anchor color (e.g. EUI's /60)
  neutralTint: '#F6F9FC', // diverging middle on a surface with no hue
});

const light = borealis.palettes('#FFFFFF', DEFAULT_PARAMS);
light.roles; // [{ name, faint, muted, base, strong, ink }]
light.intertwined; // stacked bars: base, muted per hue
light.lines; // every base, then every strong
light.sequential('blue', 5);
light.diverging('blue', 'red', 5);
```

## Files, in reading order

| File | What it does |
|---|---|
| `types.ts` | Theme (input), Params (tunables), roles, palettes (output) |
| `defaults.ts` | Default parameters and where each value comes from |
| `contrast_roles.ts` | `createContrastRoles`: base per hue, one color per target, every palette on a surface |
| `solve.ts` | The lightness where a hue reaches an APCA Lc target (bisection, as apcach does) |
| `hue_correction.ts` | Each hue's shift from its plain contrast lightness, and how it fades across roles |
| `chroma.ts` | How colorful each role is: cap and taper, or one chroma across hues |
| `palettes.ts` | The lists a product needs: roles, stacked pairs, lines, sequential and diverging ramps |
| `color.ts` | OKLCH and gamut (culori), WCAG contrast (culori) and APCA Lc (colorjs.io) |
| `checks/` | Evaluation, not generation: APCA minimum widths for marks, and the size-based pair difference |

The reasoning and sources are in `docs/context.md` and `docs/research.md` at the repo root.
