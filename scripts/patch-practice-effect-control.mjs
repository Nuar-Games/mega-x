import fs from 'node:fs'

const path = 'src/arena-blueprint.fragment'
let source = fs.readFileSync(path, 'utf8')

const from = "game.phase === 'EFFECT' && game.effectTurn === bottomPlayer"
const to = "game.phase === 'EFFECT' && (game.effectTurn === bottomPlayer || (activeOnlineMatch?.id?.startsWith('practice-local:') && activeOnlineMatch?.state?.effectTurn === onlineSession?.userId))"

const matches = source.split(from).length - 1
if (matches < 2) throw new Error(`practice Effect-control patch expected at least 2 Arena targets, found ${matches}`)
source = source.split(from).join(to)

fs.writeFileSync(path, source)
console.log(`Patched ${matches} Practice Effect-control Arena paths`)
