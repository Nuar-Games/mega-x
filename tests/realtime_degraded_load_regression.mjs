import fs from 'node:fs'

const source = fs.readFileSync('scripts/patch-resilience.mjs', 'utf8')

if (source.includes("realtimeHealthy ? 5_000 : 1_200")) {
  throw new Error('Realtime failure still accelerates HTTP fallback to 1.2s')
}
if (!source.includes("document.visibilityState === 'hidden' ? 30_000 : 5_000")) {
  throw new Error('Expected bounded degraded fallback cadence missing')
}

console.log('PASS degraded Realtime does not increase HTTP polling load')
