import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import type { Ruleset } from '../scripts/lib/repository-rules.ts';
import { syncMainRules } from '../scripts/lib/repository-rules.ts';

const desired: Ruleset = JSON.parse(
  fs.readFileSync(new URL('../.github/rulesets/main-quality-gate.json', import.meta.url), 'utf8'),
);
const existing = { ...desired, id: 42, source: 'owner/repo', source_type: 'Repository' };
const api = (
  options: {
    existing?: typeof existing;
    missing?: boolean;
    badReadback?: boolean;
    failWrite?: boolean;
  } = {},
) => {
  const calls: Array<{ method: string; path: string; body?: unknown }> = [];
  let writes = 0;
  const mockFetch: typeof fetch = async (input, init) => {
    const path = new URL(String(input)).pathname.replace('/repos/owner/repo', '');
    const method = init?.method ?? 'GET';
    calls.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (method !== 'GET') {
      writes++;
      return new Response(JSON.stringify({ id: 42 }), { status: options.failWrite ? 403 : 200 });
    }
    if (path === '/rulesets') return Response.json(options.existing ? [options.existing] : []);
    if (path.startsWith('/contents/'))
      return new Response('{}', { status: options.missing ? 404 : 200 });
    if (path === '/rulesets/42')
      return Response.json(
        writes
          ? { ...existing, enforcement: options.badReadback ? 'disabled' : 'active' }
          : options.existing,
      );
    throw new Error(`Unexpected ${method} ${path}`);
  };
  return { calls, fetch: mockFetch };
};

test('the main gate requires PRs and exact CI producers without bypass actors', () => {
  assert.equal(desired.enforcement, 'active');
  assert.deepEqual(desired.bypass_actors, []);
  assert.ok(desired.rules.some((rule) => rule.type === 'pull_request'));
  const parameters = desired.rules.find(
    (rule) => rule.type === 'required_status_checks',
  )?.parameters;
  assert.ok(parameters);
  assert.equal(parameters.strict_required_status_checks_policy, true);
  assert.deepEqual(
    parameters.required_status_checks,
    [
      'Validate (Node 24.12.0)',
      'Validate (Node 26)',
      'Distribution validation',
      'Plugin version policy',
    ].map((context) => ({ context, integration_id: 15368 })),
  );
});

test('default plans only and exposes missing prerequisite workflows', async () => {
  const mock = api({ missing: true });
  const plan = await syncMainRules({ repository: 'owner/repo', desired, fetch: mock.fetch });
  assert.equal(plan.applied, false);
  assert.equal(plan.missingWorkflows.length, 3);
  assert.ok(mock.calls.every((call) => call.method === 'GET'));
});

test('apply refuses missing credentials or prerequisite workflows without writes', async () => {
  const mock = api({ missing: true });
  await assert.rejects(
    syncMainRules({ repository: 'owner/repo', desired, apply: true, fetch: mock.fetch }),
    /token/,
  );
  assert.equal(mock.calls.length, 0);
  await assert.rejects(
    syncMainRules({
      repository: 'owner/repo',
      desired,
      apply: true,
      token: 'test',
      fetch: mock.fetch,
    }),
    /prerequisite/,
  );
  assert.ok(mock.calls.every((call) => call.method === 'GET'));
});

test('creates only the managed ruleset and checks the response by reading it back', async () => {
  const mock = api();
  const result = await syncMainRules({
    repository: 'owner/repo',
    desired,
    apply: true,
    token: 'test',
    fetch: mock.fetch,
  });
  assert.equal(result.applied, true);
  assert.deepEqual(
    mock.calls.filter((call) => call.method !== 'GET'),
    [{ method: 'POST', path: '/rulesets', body: desired }],
  );
  assert.equal(mock.calls.at(-1)?.path, '/rulesets/42');
});

test('is idempotent and updates only its own ruleset', async () => {
  const same = api({ existing });
  const result = await syncMainRules({
    repository: 'owner/repo',
    desired,
    apply: true,
    token: 'test',
    fetch: same.fetch,
  });
  assert.equal(result.action, 'unchanged');
  assert.ok(same.calls.every((call) => call.method === 'GET'));
  const changed = api({ existing: { ...existing, enforcement: 'disabled' } });
  await syncMainRules({
    repository: 'owner/repo',
    desired,
    apply: true,
    token: 'test',
    fetch: changed.fetch,
  });
  assert.deepEqual(
    changed.calls.filter((call) => call.method !== 'GET').map((call) => [call.method, call.path]),
    [['PUT', '/rulesets/42']],
  );
});

for (const options of [{ failWrite: true }, { badReadback: true }]) {
  test(`stops on ${options.failWrite ? 'permission failure' : 'readback mismatch'}`, async () => {
    const mock = api(options);
    await assert.rejects(
      syncMainRules({
        repository: 'owner/repo',
        desired,
        apply: true,
        token: 'test',
        fetch: mock.fetch,
      }),
      /HTTP 403|differs/,
    );
    assert.equal(mock.calls.filter((call) => call.method !== 'GET').length, 1);
  });
}

test('does not mutate inherited or ambiguously named rulesets', async () => {
  for (const entries of [[{ ...existing, source_type: 'Organization' }], [existing, existing]]) {
    let calls = 0;
    const mockFetch: typeof fetch = async () => {
      calls++;
      return Response.json(entries);
    };
    await assert.rejects(
      syncMainRules({
        repository: 'owner/repo',
        desired,
        apply: true,
        token: 'test',
        fetch: mockFetch,
      }),
      /inherited|Duplicate/,
    );
    assert.equal(calls, 1);
  }
});

test('read-only plans distinguish unavailable bypass actors from a configuration change', async () => {
  const hidden = { ...existing };
  delete (hidden as Partial<typeof existing>).bypass_actors;
  const mock = api({ existing: hidden });
  const plan = await syncMainRules({ repository: 'owner/repo', desired, fetch: mock.fetch });
  assert.equal(plan.action, 'inspect');
  assert.deepEqual(plan.unobservedFields, ['bypass_actors']);
  assert.ok(mock.calls.every((call) => call.method === 'GET'));
  await assert.rejects(
    syncMainRules({
      repository: 'owner/repo',
      desired,
      apply: true,
      token: 'test',
      fetch: mock.fetch,
    }),
    /Cannot inspect/,
  );
  assert.ok(mock.calls.every((call) => call.method === 'GET'));
});

test('reports known differences even when bypass actors cannot be inspected', async () => {
  const hidden = { ...existing, enforcement: 'disabled' };
  delete (hidden as Partial<typeof existing>).bypass_actors;
  const mock = api({ existing: hidden });
  const plan = await syncMainRules({ repository: 'owner/repo', desired, fetch: mock.fetch });
  assert.equal(plan.action, 'update');
  assert.deepEqual(plan.unobservedFields, ['bypass_actors']);
});
