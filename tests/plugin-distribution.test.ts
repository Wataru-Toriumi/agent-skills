import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import type { TestContext } from 'node:test';
import { createPlugin } from '../scripts/lib/plugin-commands.ts';
import { checkPluginDistribution } from '../scripts/lib/plugin-distribution.ts';

function fixture(t: TestContext) {
  const root = fs.mkdtempSync(join(tmpdir(), 'plugin-distribution-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.cpSync(fileURLToPath(new URL('../templates', import.meta.url)), join(root, 'templates'), { recursive: true });
  fs.mkdirSync(join(root, 'plugins'));
  fs.mkdirSync(join(root, '.claude-plugin'));
  fs.writeFileSync(join(root, '.claude-plugin/marketplace.json'), JSON.stringify({ name: 'test', plugins: [] }));
  createPlugin(root, { name: 'sample', description: 'Example plugin' });
  return root;
}

function editJson(path: string, update: (data: any) => void) {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  update(data);
  fs.writeFileSync(path, JSON.stringify(data));
}

const skill = 'plugins/sample/skills/plugin-check/SKILL.md';
const catalog = '.claude-plugin/marketplace.json';

test('accepts generated plugins and Markdown syntax without treating example code as links', (t) => {
  const root = fixture(t);
  fs.writeFileSync(join(root, 'plugins/sample/README.md'), '# Guide\n');
  fs.appendFileSync(join(root, skill), '\n[Guide][guide]\n\n[guide]: ../../README.md\n\n```md\n[Example](missing.md)\n```\n\n`[Example](missing.md)`\n');
  assert.deepEqual(checkPluginDistribution(root), { plugins: ['sample'] });
});

for (const [label, mutate, error] of [
  ['missing source', (root: string) => editJson(join(root, catalog), x => x.plugins[0].source = './plugins/missing'), /source/],
  ['external source', (root: string) => editJson(join(root, catalog), x => x.plugins[0].source = '../sample'), /source/],
  ['duplicate registration', (root: string) => editJson(join(root, catalog), x => x.plugins.push(x.plugins[0])), /Duplicate/],
  ['unregistered directory', (root: string) => editJson(join(root, catalog), x => x.plugins = []), /missing from marketplace/],
  ['missing directory', (root: string) => fs.rmSync(join(root, 'plugins/sample'), { recursive: true }), /does not exist/],
  ['description mismatch', (root: string) => editJson(join(root, 'plugins/sample/plugin.json'), x => x.description = 'Different'), /description/],
  ['frontmatter missing', (root: string) => fs.writeFileSync(join(root, skill), '# Only a body'), /frontmatter/],
  ['description missing', (root: string) => fs.writeFileSync(join(root, skill), '---\nname: plugin-check\n---\nBody'), /description/],
  ['duplicate YAML field', (root: string) => fs.writeFileSync(join(root, skill), '---\nname: plugin-check\nname: other\ndescription: check\n---\nBody'), /frontmatter/],
  ['skill name mismatch', (root: string) => fs.writeFileSync(join(root, skill), '---\nname: other\ndescription: check\n---\nBody'), /name\/directory/],
  ['empty skill', (root: string) => fs.writeFileSync(join(root, skill), '---\nname: plugin-check\ndescription: check\n---\n'), /Empty skill/],
  ['broken link', (root: string) => fs.appendFileSync(join(root, skill), '\n[Missing](references/missing.md)'), /Missing reference/],
  ['broken reference link', (root: string) => fs.appendFileSync(join(root, skill), '\n[Missing][target]\n\n[target]: missing.md'), /Missing reference/],
  ['encoded escape', (root: string) => fs.appendFileSync(join(root, skill), '\n[Outside](%2e%2e/%2e%2e/%2e%2e/README.md)'), /escapes plugin/],
  ['image escape', (root: string) => fs.appendFileSync(join(root, skill), '\n<img src="../../../outside.png">'), /escapes plugin/],
  ['absolute path', (root: string) => fs.appendFileSync(join(root, skill), '\n[Outside](/tmp/outside)'), /Unsupported local/],
  ['symlinked resource', (root: string) => fs.symlinkSync(join(root, 'templates'), join(root, 'plugins/sample/external')), /Symlinks/],
] as const) {
  test(`rejects ${label}`, (t) => {
    const root = fixture(t);
    mutate(root);
    assert.throws(() => checkPluginDistribution(root), error);
  });
}
