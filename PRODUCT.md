# Product

<!-- impeccable:product-schema 1 -->

## Platform

web (desktop-first SPA; no backend)

## Users

Primary: a developer or integrator who builds on the Adobe Sign API and needs to place form fields on a PDF without sending their
users to Adobe's own editor. They load a document, place and tune fields, and take the exported JSON into their own code.

Secondary: a reader of the author's article (misu-varga.com/blog/article/15) who opens the live demo to see the idea working, and
people evaluating the author's work.

## Product Purpose

FieldForge shows that Adobe Sign document preparation (placing signature, text, date, checkbox and radio fields) can be embedded in a
host application. It produces JSON compatible with Adobe Sign's `formFields` parameter for both transient documents and library
templates. It is a reference implementation and demo, shared as-is for educational purposes.

Success: someone can load a PDF, place a dozen fields accurately, undo mistakes, export JSON, and use it against the Adobe Sign API with
fields appearing where they were drawn.

## Positioning

An open-source, embeddable alternative to switching context into Adobe Sign's editor, written by a working engineer as proof of work.
A developer tool and a portfolio piece, not a SaaS product.

## Operating Context

- Angular 20 SPA, ng-zorro-antd (Ant Design) UI, PDF.js for rendering; static hosting at pdfmapper.misu-varga.com.
- Fully client-side: documents never leave the browser. This is a feature and a promise; do not break it.
- Two Adobe Sign coordinate modes, `TRANSIENT` (default) and `LIBRARY`, switched in the toolbar.

## Capabilities and Constraints

- Three-panel layout: field types (left), PDF canvas (centre), properties and field list (right); sidebars collapse.
- Two tools: Select (default; clicking empty space never creates anything) and Draw a field type (pick it or press its key; drag or click on the page; back to Select after one field unless Keep drawing is on).
- Click a field to select it, drag to move, handles to resize. The inspector lists every field by page and jumps to it.
- The page fits the window width by default; zoom 25%–400%; a status bar shows the coordinate system, page size and the mouse position in export coordinates.
- Grid overlay, snap-to-grid, undo/redo (`Ctrl+Z`, `Ctrl+Shift+Z` or `Ctrl+Y`), JSON viewer with copy.
- Two exports: FieldForge's own config file (for saving and reloading work) and the bare `formFields` array for Adobe Sign. Import reads both and skips anything unusable with a note.
- Field types: text, multiline, signer name / email, signature, initials, date variants, signing date, checkbox, radio.
- Recipients are modelled as index 1 (signer) or 2 (approver).
- Browsers: latest Chrome, Edge, Firefox, Safari. Interaction is mouse-driven (the canvas uses mouse events); touch has not been designed for.
- Exported key names and enum values are Adobe Sign's and form a public contract.

## Brand Commitments

- Name: "FieldForge" ("FieldForge for Adobe Sign" in the UI). It is an independent project, not an Adobe product; do not use
  Adobe logos or imply endorsement.
- Author credit and article link stay in the README.

## Evidence on Hand

- The live demo and the author's article describe real use. No customer names, usage numbers, benchmarks or testimonials exist in the
  repository; do not invent any.

## Product Principles

1. Placement accuracy first: a field must land exactly where it was drawn, in either coordinate mode.
2. No mode switching: the selected type plus a click does the right thing (create on empty space, select on a field).
3. Everything is reversible: every edit is undoable.
4. The exported JSON is the product; keep it faithful to Adobe Sign's schema.
5. Documents stay on the user's machine.

## Accessibility & Inclusion

Target WCAG 2.2 AA for the chrome (toolbar, sidebars, forms, modals): visible focus, labelled controls, sufficient contrast, keyboard
access to buttons and form inputs. The canvas itself is pointer-driven and is a known gap; the field list and properties form give a
non-canvas way to read and edit what is on the page and should stay complete. Field-type colours are not the only carrier of meaning
(each type also has a label and an icon).
