import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { syncMainRules } from './lib/repository-rules.ts';

try {
  const { values } = parseArgs({ options: { repository: { type: 'string' }, apply: { type: 'boolean' } } });
  if (!values.repository) throw new Error('Usage: node scripts/sync-main-rules.ts --repository owner/repo [--apply]');
  const desired = JSON.parse(fs.readFileSync(new URL('../.github/rulesets/main-quality-gate.json', import.meta.url), 'utf8'));
  const result = await syncMainRules({
    repository: values.repository, desired, apply: values.apply,
    token: values.apply ? process.env.RULESET_ADMIN_TOKEN : process.env.GITHUB_TOKEN,
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
