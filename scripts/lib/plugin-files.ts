import fs from 'node:fs';
import { join } from 'node:path';
import { assertDirectory, formatJson, readJsonFile } from './files.ts';
import type { FileEdit, TextFile } from './files.ts';
import { isStableVersion } from './releases.ts';

type Manifest = Record<string, unknown> & { name: string; version: string };
type ManifestFile = { file: TextFile; manifest: Manifest };
type ManifestChanges = { name?: string; version?: string; description?: string };
type CatalogEntry = Record<string, unknown> & { name: string };
type Catalog = Record<string, unknown> & { name: string; plugins: CatalogEntry[] };

export type PluginFiles = {
  directory: string;
  name: string;
  version: string;
  manifests: [ManifestFile, ManifestFile];
};

const manifestPaths = {
  portable: 'plugin.json',
  claude: '.claude-plugin/plugin.json',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPluginName(value: unknown): value is string {
  return typeof value === 'string'
    && value === value.trim()
    && value.length <= 63
    && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value);
}

export function assertPluginName(value: unknown): asserts value is string {
  if (!isPluginName(value)) {
    throw new Error('Provide a kebab-case plugin name (maximum 63 characters).');
  }
}

function assertManifest(value: unknown, path: string): asserts value is Manifest {
  if (!isRecord(value) || !isPluginName(value.name) || !isStableVersion(value.version)) {
    throw new Error(`Invalid name or stable version in ${path}`);
  }
}

function assertCatalog(value: unknown): asserts value is Catalog {
  if (!isRecord(value) || typeof value.name !== 'string' || !Array.isArray(value.plugins)) {
    throw new Error('Invalid marketplace: name and plugins are required.');
  }
  if (!value.plugins.every((entry: unknown) => isRecord(entry) && typeof entry.name === 'string')) {
    throw new Error('Invalid marketplace: each plugin must have a name.');
  }
}

function readManifest(path: string): ManifestFile {
  const { file, value } = readJsonFile(path);
  assertManifest(value, path);
  return { file, manifest: value };
}

export function readPluginDirectory(directory: string, expectedName?: string): PluginFiles {
  assertDirectory(directory);
  assertDirectory(join(directory, '.claude-plugin'));
  const portable = readManifest(join(directory, manifestPaths.portable));
  const claude = readManifest(join(directory, manifestPaths.claude));
  const { name, version } = portable.manifest;

  if (expectedName !== undefined && name !== expectedName) {
    throw new Error(`Plugin directory and manifest name disagree: ${expectedName}`);
  }
  if (claude.manifest.name !== name || claude.manifest.version !== version) {
    throw new Error(`Manifest name/version mismatch in ${directory}. Fix the mismatch before versioning.`);
  }
  if (typeof portable.manifest.description !== 'string' || !portable.manifest.description.trim()
    || claude.manifest.description !== portable.manifest.description) {
    throw new Error(`Manifest description missing or mismatch in ${directory}.`);
  }
  return { directory, name, version, manifests: [portable, claude] };
}

export function pluginDirectory(root: string, name: string): string {
  assertPluginName(name);
  const directory = join(root, 'plugins');
  assertDirectory(directory);
  return join(directory, name);
}

export function templateDirectory(root: string): string {
  return join(root, 'templates/plugin');
}

export function listPluginNames(root: string): string[] {
  const directory = join(root, 'plugins');
  assertDirectory(directory);
  return fs.readdirSync(directory).filter((name) => !name.startsWith('.')).sort();
}

export function readMarketplace(root: string): { file: TextFile; catalog: Catalog } {
  const { file, value } = readJsonFile(join(root, '.claude-plugin/marketplace.json'));
  assertCatalog(value);
  return { file, catalog: value };
}

export function planManifestEdits(plugin: PluginFiles, changes: ManifestChanges): FileEdit[] {
  return plugin.manifests.map(({ file, manifest }) => ({
    path: file.path,
    before: file.content,
    after: formatJson({ ...manifest, ...changes }),
  }));
}
