import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { githubReleases } from './lib/github-releases.ts';
import { git, planPluginReleases } from './lib/release-notes.ts';

const root = fileURLToPath(new URL('../', import.meta.url));

const main = async (): Promise<void> => {
  const { values } = parseArgs({
    options: {
      publish: { type: 'boolean', default: false },
      repository: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log('Usage: pnpm plugin:release --repository <owner/repo> [--publish]');
    console.log('Previews notes by default. Publishing is restricted to GitHub Actions on main.');
    return;
  }
  const repository = values.repository ?? process.env.GITHUB_REPOSITORY;
  if (!repository) throw new Error('--repository or GITHUB_REPOSITORY is required.');
  if (values.publish) {
    if (
      process.env.GITHUB_ACTIONS !== 'true' ||
      process.env.GITHUB_REF !== 'refs/heads/main' ||
      git(root, 'rev-parse', 'HEAD') !== process.env.GITHUB_SHA
    ) {
      throw new Error('Publish only from a checked-out main commit in GitHub Actions.');
    }
    if (git(root, 'status', '--porcelain'))
      throw new Error('Publishing requires a clean working tree.');
  }
  const releases = planPluginReleases(root, repository);
  if (!values.publish) {
    console.log(JSON.stringify(releases, null, 2));
    return;
  }
  const client = githubReleases({ repository, token: process.env.GITHUB_TOKEN ?? '' });
  for (const release of releases) {
    const result = await client.publish(release);
    console.log(`${result.created ? 'Created' : 'Exists'}: ${result.url}`);
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
