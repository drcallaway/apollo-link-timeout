import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cjsFile = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "cjs", "timeoutLink.js");
if (!fs.existsSync(cjsFile)) {
  console.error("File not found: ", cjsFile);
  process.exit(1);
}

const contents = fs.readFileSync(cjsFile, 'utf8');
const newContents = contents.replaceAll(/@apollo\/client\/(.+)\/index.js/g, '@apollo/client/$1/core.cjs');
fs.writeFileSync(cjsFile, newContents);
