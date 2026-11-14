import type { PluginRelease } from './release-notes.ts';

type Options = { repository: string; token: string; fetch?: typeof fetch };
type ReleaseResponse = { html_url: string; draft: boolean };
type GitObject = { type: string; sha: string };

export const githubReleases = (options: Options) => {
  if (!/^[\w.-]+\/[\w.-]+$/.test(options.repository))
    throw new Error('Expected an owner/repository name.');
  if (!options.token) throw new Error('GITHUB_TOKEN is required.');
  const requestFetch = options.fetch ?? fetch;
  const base = `https://api.github.com/repos/${options.repository}`;

  const request = async (path: string, body?: unknown): Promise<Response> => {
    return requestFetch(`${base}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${options.token}`,
        'X-GitHub-Api-Version': '2026-03-10',
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  };

  const read = async <T>(path: string): Promise<T | null> => {
    const response = await request(path);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub GET ${path}: HTTP ${response.status}`);
    return response.json() as Promise<T>;
  };

  const checkTag = async (release: PluginRelease): Promise<boolean> => {
    const ref = await read<{ object: GitObject }>(
      `/git/ref/tags/${encodeURIComponent(release.tag)}`,
    );
    if (!ref) return false;
    let object = ref.object;
    for (let depth = 0; object.type === 'tag' && depth < 10; depth += 1) {
      const tag = await read<{ object: GitObject }>(`/git/tags/${object.sha}`);
      if (!tag) throw new Error(`Missing annotated tag object: ${object.sha}`);
      object = tag.object;
    }
    if (object.type !== 'commit' || object.sha !== release.commit) {
      throw new Error(
        `Tag ${release.tag} does not point to ${release.commit}; refusing to overwrite it.`,
      );
    }
    return true;
  };

  return {
    async publish(release: PluginRelease): Promise<{ created: boolean; url: string }> {
      const path = `/releases/tags/${encodeURIComponent(release.tag)}`;
      const existing = await read<ReleaseResponse>(path);
      if (existing) {
        if (!(await checkTag(release)) || existing.draft) {
          throw new Error(
            `Release ${release.tag} is not a published release with the expected tag.`,
          );
        }
        return { created: false, url: existing.html_url };
      }
      await checkTag(release);
      const response = await request('/releases', {
        tag_name: release.tag,
        target_commitish: release.commit,
        name: release.name,
        body: release.body,
        draft: false,
        prerelease: false,
        make_latest: 'false',
      });
      if (!response.ok) {
        // Another run may have published the same version after our GET.
        const concurrent = response.status === 422 ? await read<ReleaseResponse>(path) : null;
        if (concurrent && !concurrent.draft && (await checkTag(release))) {
          return { created: false, url: concurrent.html_url };
        }
        throw new Error(`GitHub POST /releases (${release.tag}): HTTP ${response.status}`);
      }
      const published = (await response.json()) as ReleaseResponse;
      return { created: true, url: published.html_url };
    },
  };
};
