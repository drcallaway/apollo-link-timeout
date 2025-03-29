// Runs the integration tests for cjs and esm to ensure that our builds are working correctly.
// You must run this script after building the package.

import { spawnSync } from 'node:child_process';
import { existsSync, rmdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const runCommand = (command, args, workingDirectory) => {
  const p = spawnSync(command, { cwd: workingDirectory });
  if (p.status) {
    console.error(`Error running command: ${command} ${args.join(' ')} in ${workingDirectory}`);
    console.error(p.stderr.toString());
    process.exit(p.status);
  }
}

if (!existsSync(join(__dirname, "..", "..", "lib"))) {
  console.error("The build directory does not exist. Please run `yarn build` first.");
  process.exit(1);
}

for (const build of ["cjs", "esm"]) {
  console.info(`Running tests for ${build} build...`);
  const workingDirectory = join(__dirname, build);
  // If node_modules exists, just clear our `apollo-link-timeout` to ensure we have the latest version
  // of the code.
  if (existsSync(join(workingDirectory, "node_modules"))) {
    rmdirSync(join(workingDirectory, "node_modules", "apollo-link-timeout"), { recursive: true });
  }
  console.info("  Installing dependencies");
  runCommand("yarn", ["install", "--check-files"], workingDirectory);
  console.info("  Running script");
  runCommand("node", ["."], workingDirectory);
}
