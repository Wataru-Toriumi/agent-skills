import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { checkVersionChanges } from './lib/plugin-version-policy.ts';

try {
  const { values } = parseArgs({
    options: { base: { type: 'string' }, head: { type: 'string' } },
  });
  if (!values.base)
    throw new Error(
      'Usage: node scripts/check-version-changes.ts --base <commit> [--head <commit>]',
    );
  const names = checkVersionChanges(
    fileURLToPath(new URL('../', import.meta.url)),
    values.base,
    values.head ?? 'HEAD',
  );
  console.log(`Version policy passed: ${names.length} changed plugin(s).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
