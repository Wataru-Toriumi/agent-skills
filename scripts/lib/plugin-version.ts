import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

export type ReleaseType = 'patch' | 'minor' | 'major';
type Manifest = Record<string, unknown> & { name: string; version: string };
type Edit = { path: string; before: string | null; after: string };

const manifestPaths = ['plugin.json', '.claude-plugin/plugin.json'];
const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function validName(name: string): boolean {
  return name === name.trim() && name.length <= 63 && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name);
}

function validVersion(version: string): boolean {
  return version === version.trim() && stableVersion.test(version);
}

export function nextVersion(version: string, release: ReleaseType): string {
  if (!validVersion(version)) {
    throw new Error(`Unsupported version: ${version}. Use a stable version such as 0.1.0.`);
  }
  const [major, minor, patch] = version.split('.').map(BigInt);
  switch (release) {
    case 'patch': return `${major}.${minor}.${patch + 1n}`;
    case 'minor': return `${major}.${minor + 1n}.0`;
    case 'major': return `${major + 1n}.0.0`;
    default: throw new Error('Release type must be patch, minor or major.');
  }
}

function assertDirectory(path: string): void {
  if (!fs.lstatSync(path).isDirectory()) {
    throw new Error(`Expected a directory, not a symlink or file: ${path}`);
  }
}

function readRegularFile(path: string, optional = false): string | null {
  let stat;
  try {
    stat = fs.lstatSync(path);
  } catch (error) {
    if (optional && (error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  if (!stat.isFile()) throw new Error(`Expected a regular file: ${path}`);
  return fs.readFileSync(path, 'utf8');
}

function readManifests(directory: string, expectedName?: string) {
  assertDirectory(directory);
  assertDirectory(join(directory, '.claude-plugin'));
  const files = manifestPaths.map((relative) => {
    const path = join(directory, relative);
    const before = readRegularFile(path)!;
    const manifest = JSON.parse(before) as Manifest;
    if (!manifest || typeof manifest.name !== 'string' || !validName(manifest.name)
        || typeof manifest.version !== 'string' || !validVersion(manifest.version)) {
      throw new Error(`Invalid name or stable version in ${path}`);
    }
    return { path, before, manifest };
  });
  const reference = files[0].manifest;
  if (expectedName && reference.name !== expectedName) {
    throw new Error(`Plugin directory and manifest name disagree: ${expectedName}`);
  }
  for (const { manifest } of files) {
    if (manifest.name !== reference.name || manifest.version !== reference.version) {
      throw new Error(`Manifest name/version mismatch in ${directory}. Fix the mismatch before versioning.`);
    }
  }
  return files;
}

export function checkVersions(root: string): string[] {
  readManifests(join(root, 'templates/plugin'));
  const pluginsDirectory = join(root, 'plugins');
  assertDirectory(pluginsDirectory);
  const names = fs.readdirSync(pluginsDirectory).filter((name) => !name.startsWith('.')).sort();
  for (const name of names) {
    if (!validName(name)) throw new Error(`Invalid plugin directory name: ${name}`);
    readManifests(join(pluginsDirectory, name), name);
  }
  return names;
}

// Prepare all writes first; restore completed replacements if a later rename fails.
function applyEdits(edits: Edit[]): void {
  const prepared: Array<Edit & { temporary: string }> = [];
  const applied: Edit[] = [];
  try {
    for (const edit of edits) {
      const temporary = `${edit.path}.${randomUUID()}.tmp`;
      prepared.push({ ...edit, temporary });
      fs.writeFileSync(temporary, edit.after, { encoding: 'utf8', flag: 'wx' });
    }
    for (const edit of prepared) {
      fs.renameSync(edit.temporary, edit.path);
      applied.push(edit);
    }
  } catch (error) {
    for (const edit of applied.reverse()) {
      if (edit.before === null) fs.rmSync(edit.path);
      else fs.writeFileSync(edit.path, edit.before, 'utf8');
    }
    throw error;
  } finally {
    for (const { temporary } of prepared) fs.rmSync(temporary, { force: true });
  }
}

export function versionPlugin(
  root: string,
  name: string,
  release: ReleaseType,
  message: string,
  dryRun = false,
): { previous: string; next: string; files: string[] } {
  if (!validName(name)) throw new Error('Provide a kebab-case plugin name (maximum 63 characters).');
  if (!message.trim()) throw new Error('--message must describe the change.');
  const pluginsDirectory = join(root, 'plugins');
  assertDirectory(pluginsDirectory);
  const directory = join(pluginsDirectory, name);
  const manifests = readManifests(directory, name);
  const previous = manifests[0].manifest.version;
  const next = nextVersion(previous, release);
  const changelogPath = join(directory, 'CHANGELOG.md');
  const changelog = readRegularFile(changelogPath, true);
  if (changelog !== null && !changelog.startsWith('# Changelog\n')) {
    throw new Error('CHANGELOG.md must start with "# Changelog" followed by a newline.');
  }
  if (changelog?.split('\n').some((line) => line.startsWith(`## [${next}]`))) {
    throw new Error(`CHANGELOG.md already contains version ${next}.`);
  }
  const date = new Date().toISOString().slice(0, 10);
  const summary = message.trim().split(/\r?\n/).join('\n  ');
  const history = changelog?.slice('# Changelog\n'.length).trimStart() ?? '';
  const entry = `## [${next}] - ${date}\n\n- ${summary}\n`;
  const edits: Edit[] = manifests.map(({ path, before, manifest }) => ({
    path, before, after: `${JSON.stringify({ ...manifest, version: next }, null, 2)}\n`,
  }));
  edits.push({
    path: changelogPath,
    before: changelog,
    after: `# Changelog\n\n${entry}${history ? `\n${history}` : ''}`,
  });
  if (!dryRun) applyEdits(edits);
  return { previous, next, files: edits.map(({ path }) => path) };
}
