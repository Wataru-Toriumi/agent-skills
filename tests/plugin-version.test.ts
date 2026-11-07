import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import type { TestContext } from 'node:test';
import { checkVersions, nextVersion, versionPlugin } from '../scripts/lib/plugin-version.ts';

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

test('updates only the target plugin, preserves metadata, and accumulates history', (t) => {
  const root = fixture(t);
  const directory = addPlugin(root);
  const other = addPlugin(root, 'other');
  const catalogBefore = fs.readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8');
  const before = manifests.map((path) => readJson(join(directory, path)));

  const result = versionPlugin(root, 'sample', 'patch', '入力の不具合を修正');
  assert.equal(result.next, '0.1.1');
  for (const [index, path] of manifests.entries()) {
    assert.deepEqual(readJson(join(directory, path)), { ...before[index], version: '0.1.1' });
    assert.equal(readJson(join(other, path)).version, '0.1.0');
    assert.equal(readJson(join(root, 'templates/plugin', path)).version, '0.1.0');
  }
  assert.equal(fs.readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8'), catalogBefore);
  versionPlugin(root, 'sample', 'minor', '機能を追加\n詳細の説明');
  const changelog = fs.readFileSync(join(directory, 'CHANGELOG.md'), 'utf8');
  assert.match(changelog, /^# Changelog\n\n## \[0\.2\.0\] - \d{4}-\d{2}-\d{2}\n\n- 機能を追加\n  詳細の説明/);
  assert.ok(changelog.indexOf('[0.2.0]') < changelog.indexOf('[0.1.1]'));
  assert.match(changelog, /入力の不具合を修正/);
  assert.deepEqual(checkVersions(root), ['other', 'sample']);
});

test('dry run previews the version without writing any files', (t) => {
  const root = fixture(t);
  const directory = addPlugin(root);
  const before = manifests.map((path) => fs.readFileSync(join(directory, path), 'utf8'));
  const result = run(root, 'version-plugin.ts', 'sample', 'minor', '--message', '機能追加', '--dry-run');
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
    ['../sample', 'patch', '--message', 'bad'],
    ['sample', 'release', '--message', 'bad'],
    ['sample', 'patch'],
    ['sample', 'patch', '--message', ' '],
    ['sample', 'patch', '--message', 'bad', 'extra'],
    ['--check', '--dry-run'],
  ]) {
    assert.notEqual(run(root, 'version-plugin.ts', ...args).status, 0);
  }
  assert.equal(readJson(join(directory, 'plugin.json')).version, '0.1.0');
  const result = run(root, 'version-plugin.ts', 'sample', 'major', '--message', '破壊的変更');
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
  assert.throws(() => checkVersions(root), /mismatch/);
  assert.throws(() => versionPlugin(root, 'sample', 'patch', '修正'), /mismatch/);
  assert.equal(readJson(join(directory, 'plugin.json')).version, '0.1.0');
  assert.deepEqual(readJson(path), mismatch);
  assert.equal(fs.existsSync(join(directory, 'CHANGELOG.md')), false);
});

test('checks the template even when no plugins exist', (t) => {
  const root = fixture(t);
  assert.deepEqual(checkVersions(root), []);
  const path = join(root, 'templates/plugin/plugin.json');
  fs.writeFileSync(path, JSON.stringify({ ...readJson(path), version: 'bad' }));
  assert.throws(() => checkVersions(root), /Invalid name or stable version/);
});

test('invalid changelog and duplicate release entries are rejected before writing', (t) => {
  const root = fixture(t);
  const directory = addPlugin(root);
  const path = join(directory, 'CHANGELOG.md');
  for (const content of ['User-owned notes\n', '# Changelog\n\n## [0.1.1] - 2026-01-01\n']) {
    fs.writeFileSync(path, content);
    assert.throws(() => versionPlugin(root, 'sample', 'patch', '修正'), /CHANGELOG/);
    assert.equal(readJson(join(directory, 'plugin.json')).version, '0.1.0');
    assert.equal(fs.readFileSync(path, 'utf8'), content);
  }
});

test('rejects symlinked plugin paths and changelogs without touching their targets', (t) => {
  const root = fixture(t);
  const directory = addPlugin(root);
  fs.symlinkSync(directory, join(root, 'plugins/linked'), 'dir');
  assert.throws(() => versionPlugin(root, 'linked', 'patch', '修正'), /Expected a directory/);
  fs.symlinkSync(join(directory, 'plugin.json'), join(directory, 'CHANGELOG.md'));
  assert.throws(() => versionPlugin(root, 'sample', 'patch', '修正'), /regular file/);
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
  assert.throws(() => versionPlugin(root, 'sample', 'patch', '修正'), /Simulated rename failure/);
  mocked.mock.restore();
  for (const [index, path] of manifests.entries()) {
    assert.equal(fs.readFileSync(join(directory, path), 'utf8'), before[index]);
  }
  assert.equal(fs.existsSync(join(directory, 'CHANGELOG.md')), false);
  for (const path of [directory, join(directory, '.claude-plugin')]) {
    assert.ok(fs.readdirSync(path).every((name) => !name.endsWith('.tmp')));
  }
});
