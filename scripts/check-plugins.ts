import { fileURLToPath } from 'node:url';
import { checkPluginDistribution } from './lib/plugin-distribution.ts';

try {
  const { plugins } = checkPluginDistribution(fileURLToPath(new URL('../', import.meta.url)));
  console.log(`Distribution valid: marketplace, template and ${plugins.length} plugin(s).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
