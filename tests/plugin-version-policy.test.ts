import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TestContext } from 'node:test';
import { test } from 'node:test';
import { checkVersionChanges, greaterVersion } from '../scripts/lib/plugin-version-policy.ts';
import { git } from '../scripts/lib/release-notes.ts';

const write = (root: string, name: string, version: string) => {
  for (const file of ['plugin.json', '.claude-plugin/plugin.json']) {
    const path = join(root, 'plugins', name, file);
    fs.mkdirSync(join(path, '..'), { recursive: true });
    fs.writeFileSync(path, JSON.stringify({ name, version }));
  }
};
const commit = (root: string) => {
  git(root, 'add', '.');
  git(root, '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-m', 'test');
  return git(root, 'rev-parse', 'HEAD');
};
const fixture = (t: TestContext) => {
  const root = fs.mkdtempSync(join(tmpdir(), 'version-policy-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.name', 'Test');
  git(root, 'config', 'user.email', 'test@example.invalid');
  write(root, 'sample', '0.1.0');
  return { root, base: commit(root) };
};

test('compares numeric versions without precision loss', () => {
  assert.ok(greaterVersion('1.0.0', '0.99.99'));
  assert.ok(greaterVersion('0.1.9007199254740993', '0.1.9007199254740992'));
  assert.equal(greaterVersion('0.1.0', '0.1.0'), false);
  assert.equal(greaterVersion('0.0.9', '0.1.0'), false);
});
for (const file of ['SKILL.md', 'README.md', 'assets/diagram.svg']) {
  test(`requires bump for ${file}`, (t) => {
    const { root, base } = fixture(t);
    const path = join(root, 'plugins/sample', file);
    fs.mkdirSync(join(path, '..'), { recursive: true });
    fs.writeFileSync(path, 'Changed distribution');
    commit(root);
    assert.throws(() => checkVersionChanges(root, base, 'HEAD'), /without a version increase/);
    write(root, 'sample', '0.1.1');
    commit(root);
    assert.deepEqual(checkVersionChanges(root, base, 'HEAD'), ['sample']);
  });
}

test('ignores repository docs, accepts new plugins and removal', (t) => {
  const { root, base } = fixture(t);
  fs.writeFileSync(join(root, 'README.md'), 'Repository docs');
  commit(root);
  assert.deepEqual(checkVersionChanges(root, base, 'HEAD'), []);
  write(root, 'added', '0.1.0');
  fs.rmSync(join(root, 'plugins/sample'), { recursive: true });
  commit(root);
  assert.deepEqual(checkVersionChanges(root, base, 'HEAD'), ['added', 'sample']);
});

test('rejects decreasing and mismatched versions and missing comparison commits', (t) => {
  const { root, base } = fixture(t);
  write(root, 'sample', '0.0.9');
  commit(root);
  assert.throws(() => checkVersionChanges(root, base, 'HEAD'), /without a version increase/);
  fs.writeFileSync(
    join(root, 'plugins/sample/plugin.json'),
    JSON.stringify({ name: 'sample', version: '0.2.0' }),
  );
  commit(root);
  assert.throws(() => checkVersionChanges(root, base, 'HEAD'), /mismatched/);
  assert.throws(() => checkVersionChanges(root, 'does-not-exist', 'HEAD'));
});

test('checks every affected plugin when a file is moved across distributions', (t) => {
  const { root } = fixture(t);
  write(root, 'other', '0.1.0');
  fs.writeFileSync(join(root, 'plugins/sample/move.txt'), 'same');
  const comparison = commit(root);
  fs.renameSync(join(root, 'plugins/sample/move.txt'), join(root, 'plugins/other/move.txt'));
  write(root, 'sample', '0.1.1');
  commit(root);
  assert.throws(() => checkVersionChanges(root, comparison, 'HEAD'), /other/);
  write(root, 'other', '0.1.1');
  commit(root);
  assert.deepEqual(checkVersionChanges(root, comparison, 'HEAD'), ['other', 'sample']);
});
