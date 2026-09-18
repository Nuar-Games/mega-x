import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const sourcePath = path.resolve('supabase/functions/match-action/index.ts')
const source = await fs.readFile(sourcePath, 'utf8')

assert.ok(source.includes('/auth/v1/user'), 'match-action must verify bearer tokens with Supabase Auth')
assert.ok(!source.includes('atob('), 'match-action must not authenticate by decoding JWT payloads')
assert.ok(source.indexOf('await assertMatchPlayer(matchId, actorId)') < source.indexOf("rpc('get_match_engine_state'"), 'membership must be checked before actor-dependent match RPCs')

let harness = source
  .replace(/^import .*?engine\.ts'\n/m, '')
  .replace('Deno.serve(async (req: Request) => {', 'export const handler = async (req: Request) => {')
  .replace(/\n\}\)\s*$/, '\n}')

const compiled = ts.transpileModule(harness, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'megax-match-auth-'))
const modulePath = path.join(dir, 'match-action.mjs')
await fs.writeFile(modulePath, compiled)

globalThis.Deno = {
  env: {
    get(name) {
      return {
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'anon-test-key',
        SUPABASE_SERVICE_ROLE_KEY: 'service-test-key',
      }[name]
    },
  },
}

const { handler } = await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`)
const originalFetch = globalThis.fetch

try {
  const calls = []
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init })
    if (String(url).endsWith('/auth/v1/user')) return new Response(JSON.stringify({ message: 'invalid JWT' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    throw new Error(`unexpected fetch after forged token: ${url}`)
  }

  const forged = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ2aWN0aW0ifQ.'
  const forgedResponse = await handler(new Request('https://local.test/functions/v1/match-action', {
    method: 'POST',
    headers: { Authorization: `Bearer ${forged}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId: '00000000-0000-0000-0000-000000000001', expectedVersion: 1, action: 'END_EFFECT_TURN' }),
  }))
  assert.equal(forgedResponse.status, 401, 'forged/unsigned JWT must be rejected')
  assert.equal(calls.length, 1, 'forged JWT must be rejected before any service-role match access')
  assert.ok(calls[0].url.endsWith('/auth/v1/user'), 'forged JWT must be sent to Supabase Auth verification')

  calls.length = 0
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init })
    if (String(url).endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'player-a' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    if (String(url).includes('/rest/v1/matches?')) return new Response(JSON.stringify([{ id: 'match-1', player1_id: 'player-b', player2_id: 'player-c' }]), { status: 200, headers: { 'Content-Type': 'application/json' } })
    throw new Error(`actor-dependent RPC reached before membership rejection: ${url}`)
  }

  const outsiderResponse = await handler(new Request('https://local.test/functions/v1/match-action', {
    method: 'POST',
    headers: { Authorization: 'Bearer server-verified-token', 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId: 'match-1', expectedVersion: 1, action: 'END_EFFECT_TURN' }),
  }))
  assert.equal(outsiderResponse.status, 403, 'verified user who is not a match player must be rejected')
  assert.equal(calls.length, 2, 'outsider must be rejected before get_match_engine_state/commit/redaction RPCs')

  console.log('MATCH_ACTION_AUTH_REGRESSION_PASS')
} finally {
  globalThis.fetch = originalFetch
  await fs.rm(dir, { recursive: true, force: true })
}
