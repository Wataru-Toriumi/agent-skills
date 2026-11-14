import fs from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { parseDocument } from 'yaml';
import { assertDirectory, readTextFile } from './files.ts';
import { checkPluginVersions } from './plugin-commands.ts';
import {
  assertPluginName,
  pluginDirectory,
  readMarketplace,
  templateDirectory,
} from './plugin-files.ts';

const inside = (root: string, target: string): boolean => {
  const path = relative(root, target);
  return path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path);
};

const filesIn = (directory: string): string[] => {
  return fs.readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    const stat = fs.lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error(`Symlinks are not distributable: ${path}`);
    if (stat.isDirectory()) return filesIn(path);
    if (!stat.isFile()) throw new Error(`Expected a regular distribution file: ${path}`);
    return [path];
  });
};

const checkTarget = (root: string, file: string, target: string): void => {
  if (/^(https?:|mailto:)/i.test(target) || target.startsWith('#')) return;
  const path = decodeURIComponent(target.split(/[?#]/)[0]);
  if (!path || /^[a-z][a-z\d+.-]*:/i.test(path) || isAbsolute(path) || path.includes('\\')) {
    throw new Error(`Unsupported local reference in ${file}: ${target}`);
  }
  const resolved = resolve(dirname(file), path);
  if (!inside(root, resolved)) throw new Error(`Reference escapes plugin in ${file}: ${target}`);
  if (!fs.existsSync(resolved)) throw new Error(`Missing reference in ${file}: ${target}`);
  if (!inside(fs.realpathSync(root), fs.realpathSync(resolved))) {
    throw new Error(`Reference escapes plugin through a symlink in ${file}: ${target}`);
  }
};

const skillBody = (file: string): string => {
  const text = readTextFile(file).content;
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) throw new Error(`Missing YAML frontmatter: ${file}`);
  const document = parseDocument(match[1], { uniqueKeys: true });
  if (document.errors.length)
    throw new Error(`Invalid frontmatter in ${file}: ${document.errors[0].message}`);
  const data = document.toJS();
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error(`Invalid skill metadata: ${file}`);
  assertPluginName(data.name);
  if (data.name !== basename(dirname(file)))
    throw new Error(`Skill name/directory mismatch: ${file}`);
  if (typeof data.description !== 'string' || !data.description.trim()) {
    throw new Error(`Missing skill description: ${file}`);
  }
  const body = text.slice(match[0].length);
  if (!body.trim()) throw new Error(`Empty skill body: ${file}`);
  return body;
};

const checkMarkdown = (root: string, file: string, body: string): void => {
  const tree = fromMarkdown(body);
  const definitions = new Map<string, string>();
  const references: string[] = [];
  const visit = (node: typeof tree | (typeof tree.children)[number]): void => {
    if (node.type === 'definition') definitions.set(node.identifier, node.url);
    if (node.type === 'link' || node.type === 'image') checkTarget(root, file, node.url);
    if (node.type === 'linkReference' || node.type === 'imageReference')
      references.push(node.identifier);
    if (node.type === 'html') {
      for (const match of node.value.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
        checkTarget(root, file, match[1]);
      }
    }
    if ('children' in node)
      for (const child of node.children) visit(child as (typeof tree.children)[number]);
  };
  visit(tree);
  for (const identifier of references) {
    const target = definitions.get(identifier);
    if (target === undefined) throw new Error(`Undefined reference ${identifier}: ${file}`);
    checkTarget(root, file, target);
  }
};

const checkContents = (directory: string): void => {
  const files = filesIn(directory);
  const skills = join(directory, 'skills');
  assertDirectory(skills);
  const names = fs.readdirSync(skills);
  if (!names.length) throw new Error(`No skills in ${directory}`);
  for (const name of names) {
    assertPluginName(name);
    assertDirectory(join(skills, name));
    const file = join(skills, name, 'SKILL.md');
    checkMarkdown(directory, file, skillBody(file));
  }
  for (const file of files) {
    // Assets are output templates: their links may intentionally name future output files.
    if (
      !file.endsWith('.md') ||
      basename(file) === 'SKILL.md' ||
      relative(directory, file).split(sep).includes('assets')
    )
      continue;
    checkMarkdown(directory, file, readTextFile(file).content);
  }
};

export const checkPluginDistribution = (root: string): { plugins: string[] } => {
  const result = checkPluginVersions(root);
  const { catalog } = readMarketplace(root);
  const registered = new Set<string>();
  for (const entry of catalog.plugins) {
    assertPluginName(entry.name);
    if (registered.has(entry.name))
      throw new Error(`Duplicate marketplace registration: ${entry.name}`);
    registered.add(entry.name);
    if (entry.source !== `./plugins/${entry.name}`)
      throw new Error(`Invalid marketplace source for ${entry.name}: ${entry.source}`);
    if (!result.plugins.includes(entry.name))
      throw new Error(`Marketplace plugin does not exist: ${entry.name}`);
  }
  for (const name of result.plugins) {
    if (!registered.has(name)) throw new Error(`Plugin missing from marketplace: ${name}`);
    checkContents(pluginDirectory(root, name));
  }
  checkContents(templateDirectory(root));
  return result;
};
