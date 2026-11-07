import {
  cpSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

type Catalog = {
  name: string;
  plugins: Array<{ name: string; source: string }>;
};

const root = fileURLToPath(new URL('../', import.meta.url));

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function main(): void {
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
  if (positionals.length !== 1 || !name || name.length > 63
      || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error('Provide one kebab-case name starting with a letter (maximum 63 characters).');
  }
  const description = values.description;
  if (!description?.trim()) {
    throw new Error('--description must not be empty.');
  }

  const catalogPath = resolve(root, '.claude-plugin/marketplace.json');
  const catalog: Catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  if (typeof catalog.name !== 'string' || !Array.isArray(catalog.plugins)) {
    throw new Error('Invalid marketplace: name and plugins are required.');
  }
  if (catalog.plugins.some((plugin) => plugin.name === name)) {
    throw new Error(`Already registered: ${name}`);
  }

  const target = resolve(root, 'plugins', name);
  const temporary = `${catalogPath}.${randomUUID()}.tmp`;
  // An exclusive mkdir rejects existing directories, files and dangling symlinks.
  mkdirSync(target);
  try {
    cpSync(resolve(root, 'templates/plugin'), target, { recursive: true });
    for (const relative of ['plugin.json', '.claude-plugin/plugin.json']) {
      const path = resolve(target, relative);
      const manifest = JSON.parse(readFileSync(path, 'utf8'));
      writeJson(path, { ...manifest, name, description });
    }
    catalog.plugins.push({ name, source: `./plugins/${name}` });
    writeJson(temporary, catalog);
    renameSync(temporary, catalogPath);
  } catch (error) {
    rmSync(target, { recursive: true, force: true });
    throw error;
  } finally {
    rmSync(temporary, { force: true });
  }
  console.log(`Created plugins/${name} and registered ${name}@${catalog.name}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
