import fs from 'node:fs'

const path = 'src/arena-blueprint.fragment'
let source = fs.readFileSync(path, 'utf8')

const p1 = 'data-motion-anchor="p1-vs"'
const p2 = 'data-motion-anchor="p2-vs"'
if (!source.includes("data-vs-card-id={game.players[0].vs?.card.id ?? ''}")) {
  if (!source.includes(p1)) throw new Error('P1 VS anchor missing')
  source = source.replace(p1, `${p1} data-vs-card-id={game.players[0].vs?.card.id ?? ''}`)
}
if (!source.includes("data-vs-card-id={game.players[1].vs?.card.id ?? ''}")) {
  if (!source.includes(p2)) throw new Error('P2 VS anchor missing')
  source = source.replace(p2, `${p2} data-vs-card-id={game.players[1].vs?.card.id ?? ''}`)
}

fs.writeFileSync(path, source)
console.log('Patched Arena VS zones with authoritative card identity anchors')
