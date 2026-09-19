import fs from 'node:fs'

const targets = [
  ['src/App.tsx', 3],
  ['src/arena-blueprint.fragment', 2],
]

const from = "game.phase === 'EFFECT' && game.effectTurn === bottomPlayer"
const to = "game.phase === 'EFFECT' && (game.effectTurn === bottomPlayer || (activeOnlineMatch?.id?.startsWith('practice-local:') && (activeOnlineMatch?.state?.effectTurn === onlineSession?.userId || activeOnlineMatch?.state?.effectTurn === 0)))"

for (const [file, expectedMin] of targets) {
  let source = fs.readFileSync(file, 'utf8')
  source = source.split(from).join(to)
  const count = source.split(to).length - 1
  if (count < expectedMin) throw new Error(`practice generated effect controls expected at least ${expectedMin} targets in ${file}, found ${count}`)
  fs.writeFileSync(file, source)
}

console.log('PRACTICE_GENERATED_EFFECT_CONTROLS_PATCHED')
