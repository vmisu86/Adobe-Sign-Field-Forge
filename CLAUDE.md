@AGENTS.md

## For Claude Code

- Personal, public, open-source demo project. Keep employer names, internal URLs, customer documents and real signer data out of the repo.
- Read `DESIGN.md` before any UI change, and build from its `ff-*` classes and tokens. A literal colour fails `npm run check:tokens`.
- After a change run `npm run check` (token check, lint, format, tests, build). The tests are green today, so a red one is yours.
- For anything touching drawing, coordinates, import/export or dialogs, also run the app (`npm start`, or the `fieldforge` entry in
  `.claude/launch.json`) and exercise it in the browser with a real PDF. Keep the preview pane visible: a hidden pane pauses
  `requestAnimationFrame`, which stalls PDF.js (see AGENTS.md Gotchas).
- Run `npm run format` before finishing; CI fails on unformatted files. Markdown is not formatted.
- Prefer the Write/Edit tools over long shell heredocs for source files (apostrophes and backticks break the shell parser).
- Do not edit `.claude/settings.local.json` (the owner's local permissions) or anything under `dist/`, `node_modules/`, `.angular/`.
- Don't commit or push unless asked. `PROJECT_ANALYSIS.md` is deliberately git-ignored: keep any private analysis notes there.
