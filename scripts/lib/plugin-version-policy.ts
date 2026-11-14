import { execFileSync } from 'node:child_process';
import { isStableVersion } from './releases.ts';

function git(root: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function commit(root: string, ref: string): string {
  return git(root, 'rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`);
}

function manifest(root: string, ref: string, name: string) {
  const paths = ['plugin.json', '.claude-plugin/plugin.json'];
  const values = paths.map(path => JSON.parse(git(root, 'show', `${ref}:plugins/${name}/${path}`)));
  if (values.some(value => value.name !== name || !isStableVersion(value.version))
    || values[0].version !== values[1].version) {
    throw new Error(`Invalid or mismatched manifest versions: ${name} at ${ref}`);
  }
  return values[0].version as string;
}

function exists(root: string, ref: string, path: string): boolean {
  return git(root, 'ls-tree', '--name-only', ref, '--', path) !== '';
}

export function greaterVersion(next: string, previous: string): boolean {
  if (!isStableVersion(next) || !isStableVersion(previous)) throw new Error('Expected stable versions.');
  const left = next.split('.').map(BigInt), right = previous.split('.').map(BigInt);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] > right[index];
  }
  return false;
}

export function checkVersionChanges(root: string, baseRef: string, headRef: string): string[] {
  const base = commit(root, baseRef), head = commit(root, headRef);
  const paths = execFileSync('git', ['diff', '--name-only', '--no-renames', '-z', base, head, '--', 'plugins/'], {
    cwd: root, encoding: 'utf8',
  }).split('\0').filter(Boolean);
  const names = [...new Set(paths.map(path => path.split('/')[1]))].sort();
  for (const name of names) {
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) throw new Error(`Invalid plugin path: ${name}`);
    if (!exists(root, head, `plugins/${name}`)) continue; // Removal has no new artifact to version.
    const next = manifest(root, head, name);
    if (!exists(root, base, `plugins/${name}`)) continue;
    const previous = manifest(root, base, name);
    if (!greaterVersion(next, previous)) {
      throw new Error(`Distribution changed without a version increase: ${name} (${previous} -> ${next}). Run pnpm plugin:version ${name} patch.`);
    }
  }
  return names;
}
