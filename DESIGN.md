# FieldForge — Style Reference

The design system lives in `src/styles/` and is the only place a colour, size or radius is defined.

- `tokens.less` — every token, as a LESS variable and as a `--ff-*` CSS custom property on `:root`.
- `ant-theme.less` — themes Ant Design (ng-zorro) from those variables, so its buttons, inputs, selects and dialogs match.
- `base.less` — page defaults, focus ring, reduced motion.
- `components.less` — the `ff-*` classes templates compose.
- The canvas cannot use CSS variables, so `ThemeService` reads the same custom properties when it paints.

`npm run check:tokens` fails if a hex or `rgb()` literal appears outside `src/styles/` (and specs). Colour contrast of the
tokens is pinned by `theme.service.spec.ts`.

## Tokens — Colors

Role · value · token · where to use it. Contrast is against white (`--ff-surface`).

| Role                     | Value     | Token                                    | Use                                                                      |
| ------------------------ | --------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| App background           | `#f6f8fa` | `--ff-bg-app`                            | behind everything                                                        |
| Workspace                | `#dde2e8` | `--ff-bg-workspace`                      | the grey desk the PDF page lies on                                       |
| Surface                  | `#ffffff` | `--ff-surface`                           | panels, toolbar, inputs                                                  |
| Surface, subtle          | `#f6f8fa` | `--ff-surface-subtle`                    | panel headers, quiet chips                                               |
| Surface, hover           | `#eef1f4` | `--ff-surface-hover`                     | hover on a row or icon button                                            |
| PDF page                 | `#ffffff` | `--ff-page`                              | the page itself, in any theme                                            |
| Border                   | `#d8dee4` | `--ff-border`                            | dividers, outlines of options and chips                                  |
| Border, strong           | `#afb8c1` | `--ff-border-strong`                     | hover border                                                             |
| Text                     | `#1f2328` | `--ff-text`                              | body and headings (15.8:1)                                               |
| Text, muted              | `#59636e` | `--ff-text-muted`                        | labels, section titles, secondary info (6.1:1)                           |
| Text, subtle             | `#6e7781` | `--ff-text-subtle`                       | reserved for disabled-ish text (4.55:1); unused so far                   |
| Accent                   | `#1668dc` | `--ff-accent`                            | primary action, focus, **selection** (white on it 5.2:1)                 |
| Accent, strong           | `#1558c0` | `--ff-accent-strong`                     | text on the tint, hover                                                  |
| Accent, tint             | `#e8f1ff` | `--ff-accent-tint`                       | selected row, banner background                                          |
| Accent, border           | `#a9c7f5` | `--ff-accent-border`                     | banner border                                                            |
| Success / Warning        | `#1a7f37` / `#9a6700` | `--ff-success` / `--ff-warning` | status; unused so far                                                |
| Danger                   | `#cf222e` | `--ff-danger`                            | destructive actions, required asterisk, "Required" chip                  |
| Danger, tint             | `#ffebe9` | `--ff-danger-tint`                       | callout and chip background                                              |
| Field kind: text         | `#0072b2` | `--ff-field-text`                        | text, multiline, signer name, signer email (5.2:1)                       |
| Field kind: signature    | `#c2410c` | `--ff-field-signature`                   | signature, initials (5.2:1)                                              |
| Field kind: date         | `#7c3aed` | `--ff-field-date`                        | the three date presets (5.7:1)                                           |
| Field kind: choice       | `#0f766e` | `--ff-field-choice`                      | checkbox, radio (5.5:1)                                                  |

A field's kind comes from its preset (`FieldKind` in `field.model.ts`). Templates apply it with `ff-kind-<kind>`, which sets
`--kind`; the canvas gets the same colour from `ThemeService.canvas().kinds`.

## Tokens — Typography

- Sans: `--ff-font-sans` = system stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`). Everything.
- Mono: `--ff-font-mono` = `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`. JSON dialog, the coordinates drawn on the canvas.
- Scale: `--ff-text-xs` 12px (section labels, chips) · `--ff-text-sm` 13px (secondary, toolbar status) · `--ff-text-md` 14px (body, controls, panel titles)
  · `--ff-text-lg` 16px (brand) · `--ff-text-xl` 20px (empty-state title). Line height `--ff-line-height` 1.5.
- Weights: `--ff-weight-semibold` 600 for titles, labels, selected rows. `regular` 400 and `medium` 500 exist but are unused.
- Numbers that line up (coordinates, page count) use `font-variant-numeric: tabular-nums` (`.ff-numeric`).
- Canvas text: names 600 12px sans, recipient and grid labels 11px, coordinates 11px mono.

## Tokens — Spacing & Shapes

- Space (4px grid): `--ff-space-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 24 · `-6` 32 · `-7` 48.
- Radius: `--ff-radius-sm` 4 (icon buttons) · `--ff-radius-md` 6 (options, inputs via Ant, code block) · `--ff-radius-lg` 10 (unused). Chips are fully round.
- Borders: 1px `--ff-border` everywhere. Field outlines on the canvas are 1.5px, 2px when hovered or selected.
- Shadows: `--ff-shadow-page` (the PDF sheet) is the only one in use; `--ff-shadow-sm` and `--ff-shadow-md` are defined for popovers and unused.
- Focus: `--ff-focus-ring` (2px surface gap + 2px accent) on `.ff-option` and `.ff-icon-button`; everything else gets a 2px accent outline.
- Motion: `--ff-duration` 120ms, `--ff-ease` `cubic-bezier(0.2, 0, 0, 1)`, only for hover colour changes. `prefers-reduced-motion` turns it off.

## Components

Compose these; do not write component-level styles. Names follow `.ff-block`, `.ff-block__element`, `.ff-block--modifier`, state `.is-*`.

| Class                                                  | What it is                                                                                    |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `ff-app`, `ff-app__body`                               | full-height shell: toolbar, optional banner, then panels and workspace                        |
| `ff-toolbar` + `__brand`, `__group`, `__divider`, `__status`, `__select` | the top bar; scrolls sideways instead of clipping                              |
| `ff-banner` + `__text`                                 | one-line info strip under the toolbar (the armed field type)                                  |
| `ff-panel` `--left` / `--right` + `__header`, `__title`, `__tools`, `__body` | a sidebar: fixed width (`--ff-sidebar-left` 264, `-right` 300), scrolling body  |
| `ff-section` + `__label`                               | a labelled group inside a panel body; uppercase 12px muted label                              |
| `ff-stack`                                             | vertical list with 8px gaps                                                                   |
| `ff-option` (+ `--compact`, `.is-selected`)            | a selectable row; use a `<button type="button">` with `aria-pressed`. States: hover, focus ring, selected (accent tint + border) |
| `ff-option__icon`, `ff-option__label`                  | icon in the kind colour; label that truncates                                                 |
| `ff-kind-text` / `-signature` / `-date` / `-choice`    | sets `--kind` for everything inside                                                           |
| `ff-chip` (+ `--kind`, `--danger`)                     | small pill: neutral, kind-coloured (type tag), danger ("Required")                            |
| `ff-icon-button`                                       | 28px borderless button (close)                                                                |
| `ff-workspace`, `ff-page`, `ff-page__sheet`, `__pdf`, `__overlay` (`.is-drawing`) | the scrolling desk; the sheet is centred with auto margins; the overlay canvas sits exactly on the PDF canvas |
| `ff-empty` + `__title`, `__text`                       | centred empty state                                                                           |
| `ff-form`, `ff-form__item`, `ff-form__row`, `ff-label`, `ff-numeric` | stacked form, two-column row, muted label                                       |
| `ff-code-block`, `ff-callout` (`--danger`)             | dialog content (passed to ng-zorro as HTML, which strips inline styles)                       |
| `ff-text-muted`, `ff-visually-hidden`                  | utilities                                                                                     |

Ant Design components kept (themed, not restyled): `nz-button` (primary, default, danger), `nz-select`, `nz-input` / `nz-input-wrapper`,
`nz-checkbox`, `nz-tooltip`, and the modal dialogs. A primary button is the accent; one per screen region.

Canvas field states (`CanvasRendererService`): idle = kind-coloured 1.5px outline and a 12% tint; hover = 2px; selected = accent 2px
outline, white handles with accent border, coordinates below; while something is selected the other fields are drawn at 55% opacity.

## Layout

- Shell: toolbar (`--ff-toolbar-height` 56px) over a row of left panel (264), workspace (flexible), right panel (300). Panels collapse from the toolbar.
- The PDF sheet is centred with `margin: 0 auto` inside `ff-page` (32px padding); a page wider than the window scrolls from its left edge.
- Zoom is fixed at 150% (`RENDER_SCALE`); there are no breakpoints yet. Below about 1100px the toolbar scrolls and the canvas gets narrow.

## Do's and Don'ts

- Do read this file and `src/styles/tokens.less` before changing any UI.
- Do build screens from the classes above. If a pattern repeats, add a class to `components.less`; do not copy CSS into a component.
- Do add a new colour, size or radius as a token in `tokens.less` first (the LESS variable and its `--ff-*` line), then use it.
- Do use the accent only for the primary action, focus and selection. Never use it, or a lighter shade of it, as a field-kind colour.
- Do keep text at 4.5:1 and outlines at 3:1 against their background (`theme.service.spec.ts` checks the token pairs).
- Do use a real `<button>` for anything clickable, with a visible focus state and an accessible name for icon-only buttons.
- Don't write a hex, `rgb()` or `hsl()` literal outside `src/styles/` (the check fails the build).
- Don't use inline `style=""` for colour, spacing or type; it is also stripped from HTML passed to dialogs.
- Don't add colour-only meaning: pair a kind colour with its icon and label.
- Don't write component stylesheets (`styleUrls`); the global classes cover the app.

## Agent Prompt Guide

Read `DESIGN.md` first. Build UI from the `ff-*` classes in `src/styles/components.less`, and Ant Design components only for buttons, selects,
inputs, checkboxes, tooltips and dialogs. Never type a colour: use `var(--ff-*)` in LESS, `ff-kind-*` in templates, `ThemeService` in canvas
code. A new field type needs a `kind`; a new colour or size needs a token in `tokens.less`. Selection is the accent colour, field kinds are the
four `--ff-field-*` colours, and they must never swap roles. Run `npm run check` before finishing.

## Open questions

- **Tokens defined but unused:** `--ff-text-subtle`, `--ff-success`, `--ff-warning`, `--ff-weight-regular`, `--ff-weight-medium`, `--ff-radius-lg`,
  `--ff-radius-field`, `--ff-shadow-sm`, `--ff-shadow-md`. Suggest keeping success, warning and the shadows for the next dialogs and toasts, and
  deleting `--ff-radius-field` unless the canvas boxes get rounded corners.
- **Same value, two roles:** `--ff-bg-app` and `--ff-surface-subtle` are both `#f6f8fa`. Suggest keeping both so they can diverge (a dark theme will need that).
- **Ant Design leftovers:** about 15 uses of the old blue `#1890ff` remain inside ng-zorro's compiled CSS, for components this app does not use
  (progress, steps). They are not rendered. If one of those components is added, check its colour.
- **Colour-only meaning on the canvas:** the field outline colour is the only mark of a field's kind on the page. Suggest a small kind icon in
  the corner of each box (sidebar and chips already pair colour with an icon).
- **No dark theme and no breakpoints.** Tokens are structured for a dark override of `:root`; the Ant dark stylesheet and the canvas would need checking.
- **Field-kind colours were not run through a colour-blindness simulation.** They differ in hue and lightness and all pass 3:1, but they have not been tested.
- **Toolbar density:** about 15 controls in one row. A grouped File / View / Edit layout and a split export button are proposed, not built.
