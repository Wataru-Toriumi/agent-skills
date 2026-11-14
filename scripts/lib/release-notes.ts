import { execFileSync } from 'node:child_process';
import { checkPluginVersions } from './plugin-commands.ts';
import { pluginDirectory, readPluginDirectory } from './plugin-files.ts';
import { isStableVersion } from './releases.ts';

export type PluginRelease = {
  tag: string;
  name: string;
  commit: string;
  body: string;
};

export function git(root: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function versionAt(root: string, commit: string, path: string): string {
  const manifest = JSON.parse(git(root, 'show', `${commit}:${path}`));
  if (!isStableVersion(manifest.version)) {
    throw new Error(`Invalid version in ${commit}:${path}`);
  }
  return manifest.version;
}

function versionRange(root: string, path: string, version: string) {
  // First-parent history identifies the main commit that introduced this version.
  const commits = git(root, 'log', '--first-parent', '--format=%H', 'HEAD', '--', path)
    .split('\n').filter(Boolean);
  let commit: string | undefined;
  let previous: string | undefined;
  let previousVersion: string | undefined;
  for (const candidate of commits) {
    const candidateVersion = versionAt(root, candidate, path);
    if (previousVersion !== undefined) {
      if (candidateVersion !== previousVersion) break;
      previous = candidate;
    } else if (candidateVersion === version) {
      commit = candidate;
    } else {
      if (!commit) throw new Error(`Version ${version} is not committed: ${path}`);
      previousVersion = candidateVersion;
      previous = candidate;
    }
  }
  if (!commit) throw new Error(`No committed history for ${path}`);
  return { commit, previous };
}

function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}\[\]<>#|]/g, '\\$&');
}

export function planPluginReleases(root: string, repository: string): PluginRelease[] {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Expected an owner/repository name.');
  if (git(root, 'rev-parse', '--is-shallow-repository') === 'true') {
    throw new Error('Release notes require full Git history (fetch-depth: 0).');
  }
  const { plugins } = checkPluginVersions(root);
  return plugins.map((name) => {
    const { version } = readPluginDirectory(pluginDirectory(root, name), name);
    const path = `plugins/${name}`;
    const { commit, previous } = versionRange(root, `${path}/plugin.json`, version);
    if (git(root, 'status', '--porcelain', '--untracked-files=all', '--', path)) {
      throw new Error(`Uncommitted distribution changes: ${name}`);
    }
    if (git(root, 'rev-parse', `HEAD:${path}`) !== git(root, 'rev-parse', `${commit}:${path}`)) {
      throw new Error(`Distribution changed after version ${version} was introduced: ${name}. Increase its version before publishing.`);
    }
    const range = previous ? `${previous}..${commit}` : commit;
    const log = git(root, 'log', '--first-parent', '--format=%H%x09%s', range, '--', path);
    const changes = log.split('\n').filter(Boolean).map((line) => {
      const [sha, ...subject] = line.split('\t');
      const summary = subject.join('\t');
      const merge = /^Merge pull request #(\d+)\b/.exec(summary);
      const title = merge ? git(root, 'show', '-s', '--format=%b', sha).split('\n')[0] || summary : summary;
      const url = merge ? `https://github.com/${repository}/pull/${merge[1]}` : `https://github.com/${repository}/commit/${sha}`;
      return `- ${escapeMarkdown(title)} ([${merge ? `#${merge[1]}` : sha.slice(0, 7)}](${url}))`;
    });
    const tag = `${name}/v${version}`;
    const comparison = previous
      ? `https://github.com/${repository}/compare/${previous}...${commit}`
      : `https://github.com/${repository}/tree/${commit}/${path}`;
    return {
      tag,
      name: `${name} ${version}`,
      commit,
      body: [`## ${name} ${version}`, '', ...changes, '', `[変更範囲](${comparison})`, ''].join('\n'),
    };
  });
}
