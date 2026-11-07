import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { checkPluginVersions, versionPlugin } from './lib/plugin-commands.ts';
import { parseReleaseType } from './lib/releases.ts';

const root = fileURLToPath(new URL('../', import.meta.url));

function main(): void {
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
    return;
  }

  if (values.check) {
    if (positionals.length || values.message !== undefined || values['dry-run']) {
      throw new Error('--check cannot be combined with versioning arguments.');
    }
    const result = checkPluginVersions(root);
    console.log(`Versions are consistent: template and ${result.plugins.length} plugin(s).`);
    return;
  }

  const [name, release] = positionals;
  if (positionals.length !== 2 || !name) {
    throw new Error('Provide a plugin name and patch, minor or major. Use --help for usage.');
  }
  const result = versionPlugin(root, {
    name,
    release: parseReleaseType(release),
    message: values.message ?? '',
    dryRun: values['dry-run'],
  });
  console.log(`${values['dry-run'] ? '[dry-run] ' : ''}${name}: ${result.previous} -> ${result.next}`);
  for (const path of result.files) {
    console.log(path);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
