import fs from 'node:fs';
import { join } from 'node:path';
import { applyFileEdits, formatJson } from './files.ts';
import {
  assertPluginName,
  listPluginNames,
  planManifestEdits,
  pluginDirectory,
  readMarketplace,
  readPluginDirectory,
  templateDirectory,
} from './plugin-files.ts';
import { nextVersion } from './releases.ts';
import type { ReleaseType } from './releases.ts';

type CreatePluginOptions = {
  name: string;
  description: string;
};

type VersionPluginOptions = {
  name: string;
  release: ReleaseType;
  dryRun?: boolean;
};

type VersionResult = {
  previous: string;
  next: string;
  files: string[];
};

export function createPlugin(root: string, options: CreatePluginOptions): { marketplace: string } {
  const { name, description } = options;
  assertPluginName(name);
  if (!description.trim()) {
    throw new Error('--description must not be empty.');
  }

  const { file, catalog } = readMarketplace(root);
  if (catalog.plugins.some((plugin) => plugin.name === name)) {
    throw new Error(`Already registered: ${name}`);
  }

  const directory = pluginDirectory(root, name);
  // Keep mkdir exclusive: cleanup below must only remove a directory we created.
  fs.mkdirSync(directory);
  try {
    fs.cpSync(templateDirectory(root), directory, { recursive: true });
    const plugin = readPluginDirectory(directory);
    const updatedCatalog = {
      ...catalog,
      plugins: [...catalog.plugins, { name, source: `./plugins/${name}` }],
    };
    applyFileEdits([
      ...planManifestEdits(plugin, { name, description }),
      { path: file.path, before: file.content, after: formatJson(updatedCatalog) },
    ]);
  } catch (error) {
    fs.rmSync(directory, { recursive: true, force: true });
    throw error;
  }
  return { marketplace: catalog.name };
}

export function checkPluginVersions(root: string): { plugins: string[] } {
  readPluginDirectory(templateDirectory(root));
  const plugins = listPluginNames(root);
  for (const name of plugins) {
    readPluginDirectory(pluginDirectory(root, name), name);
  }
  return { plugins };
}

export function versionPlugin(root: string, options: VersionPluginOptions): VersionResult {
  const { name, release, dryRun = false } = options;
  assertPluginName(name);

  const plugin = readPluginDirectory(pluginDirectory(root, name), name);
  const next = nextVersion(plugin.version, release);
  const edits = planManifestEdits(plugin, { version: next });

  if (!dryRun) {
    applyFileEdits(edits);
  }
  return { previous: plugin.version, next, files: edits.map((edit) => edit.path) };
}
