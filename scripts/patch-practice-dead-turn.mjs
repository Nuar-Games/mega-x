import fs from 'node:fs'

const path = 'src/practice-match.ts'
let source = fs.readFileSync(path, 'utf8')

const from = `  store.match.state = result.state
  ensureTieHands(store.match.state)
}`

const to = `  store.match.state = result.state

  // Practice has no second network client to send the normal BEGIN_ROUND action.
  // When both VS cards are committed and the human is first player, advance the
  // authoritative engine on the human's behalf so the Arena cannot dead-end in SET_VS.
  if (
    store.match.state.phase === 'SET_VS' &&
    !store.match.state.needsVS[0] &&
    !store.match.state.needsVS[1] &&
    !store.match.state.pendingSelfDiscard &&
    !store.match.state.pendingBoardChoice &&
    !store.match.state.pendingChoice &&
    store.match.state.firstPlayer === store.match.player1_id
  ) {
    apply(store.match.player1_id, 'BEGIN_ROUND')
  }

  ensureTieHands(store.match.state)
}`

if (!source.includes(from)) throw new Error('practice dead-turn patch target missing')
source = source.replace(from, to)
fs.writeFileSync(path, source)
console.log('Patched Practice human-first BEGIN_ROUND dead turn')
