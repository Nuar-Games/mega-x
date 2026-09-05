import fs from 'node:fs'
const path='tests/engine_behavior_regression.mjs'
let source=fs.readFileSync(path,'utf8')
const replacements=[
  [
`test('07 KUDA destroys lower-DEF VS to Zon Tepi', () => {
  let s = play(makeState({ p1Hand: [7], p1Vs: vs(20), p2Vs: vs(1) }), 7)
  assert(s.pendingBoardChoice?.cardIds.includes(1), 'KUDA target missing')
  s = act(s, P1, 'RESOLVE_BOARD_CHOICE', { cardId: 1 })
  assert(s.player2.discard.includes(1) && !s.player2.vs, 'KUDA did not destroy VS to discard')
})`,
`test('07 KUDA destroys lower-DEF VS to Zon X', () => {
  let s = play(makeState({ p1Hand: [7], p1Vs: vs(20), p2Vs: vs(1) }), 7)
  assert(s.pendingBoardChoice?.cardIds.includes(1), 'KUDA target missing')
  s = act(s, P1, 'RESOLVE_BOARD_CHOICE', { cardId: 1 })
  assert(s.player1.x.includes(1) && !s.player2.vs, 'KUDA did not capture destroyed VS to Zon X')
  assert(!s.player2.discard.includes(1), 'KUDA incorrectly sent destroyed VS to Zon Tepi')
})`
  ],
  [
`test('10 TIKUS destroys ATK <=800 VS', () => {
  let s = play(makeState({ p1Hand: [10], p2Vs: vs(17) }), 10)
  assert(s.pendingBoardChoice?.cardIds.includes(17), 'TIKUS eligible target missing')
  s = act(s, P1, 'RESOLVE_BOARD_CHOICE', { cardId: 17 })
  assert(s.player2.discard.includes(17) && !s.player2.vs, 'TIKUS did not destroy eligible VS')
})`,
`test('10 TIKUS destroys ATK <=800 VS to Zon X', () => {
  let s = play(makeState({ p1Hand: [10], p2Vs: vs(17) }), 10)
  assert(s.pendingBoardChoice?.cardIds.includes(17), 'TIKUS eligible target missing')
  s = act(s, P1, 'RESOLVE_BOARD_CHOICE', { cardId: 17 })
  assert(s.player1.x.includes(17) && !s.player2.vs, 'TIKUS did not capture destroyed VS to Zon X')
  assert(!s.player2.discard.includes(17), 'TIKUS incorrectly sent destroyed VS to Zon Tepi')
})`
  ]
]
for(const [oldText,newText] of replacements){
  if(source.includes(oldText)) source=source.replace(oldText,newText)
  else if(!source.includes(newText)) throw new Error('engine behavior core-rules patch anchor missing')
}
fs.writeFileSync(path,source)
console.log('Updated 32-card engine behavior expectations for effect-destroyed VS -> Zon X')
