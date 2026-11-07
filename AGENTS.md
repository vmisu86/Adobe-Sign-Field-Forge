# FieldForge — working agreement

A client-side visual PDF field mapper for Adobe Sign (repo `Adobe-Sign-Field-Forge`, npm name `pdf-field-mapper`, live at
https://pdfmapper.misu-varga.com/). The user opens a PDF, draws form fields on it, edits their properties, and exports JSON. Angular 20 +
ng-zorro-antd 20 + PDF.js 5.3.31. **There is no backend**: everything runs in the browser and nothing is sent anywhere. There is no
`HttpClient` and no router on purpose.

Product intent and constraints are in `PRODUCT.md`; how the UI looks (tokens, classes, rules) is in `DESIGN.md`. This file is the engineering
contract; `CLAUDE.md` imports it. **Read `DESIGN.md` before changing any UI.**

## Commands

| Task                              | Command                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| Install                           | `npm install` (CI-style: `npm ci`)                                                 |
| Dev server                        | `npm start` → http://localhost:4200/                                               |
| Everything CI runs                | `npm run check` (token check + lint + format check + tests + production build)     |
| Design-token check                | `npm run check:tokens` (no literal colours outside `src/styles/`)                  |
| Lint                              | `npm run lint` (ESLint, angular-eslint; flat config in `eslint.config.js`)         |
| Format                            | `npm run format` (Prettier, `.prettierrc.json`); `npm run format:check` to verify  |
| Unit tests, once, headless        | `npm run test:ci` (Karma + Jasmine; needs Chrome; `ChromeHeadlessCI` is no-sandbox) |
| Unit tests, watching              | `npm test`                                                                         |
| Production build                  | `npm run build` (initial bundle ~1.95 MB against a 2 MB warning budget)            |

CI (`.github/workflows/ci.yml`) runs the same five steps. Markdown is not formatted by Prettier (`.prettierignore`).

All of these pass today. If one fails after your change, it is yours.

## Architecture

One feature, one screen. `AppComponent` renders only `<app-pdf-viewer>`. State lives in signals in root services; components are
`OnPush` and read the services directly (no prop drilling), except `FieldPropertyFormComponent`, which takes the field as an input and
emits edits because it works on a local copy.

```
src/app/
  models/
    field.model.ts                 Field, enums (Adobe Sign's names), IFormFieldGeneratorViewModel (the Adobe export shape), fieldTypeKey()
    pdf.types.ts                   PdfDocument / PdfViewport aliases of pdfjs-dist types; ViewportGeometry (the 4 viewport members the maths uses)
  utils/
    field-io.ts                    PURE: buildConfigFile, toAdobeFormFields, parseImport (validation), createFieldId
    file-transfer.ts               browser glue: downloadJson, pickFile, pickJsonFile
  services/                        all providedIn: 'root'
    pdf-document.service.ts        PDF.js: load, cancellable render of one page, current page/viewport signals, page heights
    pdf-field.service.ts           the field list (signal) and every mutation; each goes through HistoryService unless useHistory=false
    history.service.ts             undo/redo, Command pattern (Add/Delete/Update/Move/Resize/ReplaceFields), canUndo/canRedo signals
    editor-state.service.ts        UI state: documentType, grid, snap, selected type/field, hover, drawing gesture, cursor, sidebars
    field-editor.service.ts        BEHAVIOUR: pointerDown/Move/Up -> select / drag / resize / draw; cancelGesture, delete, undo, applyDocumentType
    field-interaction.service.ts   drag/resize maths and the 8 resize handles (no signals, no DOM)
    coordinate-conversion.service  pixels <-> points, the Y axis per document type, snap, flipTop
    canvas-renderer.service.ts     draws fields/handles/grid/preview on a 2D context; hit-testing
    field-type.service.ts          the preset catalogue (label, types, icon, colour, default validation, default click size), smart names
    file-actions.service.ts        open PDF, import / export, JSON dialog, the document-type confirm dialog (NzMessage / NzModal)
    theme.service.ts               reads the --ff-* design tokens for canvas code (a canvas cannot use CSS variables)
  components/
    pdf-viewer/                    layout + the two canvases; turns DOM events into canvas points and paints; keyboard shortcuts
    toolbar/  field-type-sidebar/  field-properties-sidebar/  field-list/  field-property-form/
  icons.ts                         the Ant Design icons that are registered (see Gotchas)
  (src/styles/)                    the design system: tokens.less, ant-theme.less, base.less, components.less (see DESIGN.md)
  testing/                         test-data (makeField, makeViewport), fake-pdf-document, test-providers
```

Data flow: mouse event on the overlay canvas → `PdfViewerComponent` (canvas coordinates) → `FieldEditorService` → `PdfFieldService`
(through `HistoryService`) → `fields()` signal → an effect in the viewer schedules one `requestAnimationFrame` repaint of the overlay.

### Coordinates (the part most likely to be broken by a careless edit)

- Fields are stored **in PDF points**, not pixels: `pixels / viewport.scale` (scale is `RENDER_SCALE = 1.5`). Pixels exist only while the
  mouse is down.
- `top` is always the distance of the field's **top edge** from an origin edge, and which edge depends on `AdobeDocumentType`:
  **TRANSIENT (default): the bottom of the page** (`pageHeight − y/scale`); **LIBRARY: the top of the page** (`y/scale`). `left`,
  `width`, `height` do not depend on it. `README.md`, the toolbar and the confirm dialog all say this now; an older README said the
  opposite. Adobe's own documentation could not be found to confirm either, only community reports that `top` is measured from the
  bottom; the owner's LIBRARY convention is taken from the app as shipped.
- The page height used is `viewBox[3] − viewBox[1]`, i.e. the **unrotated** page. A page with `/Rotate` is not handled specially.
- Changing the document type is **not** a relabel: `FieldEditorService.applyDocumentType` rewrites every field's `top` to `pageHeight − top`
  using each field's own page height (pages can differ in size), then clears the undo history (old steps hold the other system's values).
  It needs the PDF open when fields exist.
- Any change to a conversion must be applied everywhere it is used: creation (`FieldEditorService`), move/resize (`FieldInteractionService`),
  painting and hit-testing (`CanvasRendererService`), remap. `coordinate-conversion.service.spec.ts` and `field-editor.service.spec.ts` pin it.

### Files the app reads and writes

- **Export** (`buildConfigFile`): `{ fields: Field[], documentType, totalPages, exportDate }`. This is FieldForge's own save format; the
  fields carry their UI `id` and a single `locations` object. **View JSON** shows the same thing.
- **Adobe JSON** (`toAdobeFormFields`): the bare array for Adobe Sign's `formFields`: no `id`, `locations` as a one-element array,
  coordinates exactly as stored (so they are in the current document type's system).
- **Import** (`parseImport`) accepts both. It never trusts the file: unknown `inputType`/`contentType`, bad numbers, `pageNumber` below 1,
  non-positive sizes skip that field with a warning; a file with nothing usable throws `ImportError`. A field with several `locations`
  becomes one field per location. Ids are always regenerated. Import is one undo step, except when the file's `documentType` differs
  (then history is cleared, as for a remap).
- Enum values (`FormFieldInputType`, `FormFieldContentType`, `AdobeDocumentType`) are Adobe Sign's names and form a public contract.
  Do not rename them without being asked.

## Rules

1. **Undoable changes go through `PdfFieldService` with `useHistory = true`.** Never mutate a `Field` in place and never set the signal from
   a component. Use `useHistory = false` only for import/remap and for the frames of a drag/resize (the single committed command carries the
   original bounds, as `FieldEditorService.pointerUp` does).
2. Fields are replaced immutably (`{ ...field, locations: { ...field.locations, ... } }`).
3. `selectedField` is **derived** from `selectedFieldId` and the field list, so it is never stale. Keep it that way: store the id, not the object.
4. **No new `any`** (lint enforces it). PDF.js objects are typed through `models/pdf.types.ts`; maths services take `ViewportGeometry`.
5. Components are standalone, `OnPush`, prefixed `app-` (lint enforces it); templates use native control flow (`@if`/`@for`). Use signals,
   `inject()`, `input()`/`output()`. No `HttpClient`, no router.
6. Keyboard shortcuts must ignore typing targets (inputs, textareas, selects, anything inside `.cdk-overlay-container`); see `isTypingTarget`
   in `pdf-viewer.component.ts`. Backspace in the name box once deleted the selected field.
7. New dependencies need the owner's say-so. `pdfjs-dist` and its worker must stay on the same version.
8. **UI follows `DESIGN.md`.** Build from the `ff-*` classes in `src/styles/components.less`; no literal colours (`npm run check:tokens` fails
   the build), no inline colour/spacing styles, no component stylesheets. A new colour or size is a token in `tokens.less` first. A new field type
   needs a `kind`. Selection is the accent colour and field kinds are the `--ff-field-*` colours; never swap them.
9. Keep user data local. No analytics, no uploads, no network calls with document content, no remote images. A PDF may be confidential.
10. Do not commit PDFs or exported JSON from real customers; use synthetic ones.

## Conventions

- 2 spaces, single quotes, 120 columns, trailing commas (Prettier decides; run `npm run format`). Files named `x.component.{ts,html,less}`,
  `x.service.ts`, specs next to the file as `x.spec.ts`.
- TypeScript is `strict` plus `noImplicitReturns`, `noImplicitOverride`, `strictTemplates`.
- Comments explain *why*, not what.
- **Put logic in a service or a pure function, not in a component**, and test it there. `PdfViewerComponent` should stay about layout,
  canvases and key handling.
- Tests: Jasmine/Karma. Use `makeField`, `makeViewport` and `provideTestApp()` from `src/app/testing`. Component specs need
  `provideTestApp()` (animations, locale, icons, `NzModalModule`). To test editor logic without PDF.js, provide
  `{ provide: PdfDocumentService, useValue: createFakePdf() }`.
- Commit messages say why. Verify behaviour changes in a real browser with a real PDF, not only with the unit tests:
  draw, click-create, move, resize, undo/redo, switch document type, export, re-import.

## Gotchas

- **Ant Design is themed from the tokens through LESS.** `styles.less` imports `ng-zorro-antd.less` (not the pre-built `.min.css`) and
  `ant-theme.less` overrides its variables from `tokens.less`. To change the accent, fonts or radii, edit the token, not Ant's CSS. Ant's
  compiled CSS is larger than the min.css, and the build takes a few seconds longer.
- **The canvas reads tokens at paint time** (`ThemeService`, cached). Anything drawn with `ctx` takes its colours from there; tests load the
  global stylesheet, so they see the real values.
- **Icons are registered one by one** (`src/app/icons.ts`), not `import * as AllIcons` (that cost about 0.7 MB). An unregistered icon renders
  nothing and, with no `HttpClient`, logs an error. Add the icon to `APP_ICONS` when you add an `nzType="..."` or a preset `icon`, and to the
  list in `icons.spec.ts`.
- **`NzModalService` is only provided by `NzModalModule`**, which `app.config.ts` imports via `importProvidersFrom`. A root service that injects it
  (like `FileActionsService`) fails at runtime without that, and the build will not tell you.
- **`nz-upload` needs `HttpClient`** even if you never upload. The app does not use it: PDFs are chosen with `pickFile` (a detached
  `<input type=file>`). Do not bring `nz-upload` back without deciding to take `HttpClient` too.
- **A footer button of an ng-zorro dialog does not close it.** `FileActionsService.showJson` closes its dialog explicitly.
- **Dialog content passed as an HTML string loses its inline `style` attributes** (Angular sanitises it). Style it with a class from `components.less` (`ff-code-block`, `ff-callout`).
- **PDF.js and the overlay repaint use `requestAnimationFrame`**, which does not run in a hidden tab or a hidden Browser pane. When driving
  the app from a tool, make sure the page is visible, or the first render never finishes and the editor ignores input (no viewport yet).
- **The PDF.js worker is served from `assets/pdfjs/`** (copied by `angular.json` from `node_modules`), resolved against `document.baseURI`.
  `src/assets/pdfjs/pdf.min.mjs` is an old vendored copy that nothing loads; it is left in place, not part of the app.
- The preset keys are `label_inputType_contentType` lower-cased (`fieldTypeKey`); two presets share input and content type (the two date
  presets), so the label is part of the key. A new preset needs an entry in `FieldTypeService.nameMap` or it gets a generic name
  (`field-type.service.spec.ts` fails until it has one).
- "Date Field" is `validation: 'DATE'`, "Date-CUSTOM Field" is `DATE_CUSTOM` with `yyyy-MM-dd`. They were the other way round before; files
  exported with the old presets keep their old values.
- A click (a drag under 4 px) creates a field of the preset's default size (`getDefaultSize`), kept on the page. Before, a click made an
  invisible 0 × 0 field.
- Karma specs that render ng-zorro components need `provideTestApp()`; without animations they fail with NG05105.
- The repo is named `Adobe-Sign-Field-Forge`, the Angular project and the clone URL in the README say `pdf-field-mapper`, the UI title is
  "FieldForge for Adobe Sign". Don't rename anything to reconcile them unless asked.
