// Script fixes the @apollo/client import in the generated ESM build.

import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cjsFile = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "esm", "timeoutLink.js");
if (!fs.existsSync(cjsFile)) {
  console.error("File not found: ", cjsFile);
  process.exit(1);
}

const contents = fs.readFileSync(cjsFile, 'utf8');
const newContents = contents.replace(/@apollo\/client\/core/g, '@apollo/client/core/index.js');
fs.writeFileSync(cjsFile, newContents);
