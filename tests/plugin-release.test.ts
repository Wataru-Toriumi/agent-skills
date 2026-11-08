import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import type { TestContext } from 'node:test';
import { git, planPluginReleases } from '../scripts/lib/release-notes.ts';
import { githubReleases } from '../scripts/lib/github-releases.ts';

function writePlugin(root: string, name: string, version: string) {
  for (const path of ['plugin.json', '.claude-plugin/plugin.json']) {
    const file = join(root, 'plugins', name, path);
    fs.mkdirSync(join(file, '..'), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ name, version, description: name }));
  }
}

function commit(root: string, message: string): string {
  git(root, 'add', '.');
  git(root, '-c', 'commit.gpgsign=false', 'commit', '-m', message);
  return git(root, 'rev-parse', 'HEAD');
}

function fixture(t: TestContext): string {
  const root = fs.mkdtempSync(join(tmpdir(), 'plugin-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.cpSync(fileURLToPath(new URL('../templates', import.meta.url)), join(root, 'templates'), { recursive: true });
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.name', 'Release test');
  git(root, 'config', 'user.email', 'release-test@example.invalid');
  writePlugin(root, 'sample', '0.1.0');
  writePlugin(root, 'other', '0.1.0');
  commit(root, 'feat: add plugins');
  return root;
}

test('plans per-plugin notes and pins versions to their introduction on main', (t) => {
  const root = fixture(t);
  const initial = planPluginReleases(root, 'owner/repo');
  assert.match(initial.find((release) => release.tag === 'sample/v0.1.0')!.body, /feat: add plugins/);

  fs.writeFileSync(join(root, 'plugins/other/README.md'), 'Other change');
  commit(root, 'docs: change other plugin');
  git(root, 'switch', '-c', 'feature');
  writePlugin(root, 'sample', '0.1.1');
  commit(root, 'fix: correct sample behavior');
  git(root, 'switch', 'main');
  git(root, '-c', 'commit.gpgsign=false', 'merge', '--no-ff', 'feature', '-m', 'Merge pull request #8 from owner/feature\n\nCorrect sample behavior');
  const introduced = git(root, 'rev-parse', 'HEAD');
  fs.writeFileSync(join(root, 'README.md'), 'Repository documentation');
  commit(root, 'docs: explain repository');

  const releases = planPluginReleases(root, 'owner/repo');
  const sample = releases.find((release) => release.tag === 'sample/v0.1.1')!;
  assert.equal(sample.commit, introduced);
  assert.match(sample.body, /Correct sample behavior/);
  assert.match(sample.body, /https:\/\/github.com\/owner\/repo\/pull\/8/);
  assert.doesNotMatch(sample.body, /change other|explain repository|add plugins/);
  assert.deepEqual(releases.find((release) => release.tag === 'other/v0.1.0'), initial.find((release) => release.tag === 'other/v0.1.0'));
});

test('includes only changes since the previous version and escapes Markdown in subjects', (t) => {
  const root = fixture(t);
  fs.writeFileSync(join(root, 'plugins/sample/README.md'), 'Documentation');
  commit(root, 'docs: fix [link](https://example.invalid)');
  for (const path of ['plugin.json', '.claude-plugin/plugin.json']) {
    const file = join(root, 'plugins/sample', path);
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    fs.writeFileSync(file, JSON.stringify({ ...manifest, description: 'Updated metadata' }));
  }
  commit(root, 'docs: clarify sample metadata');
  writePlugin(root, 'sample', '0.1.1');
  commit(root, 'fix: release sample');
  const release = planPluginReleases(root, 'owner/repo').find((item) => item.tag === 'sample/v0.1.1')!;
  assert.ok(release.body.includes('\\[link\\]'));
  assert.match(release.body, /fix: release sample/);
  assert.match(release.body, /clarify sample metadata/);
  assert.doesNotMatch(release.body, /feat: add plugins/);
});

test('rejects uncommitted versions and shallow history', (t) => {
  const root = fixture(t);
  writePlugin(root, 'sample', '0.2.0');
  assert.throws(() => planPluginReleases(root, 'owner/repo'), /not committed/);
  commit(root, 'feat: update sample');
  const shallow = join(root, 'shallow');
  git(root, 'clone', '--depth=1', `file://${root}`, shallow);
  assert.throws(() => planPluginReleases(shallow, 'owner/repo'), /full Git history/);
});

test('the release CLI previews without a token or repository mutations', (t) => {
  const root = fixture(t);
  fs.cpSync(fileURLToPath(new URL('../scripts', import.meta.url)), join(root, 'scripts'), { recursive: true });
  fs.writeFileSync(join(root, 'package.json'), '{"type":"module"}');
  commit(root, 'build: add release command');
  const result = spawnSync(process.execPath, [join(root, 'scripts/publish-releases.ts'), '--repository', 'owner/repo'], {
    env: { ...process.env, GITHUB_TOKEN: '' }, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).map((item: { tag: string }) => item.tag), ['other/v0.1.0', 'sample/v0.1.0']);
  assert.equal(git(root, 'status', '--porcelain'), '');
  assert.equal(git(root, 'tag', '--list'), '');
});

const release = { tag: 'sample/v0.1.1', name: 'sample 0.1.1', commit: 'a'.repeat(40), body: 'Change summary' };
const published = { html_url: 'https://github.com/owner/repo/releases/tag/sample/v0.1.1', draft: false };
const tag = { object: { type: 'commit', sha: release.commit } };
type Reply = { method: string; path: string; status: number; body?: unknown };

function client(t: TestContext, replies: Reply[]) {
  const requests: Array<{ method: string; body: unknown }> = [];
  const requestFetch: typeof fetch = async (input, init) => {
    const expected = replies.shift();
    assert.ok(expected, `Unexpected request: ${input}`);
    assert.equal(String(input), `https://api.github.com/repos/owner/repo${expected.path}`);
    assert.equal(init?.method, expected.method);
    requests.push({ method: init!.method!, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify(expected.body ?? {}), { status: expected.status });
  };
  t.after(() => assert.equal(replies.length, 0, 'All expected requests should be consumed'));
  return { api: githubReleases({ repository: 'owner/repo', token: 'test-token', fetch: requestFetch }), requests };
}

const releasePath = '/releases/tags/sample%2Fv0.1.1';
const tagPath = '/git/ref/tags/sample%2Fv0.1.1';

test('publishes the exact commit without marking one plugin as the repository latest', async (t) => {
  const { api, requests } = client(t, [
    { method: 'GET', path: releasePath, status: 404 },
    { method: 'GET', path: tagPath, status: 404 },
    { method: 'POST', path: '/releases', status: 201, body: published },
  ]);
  assert.deepEqual(await api.publish(release), { created: true, url: published.html_url });
  assert.deepEqual(requests[2].body, {
    tag_name: release.tag, target_commitish: release.commit, name: release.name,
    body: release.body, draft: false, prerelease: false, make_latest: 'false',
  });
});

test('reruns preserve existing release notes and resolve annotated tags', async (t) => {
  const { api, requests } = client(t, [
    { method: 'GET', path: releasePath, status: 200, body: published },
    { method: 'GET', path: tagPath, status: 200, body: { object: { type: 'tag', sha: 'b'.repeat(40) } } },
    { method: 'GET', path: `/git/tags/${'b'.repeat(40)}`, status: 200, body: tag },
  ]);
  assert.deepEqual(await api.publish(release), { created: false, url: published.html_url });
  assert.ok(requests.every((request) => request.method === 'GET'));
});

test('rejects a tag pointing at a different commit without publishing', async (t) => {
  const { api } = client(t, [
    { method: 'GET', path: releasePath, status: 404 },
    { method: 'GET', path: tagPath, status: 200, body: { object: { type: 'commit', sha: 'b'.repeat(40) } } },
  ]);
  await assert.rejects(api.publish(release), /refusing to overwrite/);
});

test('an existing draft is not published implicitly', async (t) => {
  const { api, requests } = client(t, [
    { method: 'GET', path: releasePath, status: 200, body: { ...published, draft: true } },
    { method: 'GET', path: tagPath, status: 200, body: tag },
  ]);
  await assert.rejects(api.publish(release), /not a published release/);
  assert.ok(requests.every((request) => request.method === 'GET'));
});

test('treats a concurrent create as success only after checking the tag', async (t) => {
  const { api } = client(t, [
    { method: 'GET', path: releasePath, status: 404 },
    { method: 'GET', path: tagPath, status: 404 },
    { method: 'POST', path: '/releases', status: 422 },
    { method: 'GET', path: releasePath, status: 200, body: published },
    { method: 'GET', path: tagPath, status: 200, body: tag },
  ]);
  assert.deepEqual(await api.publish(release), { created: false, url: published.html_url });
});

test('API failures stop publication and allow a later retry', async (t) => {
  const { api } = client(t, [
    { method: 'GET', path: releasePath, status: 403 },
    { method: 'GET', path: releasePath, status: 404 },
    { method: 'GET', path: tagPath, status: 404 },
    { method: 'POST', path: '/releases', status: 500 },
    { method: 'GET', path: releasePath, status: 404 },
    { method: 'GET', path: tagPath, status: 200, body: tag },
    { method: 'POST', path: '/releases', status: 201, body: published },
  ]);
  await assert.rejects(api.publish(release), /HTTP 403/);
  await assert.rejects(api.publish(release), /HTTP 500/);
  assert.equal((await api.publish(release)).created, true);
});

test('publishing from a PR or local shell is refused before contacting GitHub', () => {
  const script = fileURLToPath(new URL('../scripts/publish-releases.ts', import.meta.url));
  for (const env of [
    { GITHUB_ACTIONS: 'false', GITHUB_REF: 'refs/heads/main' },
    { GITHUB_ACTIONS: 'true', GITHUB_REF: 'refs/pull/1/merge' },
  ]) {
    const result = spawnSync(process.execPath, [script, '--repository', 'owner/repo', '--publish'], {
      env: { ...process.env, ...env }, encoding: 'utf8', timeout: 10000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Publish only/);
  }
});
