import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { checkVersions, versionPlugin } from './lib/plugin-version.ts';
import type { ReleaseType } from './lib/plugin-version.ts';

const root = fileURLToPath(new URL('../', import.meta.url));

try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      message: { type: 'string' },
      'dry-run': { type: 'boolean' },
      check: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log('Usage: pnpm plugin:version <name> <patch|minor|major> --message <summary> [--dry-run]');
    console.log('       pnpm plugin:check');
  } else if (values.check) {
    if (positionals.length || values.message !== undefined || values['dry-run']) {
      throw new Error('--check cannot be combined with versioning arguments.');
    }
    const names = checkVersions(root);
    console.log(`Versions are consistent: template and ${names.length} plugin(s).`);
  } else {
    const [name, release] = positionals;
    if (positionals.length !== 2 || !['patch', 'minor', 'major'].includes(release)) {
      throw new Error('Provide a plugin name and patch, minor or major. Use --help for usage.');
    }
    const result = versionPlugin(root, name, release as ReleaseType, values.message ?? '', values['dry-run']);
    console.log(`${values['dry-run'] ? '[dry-run] ' : ''}${name}: ${result.previous} -> ${result.next}`);
    for (const path of result.files) console.log(path);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
