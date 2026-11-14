type Rule = { type: string; parameters?: Record<string, unknown> };
export type Ruleset = {
  name: string;
  target: string;
  enforcement: string;
  bypass_actors: unknown[];
  conditions: { ref_name: { include: string[]; exclude: string[] } };
  rules: Rule[];
};
type ExistingRuleset = Ruleset & { id: number; source_type: string; source: string };
const workflows = ['validate.yml', 'distribution.yml', 'version-policy.yml'];

// Compare only configured fields; GitHub may return additional defaults and metadata.
const contains = (actual: unknown, expected: unknown): boolean => {
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((value) => actual.some((candidate) => contains(candidate, value)))
    );
  }
  if (expected !== null && typeof expected === 'object') {
    return (
      actual !== null &&
      typeof actual === 'object' &&
      Object.entries(expected).every(([key, value]) =>
        contains((actual as Record<string, unknown>)[key], value),
      )
    );
  }
  return actual === expected;
};

export const syncMainRules = async (options: {
  repository: string;
  desired: Ruleset;
  token?: string;
  apply?: boolean;
  fetch?: typeof fetch;
}) => {
  const { repository, desired, apply = false } = options;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Expected owner/repository.');
  if (
    desired.name !== 'main-quality-gate' ||
    desired.target !== 'branch' ||
    !contains(desired.conditions, { ref_name: { include: ['refs/heads/main'], exclude: [] } })
  ) {
    throw new Error('This command only manages main-quality-gate for main.');
  }
  if (apply && !options.token)
    throw new Error('An Administration:write token is required for --apply.');
  const requestFetch = options.fetch ?? fetch;
  const request = async (path: string, method = 'GET', body?: unknown) => {
    const response = await requestFetch(`https://api.github.com/repos/${repository}${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status === 404 && method === 'GET') return null;
    if (!response.ok) throw new Error(`GitHub ${method} ${path}: HTTP ${response.status}`);
    return response.json();
  };
  const listed: ExistingRuleset[] = [];
  for (let page = 1; ; page += 1) {
    const entries = await request(`/rulesets?includes_parents=false&per_page=100&page=${page}`);
    if (!Array.isArray(entries)) throw new Error('Could not list repository rulesets.');
    listed.push(...entries);
    if (entries.length < 100) break;
  }
  const matches = listed.filter((item) => item.name === desired.name);
  if (matches.length > 1)
    throw new Error('Duplicate managed rulesets; resolve them before applying.');
  const found = matches[0];
  if (
    found &&
    (found.source_type !== 'Repository' || found.source.toLowerCase() !== repository.toLowerCase())
  ) {
    throw new Error('Refusing to update an inherited ruleset.');
  }
  const current: ExistingRuleset | null = found ? await request(`/rulesets/${found.id}`) : null;
  if (found && !current) throw new Error('Managed ruleset disappeared; inspect before retrying.');
  const missingWorkflows: string[] = [];
  for (const file of workflows) {
    if (!(await request(`/contents/.github/workflows/${file}?ref=main`)))
      missingWorkflows.push(file);
  }
  // Read-only callers may not receive bypass_actors. Absence is not an empty list.
  const unobservedFields =
    current && !Object.hasOwn(current, 'bypass_actors') ? ['bypass_actors'] : [];
  const observable = { ...desired } as Record<string, unknown>;
  for (const field of unobservedFields) delete observable[field];
  const action = !current
    ? 'create'
    : !contains(current, observable)
      ? 'update'
      : unobservedFields.length
        ? 'inspect'
        : 'unchanged';
  const plan = { action, current, desired, missingWorkflows, unobservedFields };
  if (!apply) return { ...plan, applied: false };
  if (unobservedFields.length)
    throw new Error(
      `Cannot inspect current settings: ${unobservedFields.join(', ')}. Use a token with ruleset write access.`,
    );
  if (missingWorkflows.length)
    throw new Error(`Merge prerequisite workflows first: ${missingWorkflows.join(', ')}`);
  if (action === 'unchanged') return { ...plan, applied: true };
  const result = await request(
    current ? `/rulesets/${current.id}` : '/rulesets',
    current ? 'PUT' : 'POST',
    desired,
  );
  if (!Number.isInteger(result?.id))
    throw new Error('GitHub did not return a ruleset ID; inspect before retrying.');
  const verified = await request(`/rulesets/${result.id}`);
  if (!contains(verified, desired))
    throw new Error('Applied ruleset differs from the requested configuration.');
  return { ...plan, applied: true, id: result.id };
};
