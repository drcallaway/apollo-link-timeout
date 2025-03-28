// Script fixes the @apollo/client import in the generated ESM build. The issue is that
// `@apollo/client` does not provide export maps for `@apollo/client/core` so we cannot
// import that directly in ESM. Instead, for ESM, we need to import from `@apollo/client/core/index.js`,
// except that then breaks CJS builds. So we have this post-build script that rewrites
// our import from CJS compatible to ESM compatible.
// See https://github.com/apollographql/apollo-client/issues/9976 for more information.

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
