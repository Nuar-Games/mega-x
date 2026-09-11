import { applyEngineAction, type EngineAction, type EngineState, type MatchMeta } from '../supabase/functions/match-action/engine.ts'
import { runBeginnerBotActions } from './beginner-bot.ts'

const HUMAN_ID = 'practice-human'
const BOT_ID = 'practice-beginner-bot'
const META: MatchMeta = { player1_id: HUMAN_ID, player2_id: BOT_ID }

const CARD_NAMES: Record<number, string> = {
  1:'XANDER SI TUKANG CANGKUL',2:'SINGAU',3:'ABNER SI PENYAMBAR RIMBA',4:'TABUAN BARA',5:'ARASHMAN SI PENENUN BAYANG',6:'BARA NANDEZ',7:'KUDA PELONJAK LANGIT',8:'RATU TABUAN LANGIT',9:'NAGA ANGIN',10:'TIKUS KILAT ANGKASA',11:'JENAKA FARISH',12:'IMP BARA BERTOPENG',13:'NAGA RIBUT AIS',14:'WAKTU MEMBEKU',15:'PELUNCUR FROST',16:'PENGANGKAT RIMBA',17:'GRAVITIAN',18:'GERGASI PEDANG BESI',19:'KAPORES THE FIGHTER',20:'TINFORGE SENTINEL',21:'ULAR PELARI',22:'TOM SI LABAH-LABAH GERGASI',23:'MANUSIA ASID',24:'TEMBOK HANGUS',25:'KELAJUAN TANPA NAMA',26:'SPUDUR SI PENENUN KELIRU',27:'PENDEKAR CAHAYA PRISMA',28:'BLACK HOLE',29:'JUARA BARA',30:'PIPIT PEMBURU',
}

let practiceState: EngineState | null = null
let selectedDiscard = new Set<number>()
let botBusy = false

function shuffledDeck() {
  const deck = Array.from({ length: 30 }, (_, i) => i + 1)
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export function createPracticeState(): EngineState {
  const deck = shuffledDeck()
  const player1Hand = deck.splice(0, 5)
  const player2Hand = deck.splice(0, 5)
  return {
    deck,
    player1: { hand: player1Hand, vs: null, effects: [], discard: [], x: [], attackBlocks: 0 },
    player2: { hand: player2Hand, vs: null, effects: [], discard: [], x: [], attackBlocks: 0 },
    round: 1,
    phase: 'SET_VS',
    firstPlayer: HUMAN_ID,
    effectTurn: null,
    attackTurn: null,
    needsVS: [true, true],
    effectSeq: 0,
    effectActionTaken: [false, false],
    positionSwitchLocked: [false, false],
    message: 'Pilih satu kad dari tangan anda sebagai VS. Ini ialah kad utama anda di arena.',
    deckExhausted: false,
    winner: null,
    pendingSelfDiscard: null,
    pendingBoardChoice: null,
    pendingChoice: null,
    tieBreaker: null,
  }
}

function act(state: EngineState, actorId: string, action: { action: string; payload?: Record<string, unknown> }) {
  return applyEngineAction({ state, meta: META, actorId, action: action as EngineAction })
}

function botAdvance() {
  if (!practiceState || botBusy) return
  botBusy = true
  try {
    const result = runBeginnerBotActions(
      practiceState,
      META,
      BOT_ID,
      (state, actorId, candidate) => act(state, actorId, { action: candidate.action, payload: candidate.payload }),
      20,
    )
    practiceState = result.state
  } finally {
    botBusy = false
    renderPractice()
  }
}

function humanAction(action: string, payload: Record<string, unknown> = {}) {
  if (!practiceState || botBusy) return
  try {
    practiceState = act(practiceState, HUMAN_ID, { action, payload })
    selectedDiscard = new Set()
    renderPractice()
    window.setTimeout(botAdvance, 280)
  } catch (error) {
    const node = document.querySelector<HTMLElement>('[data-practice-error]')
    if (node) node.textContent = error instanceof Error ? error.message : 'Tindakan tidak sah.'
  }
}

function cardLabel(id: number) {
  return CARD_NAMES[id] || `CARD ${id}`
}

function zoneCard(id: number, extra = '') {
  return `<div class="mx-practice-card ${extra}"><b>#${String(id).padStart(2,'0')}</b><strong>${cardLabel(id)}</strong></div>`
}

function guideText(state: EngineState) {
  if (state.phase === 'GAME_OVER') return 'Perlawanan tamat. Pemenang ditentukan oleh jumlah kad dalam Zon X.'
  if (state.phase === 'TIE_BREAKER') return 'Zon X seri. Permainan masuk ke penentuan seri.'
  if (state.pendingSelfDiscard?.player === 0) return state.pendingSelfDiscard.mode === 'ANY' ? 'Effect ini membenarkan anda membuang seberapa banyak kad yang anda mahu, termasuk 0. Pilih kad kemudian sahkan.' : `Anda perlu membuang ${state.pendingSelfDiscard.count} kad. Pilih kad tangan kemudian sahkan.`
  if (state.pendingBoardChoice?.chooser === 0) return 'Effect anda memerlukan sasaran. Pilih salah satu kad lawan yang ditanda.'
  if (state.pendingChoice?.chooser === 0) return 'Pilih satu kad tersembunyi. Dalam perlawanan sebenar anda juga tidak mengetahui kad itu.'
  if (state.phase === 'SET_VS' && state.needsVS[0]) return 'LANGKAH 1 — Pilih VS anda. ATK menyerang; DEF bertahan.'
  if (state.phase === 'SET_VS') return state.firstPlayer === HUMAN_ID ? 'Kedua-dua VS sudah bersedia. Mulakan pusingan.' : 'Beginner Bot sedang memulakan pusingan.'
  if (state.phase === 'EFFECT' && state.effectTurn === HUMAN_ID) return 'FASA EFFECT — Main maksimum satu Effect, atau tamatkan giliran untuk teruskan.'
  if (state.phase === 'EFFECT') return 'Beginner Bot sedang menunjukkan Fasa Effect.'
  if (state.phase === 'ATTACK' && state.attackTurn === HUMAN_ID) return 'FASA SERANGAN — Serang jika VS anda dalam posisi ATK, atau PASS.'
  if (state.phase === 'ATTACK') return 'Beginner Bot sedang membuat keputusan serangan.'
  return 'Ikut arahan arena untuk meneruskan perlawanan latihan.'
}

function humanControls(state: EngineState) {
  if (state.phase === 'GAME_OVER' || state.phase === 'TIE_BREAKER') {
    return `<button data-practice-reset>MAIN LAGI</button>`
  }
  if (state.pendingSelfDiscard?.player === 0) {
    const anyMode = state.pendingSelfDiscard.mode === 'ANY'
    const disabled = !anyMode && selectedDiscard.size !== state.pendingSelfDiscard.count
    return `<button data-practice-confirm-discard ${disabled ? 'disabled' : ''}>${anyMode ? 'SAHKAN BUANGAN' : `BUANG ${state.pendingSelfDiscard.count} KAD`}</button>`
  }
  if (state.pendingChoice?.chooser === 0) {
    return state.pendingChoice.hiddenOrder.map((_, i) => `<button data-hidden-slot="${i}">KAD TERSEMBUNYI ${i + 1}</button>`).join('')
  }
  if (state.phase === 'SET_VS' && !state.needsVS[0] && !state.needsVS[1] && state.firstPlayer === HUMAN_ID) {
    return `<button data-practice-action="BEGIN_ROUND">MULAKAN PUSINGAN</button>`
  }
  if (state.phase === 'EFFECT' && state.effectTurn === HUMAN_ID) {
    return `${state.round > 1 ? '<button data-practice-action="SWITCH_POSITION">TUKAR POSISI VS</button>' : ''}<button data-practice-action="END_EFFECT_TURN">TAMAT EFFECT</button>`
  }
  if (state.phase === 'ATTACK' && state.attackTurn === HUMAN_ID) {
    return `<button data-practice-action="ATTACK">SERANG</button><button data-practice-action="PASS_ATTACK">PASS</button>`
  }
  return ''
}

function handMarkup(state: EngineState) {
  const needsVs = state.phase === 'SET_VS' && state.needsVS[0]
  const effectTurn = state.phase === 'EFFECT' && state.effectTurn === HUMAN_ID && !state.pendingSelfDiscard && !state.pendingBoardChoice && !state.pendingChoice
  return state.player1.hand.map((id) => {
    const selected = selectedDiscard.has(id) ? 'is-selected' : ''
    const buttons = needsVs
      ? `<button data-set-vs="${id}" data-position="ATK">VS ATK</button><button data-set-vs="${id}" data-position="DEF">VS DEF</button>`
      : effectTurn
        ? `<button data-play-effect="${id}">MAIN EFFECT</button>`
        : ''
    return `<article class="mx-practice-hand-card ${selected}" data-hand-card="${id}">${zoneCard(id)}<div>${buttons}</div></article>`
  }).join('')
}

function opponentTargets(state: EngineState) {
  const allowed = new Set(state.pendingBoardChoice?.chooser === 0 ? state.pendingBoardChoice.cardIds : [])
  const cards: Array<{ id:number; zone:string }> = []
  if (state.player2.vs) cards.push({ id: state.player2.vs.card, zone: 'VS' })
  for (const effect of state.player2.effects) cards.push({ id: effect.card, zone: 'EFFECT' })
  return cards.map(({id,zone}) => `<button class="mx-practice-target ${allowed.has(id) ? 'is-legal' : ''}" ${allowed.has(id) ? `data-board-target="${id}"` : 'disabled'}><small>${zone}</small>${zoneCard(id)}</button>`).join('')
}

function renderPractice() {
  const root = document.querySelector<HTMLElement>('[data-practice-root]')
  if (!root || !practiceState) return
  const s = practiceState
  const humanVs = s.player1.vs ? zoneCard(s.player1.vs.card, 'is-vs') : '<div class="mx-practice-empty">VS KOSONG</div>'
  const botVs = s.player2.vs ? zoneCard(s.player2.vs.card, 'is-vs') : '<div class="mx-practice-empty">VS KOSONG</div>'
  root.innerHTML = `
    <section class="mx-practice-shell">
      <header><div><span>MEGA X 1.1</span><h2>PRACTICE — BEGINNER BOT</h2></div><button data-practice-close>×</button></header>
      <aside class="mx-practice-guide"><b>PANDUAN</b><p>${guideText(s)}</p><small data-practice-error></small></aside>
      <main class="mx-practice-board">
        <section class="mx-practice-player bot"><h3>BEGINNER BOT · ZON X ${s.player2.x.length}</h3><div class="mx-practice-zones"><div><label>VS</label>${botVs}</div><div><label>EFFECT</label>${s.player2.effects.map(e=>zoneCard(e.card)).join('') || '<div class="mx-practice-empty">—</div>'}</div></div><div class="mx-practice-targets">${opponentTargets(s)}</div></section>
        <div class="mx-practice-status"><b>PUSINGAN ${s.round}</b><span>${s.phase}</span><p>${s.message || ''}</p><em>MASTER DECK: ${s.deck.length}</em></div>
        <section class="mx-practice-player human"><h3>ANDA · ZON X ${s.player1.x.length}</h3><div class="mx-practice-zones"><div><label>VS</label>${humanVs}</div><div><label>EFFECT</label>${s.player1.effects.map(e=>zoneCard(e.card)).join('') || '<div class="mx-practice-empty">—</div>'}</div></div></section>
      </main>
      <section class="mx-practice-hand"><h3>TANGAN ANDA</h3><div>${handMarkup(s)}</div></section>
      <footer>${humanControls(s)}</footer>
    </section>`
  wirePracticeControls(root)
}

function wirePracticeControls(root: HTMLElement) {
  root.querySelector<HTMLElement>('[data-practice-close]')?.addEventListener('click', closePractice)
  root.querySelector<HTMLElement>('[data-practice-reset]')?.addEventListener('click', startPractice)
  root.querySelectorAll<HTMLElement>('[data-set-vs]').forEach((button) => button.addEventListener('click', () => humanAction('SET_VS', { cardId: Number(button.dataset.setVs), position: button.dataset.position })))
  root.querySelectorAll<HTMLElement>('[data-play-effect]').forEach((button) => button.addEventListener('click', () => humanAction('PLAY_EFFECT', { cardId: Number(button.dataset.playEffect) })))
  root.querySelectorAll<HTMLElement>('[data-practice-action]').forEach((button) => button.addEventListener('click', () => humanAction(String(button.dataset.practiceAction))))
  root.querySelectorAll<HTMLElement>('[data-board-target]').forEach((button) => button.addEventListener('click', () => humanAction('RESOLVE_BOARD_CHOICE', { cardId: Number(button.dataset.boardTarget) })))
  root.querySelectorAll<HTMLElement>('[data-hidden-slot]').forEach((button) => button.addEventListener('click', () => humanAction('RESOLVE_HIDDEN_CHOICE', { slot: Number(button.dataset.hiddenSlot) })))
  root.querySelectorAll<HTMLElement>('[data-hand-card]').forEach((card) => card.addEventListener('click', (event) => {
    if (!practiceState?.pendingSelfDiscard || (event.target as HTMLElement).closest('button')) return
    const id = Number(card.dataset.handCard)
    if (selectedDiscard.has(id)) selectedDiscard.delete(id)
    else if (practiceState.pendingSelfDiscard.mode === 'ANY' || selectedDiscard.size < practiceState.pendingSelfDiscard.count) selectedDiscard.add(id)
    renderPractice()
  }))
  root.querySelector<HTMLElement>('[data-practice-confirm-discard]')?.addEventListener('click', () => humanAction('RESOLVE_SELF_DISCARD', { cardIds: [...selectedDiscard] }))
}

export function startPractice() {
  practiceState = createPracticeState()
  selectedDiscard = new Set()
  let root = document.querySelector<HTMLElement>('[data-practice-root]')
  if (!root) {
    root = document.createElement('div')
    root.dataset.practiceRoot = 'true'
    document.body.appendChild(root)
  }
  document.documentElement.classList.add('mx-practice-open')
  renderPractice()
  window.setTimeout(botAdvance, 150)
}

export function closePractice() {
  document.documentElement.classList.remove('mx-practice-open')
  document.querySelector('[data-practice-root]')?.remove()
  practiceState = null
  selectedDiscard = new Set()
}

function ensurePracticeEntry() {
  const lobby = document.querySelector<HTMLElement>('.mx-online-screen.mx-lobby-shell, .mx-lobby-shell')
  const player = lobby?.querySelector<HTMLElement>('.mx-lobby-player, .mx-area-player')
  if (!lobby || !player || lobby.querySelector('[data-practice-entry]')) return
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'mx-practice-entry'
  button.dataset.practiceEntry = 'true'
  button.innerHTML = '<b>PRACTICE</b><span>BEGINNER BOT</span>'
  button.addEventListener('click', startPractice)
  player.appendChild(button)
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const boot = () => {
    ensurePracticeEntry()
    new MutationObserver(ensurePracticeEntry).observe(document.documentElement, { childList: true, subtree: true })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
}
