import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createPlugin } from './lib/plugin-commands.ts';

const root = fileURLToPath(new URL('../', import.meta.url));

const main = (): void => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      description: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log('Usage: pnpm plugin:new <name> --description <description>');
    return;
  }
  const [name] = positionals;
  if (positionals.length !== 1 || !name) {
    throw new Error('Provide one plugin name. Use --help for usage.');
  }

  const result = createPlugin(root, { name, description: values.description ?? '' });
  console.log(`Created plugins/${name} and registered ${name}@${result.marketplace}`);
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
