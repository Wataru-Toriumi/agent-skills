import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import type { TestContext } from 'node:test';
import { checkPluginVersions, createPlugin, versionPlugin } from '../scripts/lib/plugin-commands.ts';
import { nextVersion } from '../scripts/lib/releases.ts';

const repository = fileURLToPath(new URL('../', import.meta.url));
const manifests = ['plugin.json', '.claude-plugin/plugin.json'];

function fixture(t: TestContext): string {
  const root = fs.mkdtempSync(join(tmpdir(), 'plugin-version-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const path of ['scripts', 'templates', 'package.json']) {
    fs.cpSync(join(repository, path), join(root, path), { recursive: true });
  }
  fs.mkdirSync(join(root, 'plugins'));
  fs.mkdirSync(join(root, '.claude-plugin'));
  fs.writeFileSync(join(root, '.claude-plugin/marketplace.json'), JSON.stringify({
    name: 'test-marketplace', owner: { name: 'test' }, plugins: [],
  }));
  return root;
}

function run(root: string, script: string, ...args: string[]) {
  return spawnSync(process.execPath, [join(root, 'scripts', script), ...args], {
    cwd: tmpdir(), encoding: 'utf8', timeout: 10000,
  });
}

function addPlugin(root: string, name = 'sample'): string {
  const result = run(root, 'new-plugin.ts', name, '--description', 'テスト用プラグイン');
  assert.equal(result.status, 0, result.stderr);
  return join(root, 'plugins', name);
}

function readJson(path: string) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

test('patch/minor/major increment independently and reset the lower components', () => {
  assert.equal(nextVersion('1.2.3', 'patch'), '1.2.4');
  assert.equal(nextVersion('1.2.3', 'minor'), '1.3.0');
  assert.equal(nextVersion('1.2.3', 'major'), '2.0.0');
  assert.equal(nextVersion('0.1.0', 'major'), '1.0.0');
  assert.equal(nextVersion('1.0.9007199254740992', 'patch'), '1.0.9007199254740993');
  for (const version of ['01.2.3', '1.2', 'v1.2.3', '1.2.3-beta.1', '1.2.3+build', '-1.2.3', '1.2.3\n']) {
    assert.throws(() => nextVersion(version, 'patch'), /Unsupported version/);
  }
});

test('updates only the target manifests and preserves existing files', (t) => {
  const root = fixture(t);
  const directory = addPlugin(root);
  const other = addPlugin(root, 'other');
  const catalogBefore = fs.readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8');
  const before = manifests.map((path) => readJson(join(directory, path)));

  const historyPath = join(directory, 'CHANGELOG.md');
  fs.writeFileSync(historyPath, 'Existing history stays untouched\n');
  const result = versionPlugin(root, { name: 'sample', release: 'patch' });
  assert.equal(result.next, '0.1.1');
  for (const [index, path] of manifests.entries()) {
    assert.deepEqual(readJson(join(directory, path)), { ...before[index], version: '0.1.1' });
    assert.equal(readJson(join(other, path)).version, '0.1.0');
    assert.equal(readJson(join(root, 'templates/plugin', path)).version, '0.1.0');
  }
  assert.equal(fs.readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8'), catalogBefore);
  versionPlugin(root, { name: 'sample', release: 'minor' });
  assert.equal(fs.readFileSync(historyPath, 'utf8'), 'Existing history stays untouched\n');
  assert.deepEqual(result.files, manifests.map((path) => join(directory, path)));
  assert.deepEqual(checkPluginVersions(root), { plugins: ['other', 'sample'] });
});

test('dry run previews the version without writing any files', (t) => {
  const root = fixture(t);
  const directory = addPlugin(root);
  const before = manifests.map((path) => fs.readFileSync(join(directory, path), 'utf8'));
  const result = run(root, 'version-plugin.ts', 'sample', 'minor', '--dry-run');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\[dry-run\] sample: 0\.1\.0 -> 0\.2\.0/);
  assert.equal(fs.existsSync(join(directory, 'CHANGELOG.md')), false);
  for (const [index, path] of manifests.entries()) {
    assert.equal(fs.readFileSync(join(directory, path), 'utf8'), before[index]);
  }
});

test('CLI works outside the repository and rejects invalid input', (t) => {
  const root = fixture(t);
  const directory = addPlugin(root);
  for (const args of [
    ['../sample', 'patch'],
    ['sample', 'release'],
    ['sample'],
    ['sample', 'patch', '--message', 'obsolete'],
    ['sample', 'patch', 'extra'],
    ['--check', '--dry-run'],
  ]) {
    assert.notEqual(run(root, 'version-plugin.ts', ...args).status, 0);
  }
  assert.equal(readJson(join(directory, 'plugin.json')).version, '0.1.0');
  const result = run(root, 'version-plugin.ts', 'sample', 'major');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readJson(join(directory, 'plugin.json')).version, '1.0.0');
  assert.equal(run(root, 'version-plugin.ts', '--check').status, 0);
});

test('manifest mismatches stop both checking and versioning without changes', (t) => {
  const root = fixture(t);
  const directory = addPlugin(root);
  const path = join(directory, '.claude-plugin/plugin.json');
  const mismatch = { ...readJson(path), version: '0.9.0' };
  fs.writeFileSync(path, JSON.stringify(mismatch));
  assert.throws(() => checkPluginVersions(root), /mismatch/);
  assert.throws(() => versionPlugin(root, { name: 'sample', release: 'patch' }), /mismatch/);
  assert.equal(readJson(join(directory, 'plugin.json')).version, '0.1.0');
  assert.deepEqual(readJson(path), mismatch);
  assert.equal(fs.existsSync(join(directory, 'CHANGELOG.md')), false);
});

test('checks the template even when no plugins exist', (t) => {
  const root = fixture(t);
  assert.deepEqual(checkPluginVersions(root), { plugins: [] });
  const path = join(root, 'templates/plugin/plugin.json');
  fs.writeFileSync(path, JSON.stringify({ ...readJson(path), version: 'bad' }));
  assert.throws(() => checkPluginVersions(root), /Invalid name or stable version/);
});

test('rejects symlinked plugin paths and manifests without touching their targets', (t) => {
  const root = fixture(t);
  const directory = addPlugin(root);
  fs.symlinkSync(directory, join(root, 'plugins/linked'), 'dir');
  assert.throws(() => versionPlugin(root, { name: 'linked', release: 'patch' }), /Expected a directory/);
  fs.rmSync(join(directory, '.claude-plugin/plugin.json'));
  fs.symlinkSync(join(directory, 'plugin.json'), join(directory, '.claude-plugin/plugin.json'));
  assert.throws(() => versionPlugin(root, { name: 'sample', release: 'patch' }), /regular file/);
  assert.equal(readJson(join(directory, 'plugin.json')).version, '0.1.0');
});

test('restores prior manifest contents if a later file replacement fails', (t) => {
  const root = fixture(t);
  const directory = addPlugin(root);
  const before = manifests.map((path) => fs.readFileSync(join(directory, path), 'utf8'));
  const rename = fs.renameSync;
  let calls = 0;
  const mocked = t.mock.method(fs, 'renameSync', (...args: Parameters<typeof fs.renameSync>) => {
    calls += 1;
    if (calls === 2) throw new Error('Simulated rename failure');
    return rename(...args);
  });
  assert.throws(() => versionPlugin(root, { name: 'sample', release: 'patch' }), /Simulated rename failure/);
  mocked.mock.restore();
  for (const [index, path] of manifests.entries()) {
    assert.equal(fs.readFileSync(join(directory, path), 'utf8'), before[index]);
  }
  assert.equal(fs.existsSync(join(directory, 'CHANGELOG.md')), false);
  for (const path of [directory, join(directory, '.claude-plugin')]) {
    assert.ok(fs.readdirSync(path).every((name) => !name.endsWith('.tmp')));
  }
});

test('creation preserves catalog metadata and rejects duplicate names without writes', (t) => {
  const root = fixture(t);
  const catalogPath = join(root, '.claude-plugin/marketplace.json');
  const original = readJson(catalogPath);
  original.description = 'Existing marketplace';
  fs.writeFileSync(catalogPath, JSON.stringify(original));

  const options = { name: 'sample', description: 'プラグインの説明' };
  assert.deepEqual(createPlugin(root, options), { marketplace: original.name });
  const catalog = readJson(catalogPath);
  assert.deepEqual(catalog, {
    ...original,
    plugins: [{ name: 'sample', source: './plugins/sample' }],
  });
  for (const path of manifests) {
    const manifest = readJson(join(root, 'plugins/sample', path));
    assert.equal(manifest.name, 'sample');
    assert.equal(manifest.description, options.description);
  }
  assert.equal(
    fs.readFileSync(join(root, 'plugins/sample/skills/plugin-check/SKILL.md'), 'utf8'),
    fs.readFileSync(join(root, 'templates/plugin/skills/plugin-check/SKILL.md'), 'utf8'),
  );

  const before = fs.readFileSync(catalogPath, 'utf8');
  assert.throws(() => createPlugin(root, options), /Already registered/);
  assert.equal(fs.readFileSync(catalogPath, 'utf8'), before);
  assert.equal(readJson(join(root, 'plugins/sample/plugin.json')).description, options.description);
});

test('creation rejects invalid input, malformed catalog and template before registration', (t) => {
  const root = fixture(t);
  const catalogPath = join(root, '.claude-plugin/marketplace.json');
  const original = fs.readFileSync(catalogPath, 'utf8');
  for (const args of [
    ['../escape', '--description', 'bad'],
    ['sample\n', '--description', 'bad'],
    ['sample'],
    ['sample', '--description', ' '],
  ]) {
    assert.notEqual(run(root, 'new-plugin.ts', ...args).status, 0);
  }
  assert.deepEqual(fs.readdirSync(join(root, 'plugins')), []);
  assert.equal(fs.readFileSync(catalogPath, 'utf8'), original);

  for (const invalid of [null, [], { name: 'test', plugins: [null] }]) {
    fs.writeFileSync(catalogPath, JSON.stringify(invalid));
    assert.throws(() => createPlugin(root, { name: 'sample', description: 'test' }), /Invalid marketplace/);
    assert.deepEqual(fs.readdirSync(join(root, 'plugins')), []);
  }

  fs.writeFileSync(catalogPath, original);
  fs.writeFileSync(join(root, 'templates/plugin/plugin.json'), '{}');
  assert.throws(() => createPlugin(root, { name: 'sample', description: 'test' }), /Invalid name or stable version/);
  assert.deepEqual(fs.readdirSync(join(root, 'plugins')), []);
  assert.equal(fs.readFileSync(catalogPath, 'utf8'), original);
});

test('failed creation removes its new directory and preserves the catalog', (t) => {
  const root = fixture(t);
  const catalogPath = join(root, '.claude-plugin/marketplace.json');
  const original = fs.readFileSync(catalogPath, 'utf8');
  const rename = fs.renameSync;
  const mocked = t.mock.method(fs, 'renameSync', (...args: Parameters<typeof fs.renameSync>) => {
    if (args[1] === catalogPath) throw new Error('Simulated catalog write failure');
    return rename(...args);
  });
  assert.throws(
    () => createPlugin(root, { name: 'sample', description: 'test' }),
    /Simulated catalog write failure/,
  );
  mocked.mock.restore();
  assert.deepEqual(fs.readdirSync(join(root, 'plugins')), []);
  assert.equal(fs.readFileSync(catalogPath, 'utf8'), original);
  assert.deepEqual(fs.readdirSync(join(root, '.claude-plugin')), ['marketplace.json']);
});

test('creation never removes an existing directory or symlink', (t) => {
  const root = fixture(t);
  const existing = join(root, 'plugins/existing');
  fs.mkdirSync(existing);
  fs.writeFileSync(join(existing, 'notes.txt'), 'Keep me');
  fs.symlinkSync(join(root, 'missing'), join(root, 'plugins/linked'));
  for (const name of ['existing', 'linked']) {
    assert.throws(() => createPlugin(root, { name, description: 'test' }), /EEXIST/);
  }
  assert.equal(fs.readFileSync(join(existing, 'notes.txt'), 'utf8'), 'Keep me');
  assert.ok(fs.lstatSync(join(root, 'plugins/linked')).isSymbolicLink());
  assert.deepEqual(readJson(join(root, '.claude-plugin/marketplace.json')).plugins, []);
});
