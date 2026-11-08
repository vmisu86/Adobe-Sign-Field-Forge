// Fails when a literal colour appears outside the design tokens.
//
// Every colour is defined once, in src/styles/tokens.less. Components and TypeScript use classes
// (ff-*) or read the tokens at runtime (ThemeService); a hex or rgb() literal anywhere else means
// the design system is being bypassed. To allow a line deliberately, end it with `ff-allow-colour`
// (in a comment) and say why.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SCANNED = new Set(['.ts', '.html', '.less', '.css']);
const SKIPPED = [`${sep}styles${sep}`, `${sep}assets${sep}`, `${sep}testing${sep}`];
// A `#` right after `&` or a word character is an HTML entity (&#039;) or part of a name, not a colour.
const COLOUR = /(?<![&\w])#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      yield* files(path);
    } else if (SCANNED.has(name.slice(name.lastIndexOf('.')))) {
      yield path;
    }
  }
}

const offences = [];
for (const file of files(root)) {
  if (file.endsWith('.spec.ts') || SKIPPED.some((part) => file.includes(part))) continue;
  readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, index) => {
      if (COLOUR.test(line) && !line.includes('ff-allow-colour')) {
        offences.push(`${relative(join(root, '..'), file)}:${index + 1}: ${line.trim()}`);
      }
    });
}

if (offences.length > 0) {
  console.error('Literal colours found outside src/styles/tokens.less:\n');
  console.error(offences.join('\n'));
  console.error('\nUse a token (var(--ff-*) or an ff- class), or add one to tokens.less. See DESIGN.md.');
  process.exit(1);
}
console.log('Design tokens: no literal colours outside src/styles.');
