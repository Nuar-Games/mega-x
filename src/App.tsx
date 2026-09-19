// GENERATED FILE — produced by scripts/build-clean.mjs; do not hand-edit.
import { getMyAdminStatus, adminListPlayers, adminSetSilenced, adminSetSuspended } from './onlineAuth'
import { requestPasswordReset } from './onlineAuth'
import { startPracticeMatch } from './practice-match'
import { VsIntroScreen, getMyActiveMatchVsIntro, joinMatchmakingVsIntro, respondToChallengeVsIntro } from './VsIntro'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AppOpenHook, shouldShowAppOpenHook } from './AppOpenHook'
import './App.css'
import './V19.css'
import './V20.css'
import './V21.css'
import './V22.css'
import './V23.css'
import './V24.css'
import './Online.css'
import { cancelChallenge, cancelMatchmaking, claimFighterHandle, consumeGoogleSessionFromHash, getGlobalChat, getMailInbox, getMatchResultSummary, getMyActiveChallenge, getOnlineFighters, getSavedSession, getTop10Leaderboard, heartbeatLobby, heartbeatMatch, leaveLobby, leaveMatchResult, loadProfile, markMailRead, resolveActionTimeout, resolveReconnectTimeout, sendChallenge, subscribeToMatchChanges, sendGlobalChat, sendMailToHandle, signInWithEmail, signInWithGoogle, signOut, signUpWithEmail, surrenderMatch, submitMatchEngineAction, submitMatchSpecialAction, type ActiveChallenge, type ActiveOnlineMatch, type FighterProfile, type GlobalChatMessage, type LeaderboardRow, type MailMessage, type MatchResultSummary, type MatchmakingStatus, type OnlineFighter, type OnlineSession } from './onlineAuth'

type Position = 'ATK' | 'DEF'
type PlayerIndex = 0 | 1
type Phase = 'SET_VS' | 'EFFECT' | 'ATTACK' | 'TIE_BREAKER' | 'GAME_OVER'

type Card = {
  id: number
  name: string
  atk: number
  def: number
  sta: number
  effectText: string
}

type VSState = {
  card: Card
  position: Position
  staDelta: number
  positionChangedThisRound: boolean
  spudurDiscardCount: number
}

type EffectState = {
  card: Card
  seq: number
  spudurDiscardCount: number
  playedRound: number
}

type PlayerState = {
  hand: Card[]
  vs: VSState | null
  effects: EffectState[]
  discard: Card[]
  x: Card[]
  attackBlocks: number
}

type TieBreakerState = {
  deck: Card[]
  index: number
  left: Card | null
  right: Card | null
  status: 'WAITING' | 'REVEALED' | 'TIED' | 'DECIDED'
  pair: number
}

type GameState = {
  deck: Card[]
  players: [PlayerState, PlayerState]
  round: number
  phase: Phase
  firstPlayer: PlayerIndex
  effectTurn: PlayerIndex | null
  attackTurn: PlayerIndex | null
  needsVS: [boolean, boolean]
  effectSeq: number
  effectActionTaken: [boolean, boolean]
  positionSwitchLocked: [boolean, boolean]
  message: string
  deckExhausted: boolean
  winner: PlayerIndex | null
  pendingSelfDiscard: PendingSelfDiscard | null
  pendingBoardChoice: PendingBoardChoice | null
  tieBreaker: TieBreakerState | null
}


type PendingChoiceKind = 'ABNER' | 'PELUNCUR' | 'TOM' | 'GERGASI'

type PendingBoardChoice = {
  chooser: PlayerIndex
  target: PlayerIndex
  purpose: 'DESTROY_ELIGIBLE' | 'STA_CAPACITY' | 'GERGASI_EFFECT' | 'RETURN_EFFECT'
  title: string
  cardIds: number[]
}

type PendingSelfDiscard = {
  player: PlayerIndex
  count: number
  mode: 'EXACT' | 'ANY'
  reason: 'HAND_LIMIT' | 'PIPIT' | 'SPUDUR_VS' | 'SPUDUR_EFFECT'
  followUpCount?: number
  sourceEffectSeq?: number
}

type PendingChoice = {
  kind: PendingChoiceKind
  chooser: PlayerIndex
  target: PlayerIndex
  remaining: number
  hiddenOrder: number[]
  sourceCardName: string
}

type RectSnapshot = { left: number; top: number; width: number; height: number }
type MotionKind = 'CAPTURE' | 'DESTROY' | 'RETURN' | 'ENTER_VS' | 'SUPPORT' | 'DRAW' | 'DISCARD'
type MotionEvent = {
  card: Card
  from: string
  to: string
  kind: MotionKind
  fromRect?: RectSnapshot
  toRect?: RectSnapshot
}

const masterDeck: Card[] = [
  { id: 1, name: 'XANDER SI TUKANG CANGKUL', atk: 600, def: 400, sta: 3, effectText: 'AMBIL SATU KAD DARI MASTER DECK.' },
  { id: 2, name: 'SINGAU', atk: 999, def: 900, sta: 5, effectText: 'ATK KAD VS LAWAN MENJADI 0.' },
  { id: 3, name: 'ABNER SI PENYAMBAR RIMBA', atk: 500, def: 300, sta: 4, effectText: 'AMBIL SATU KAD DARI TANGAN LAWAN.' },
  { id: 4, name: 'TABUAN BARA', atk: 500, def: 450, sta: 2, effectText: 'TOLAK 100 ATK KAD VS LAWAN.' },
  { id: 5, name: 'ARASHMAN SI PENENUN BAYANG', atk: 700, def: 650, sta: 3, effectText: 'SEMUA KAD EFFECT LAWAN DIMUSNAHKAN.' },
  { id: 6, name: 'BARA NANDEZ', atk: 600, def: 550, sta: 3, effectText: 'BARA NANDEZ: LAWAN TIDAK BOLEH TUKAR POSISI ATK/DEF PADA GILIRAN SETERUSNYA.' },
  { id: 7, name: 'KUDA PELONJAK LANGIT', atk: 700, def: 300, sta: 5, effectText: 'MUSNAHKAN KAD LAWAN (ZON VS ATAU ZON EFFECT) YANG MEMPUNYAI NILAI DEF YANG LEBIH KECIL DARI KAD VS PEMAIN.' },
  { id: 8, name: 'RATU TABUAN LANGIT', atk: 500, def: 450, sta: 2, effectText: 'TOLAK STA KAD VS LAWAN SEBANYAK 3.' },
  { id: 9, name: 'NAGA ANGIN', atk: 900, def: 850, sta: 5, effectText: 'KAD VS / EFFECT LAWAN DENGAN ATK ATAU DEF 500 DAN KE BAWAH DIAMBIL KE ZON X.' },
  { id: 10, name: 'TIKUS KILAT ANGKASA', atk: 600, def: 300, sta: 4, effectText: 'MUSNAHKAN KAD LAWAN (ZON VS ATAU ZON EFFECT) YANG MEMPUNYAI NILAI ATK 800 DAN KE BAWAH.' },
  { id: 11, name: 'JENAKA FARISH', atk: 400, def: 200, sta: 4, effectText: 'TOLAK STA LAWAN SEBANYAK 2.' },
  { id: 12, name: 'IMP BARA BERTOPENG', atk: 500, def: 450, sta: 3, effectText: 'TOLAK 200 ATK KAD VS LAWAN.' },
  { id: 13, name: 'NAGA RIBUT AIS', atk: 800, def: 500, sta: 4, effectText: 'TOLAK 200 DEF KAD VS LAWAN. LAWAN TIDAK DAPAT MEMBUAT SERANGAN UNTUK 1 KALI.' },
  { id: 14, name: 'WAKTU MEMBEKU', atk: 800, def: 750, sta: 5, effectText: 'LAWAN TIDAK BOLEH MEMBUAT SERANGAN UNTUK SATU KALI DAN TIDAK BOLEH MENGGUNAKAN 3 SLOT ZON EFFECT.' },
  { id: 15, name: 'PELUNCUR FROST', atk: 700, def: 650, sta: 4, effectText: 'MUSNAHKAN 2 KAD PEMAIN LAWAN SAMA ADA DI ZON EFFECT ATAU DI TANGAN.' },
  { id: 16, name: 'PENGANGKAT RIMBA', atk: 400, def: 200, sta: 3, effectText: 'AMBIL 3 KAD DARI MASTER DECK.' },
  { id: 17, name: 'GRAVITIAN', atk: 800, def: 750, sta: 5, effectText: 'KEMBALIKAN SEMUA KAD LAWAN KE MASTER DECK DAN SHUFFLE.' },
  { id: 18, name: 'GERGASI PEDANG BESI', atk: 900, def: 300, sta: 2, effectText: 'PADA PUSINGAN INI, LAWAN HANYA BOLEH ADA 2 KAD PADA EFFECT ZONE, DAN 2 KAD PADA TANGAN. SEKIRANYA LEBIH, KAD TERSEBUT HARUSLAH DIMUSNAHKAN.' },
  { id: 19, name: 'KAPORES THE FIGHTER', atk: 300, def: 100, sta: 3, effectText: 'TOLAK 1 STA KAD VS PEMAIN DAN +1000 ATK KEPADA KAD VS TERSEBUT.' },
  { id: 20, name: 'TINFORGE SENTINEL', atk: 950, def: 600, sta: 5, effectText: 'TAMBAH 600 ATK PADA KAD VS PEMAIN.' },
  { id: 21, name: 'ULAR PELARI', atk: 50, def: 30, sta: 2, effectText: 'STA KAD VS LAWAN MENJADI 0.' },
  { id: 22, name: 'TOM SI LABAH-LABAH GERGASI', atk: 700, def: 300, sta: 6, effectText: 'KEMBALIKAN 3 KAD DARI TANGAN LAWAN KE MASTER DECK, SHUFFLE DAN PEMAIN AMBIL 3 KAD.' },
  { id: 23, name: 'MANUSIA ASID', atk: 400, def: 350, sta: 6, effectText: 'KEMBALIKAN 1 KAD EFFECT LAWAN KE MASTER DECK.' },
  { id: 24, name: 'TEMBOK HANGUS', atk: 0, def: 999, sta: 4, effectText: 'TUKARKAN ATK LAWAN MENJADI DEF DAN DEF MENJADI ATK PADA KAD DI ZON VS LAWAN.' },
  { id: 25, name: 'KELAJUAN TANPA NAMA', atk: 800, def: 300, sta: 4, effectText: 'AMBIL 5 KAD DARI MASTER DECK.' },
  { id: 26, name: 'SPUDUR SI PENENUN KELIRU', atk: 815, def: 600, sta: 5, effectText: 'VS: BUANG KAD TANGAN, +100 ATK SETIAP KAD. EFFECT: BUANG KAD TANGAN, -100 ATK VS LAWAN SETIAP KAD.' },
  { id: 27, name: 'PENDEKAR CAHAYA PRISMA', atk: 800, def: 700, sta: 5, effectText: 'JIKA VS PEMAIN DEF: CAPTURE VS LAWAN DAN MUSNAHKAN SEMUA KAD TANGAN LAWAN.' },
  { id: 28, name: 'BLACK HOLE', atk: 700, def: 650, sta: 4, effectText: 'BOARD WIPE: SEMUA KAD VS DAN EFFECT KEDUA-DUA PEMAIN DIMUSNAHKAN.' },
  { id: 29, name: 'JUARA BARA', atk: 750, def: 300, sta: 4, effectText: 'JIKA DI VS DAN ADA KAD LAIN DENGAN "BARA" DI EFFECT ZONE PEMAIN, ATK DARAB 2.' },
  { id: 30, name: 'PIPIT PEMBURU', atk: 200, def: 150, sta: 2, effectText: 'AMBIL 5 KAD DARI MASTER DECK. BUANG 2 KAD DARI TANGAN KE ZON TEPI.' },
]


const cardById = (id: number) => masterDeck.find((card) => card.id === id) ?? masterDeck[0]
const hiddenCard = (slot: number): Card => ({ id: -1000 - slot, name: 'HIDDEN CARD', atk: 0, def: 0, sta: 0, effectText: '' })

function onlineGameFromState(raw: any, match: ActiveOnlineMatch, viewerId: string): GameState {
  const toIndex = (id: string | null | undefined): PlayerIndex | null => id === match.player1_id ? 0 : id === match.player2_id ? 1 : null
  const convertPlayer = (p: any, hidden = false): PlayerState => {
    const handIds: number[] = Array.isArray(p?.hand) ? p.hand.map(Number) : []
    const hiddenCount = Number(p?.handCount ?? 0)
    return {
      hand: hidden && handIds.length === 0 ? Array.from({ length: hiddenCount }, (_, i) => hiddenCard(i)) : handIds.map(cardById),
      vs: p?.vs ? { card: cardById(Number(p.vs.card)), position: p.vs.position === 'DEF' ? 'DEF' : 'ATK', staDelta: Number(p.vs.staDelta ?? 0), positionChangedThisRound: Boolean(p.vs.positionChangedThisRound), spudurDiscardCount: Number(p.vs.spudurDiscardCount ?? 0) } : null,
      effects: Array.isArray(p?.effects) ? p.effects.map((e: any) => ({ card: cardById(Number(e.card)), seq: Number(e.seq ?? 0), spudurDiscardCount: Number(e.spudurDiscardCount ?? 0), playedRound: Number(e.playedRound ?? raw?.round ?? 1) })) : [],
      discard: Array.isArray(p?.discard) ? p.discard.map((id: number) => cardById(Number(id))) : [],
      x: Array.isArray(p?.x) ? p.x.map((id: number) => cardById(Number(id))) : [],
      attackBlocks: Number(p?.attackBlocks ?? 0),
    }
  }
  const viewerIsP1 = match.player1_id === viewerId
  const first = toIndex(raw?.firstPlayer) ?? 0
  return {
    deck: Array.from({ length: Number(raw?.deckCount ?? 0) }, (_, i) => hiddenCard(100 + i)),
    players: [convertPlayer(raw?.player1, !viewerIsP1), convertPlayer(raw?.player2, viewerIsP1)],
    round: Number(raw?.round ?? 1),
    phase: (['SET_VS','EFFECT','ATTACK','TIE_BREAKER','GAME_OVER'].includes(raw?.phase) ? raw.phase : 'SET_VS') as Phase,
    firstPlayer: first,
    effectTurn: toIndex(raw?.effectTurn),
    attackTurn: toIndex(raw?.attackTurn),
    needsVS: [Boolean(raw?.needsVS?.[0]), Boolean(raw?.needsVS?.[1])],
    effectSeq: Number(raw?.effectSeq ?? 0),
    effectActionTaken: [Boolean(raw?.effectActionTaken?.[0]), Boolean(raw?.effectActionTaken?.[1])],
    positionSwitchLocked: [Boolean(raw?.positionSwitchLocked?.[0]), Boolean(raw?.positionSwitchLocked?.[1])],
    message: String(raw?.message ?? ''),
    deckExhausted: Boolean(raw?.deckExhausted),
    winner: toIndex(raw?.winner),
    pendingSelfDiscard: raw?.pendingSelfDiscard ?? null,
    pendingBoardChoice: raw?.pendingBoardChoice ?? null,
    tieBreaker: raw?.phase === 'TIE_BREAKER' ? (raw?.tiePublic ? { deck: [], index: 0, left: raw.tiePublic.left ? cardById(Number(raw.tiePublic.left)) : null, right: raw.tiePublic.right ? cardById(Number(raw.tiePublic.right)) : null, status: raw.tiePublic.status ?? 'WAITING', pair: Number(raw.tiePublic.pair ?? 0) } : { deck: [], index: 0, left: null, right: null, status: 'WAITING', pair: 0 }) : null,
  }
}

function shuffleDeck(cards: Card[]) {
  const shuffled = [...cards]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function other(player: PlayerIndex): PlayerIndex {
  return player === 0 ? 1 : 0
}

function playerLabel(player: PlayerIndex) {
  return `X Fighter ${player + 1}`
}

function emptyPlayer(): PlayerState {
  return { hand: [], vs: null, effects: [], discard: [], x: [], attackBlocks: 0 }
}

function cloneGame(game: GameState): GameState {
  return structuredClone(game)
}

function motionStyle(event: MotionEvent | null) {
  if (!event) return undefined
  const from = event.fromRect ?? event.toRect
  const to = event.toRect ?? event.fromRect
  if (!from || !to) return undefined
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  const sx = Math.max(0.18, to.width / Math.max(1, from.width))
  const sy = Math.max(0.18, to.height / Math.max(1, from.height))
  const s = Math.max(0.18, (sx + sy) / 2)
  return {
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    '--mx': `${dx}px`,
    '--my': `${dy}px`,
    '--msx': s,
    '--msy': s,
    '--ms': s,
  } as any
}

function App() {
  const [showColdOpen, setShowColdOpen] = useState(shouldShowAppOpenHook)
  const [onlineScreen, setOnlineScreen] = useState<'LANDING' | 'AUTH' | 'HANDLE' | 'LOBBY' | 'GAME'>(() => { try { return sessionStorage.getItem('mx-enter-lobby-after-auth') === '1' ? 'LOBBY' : 'LANDING' } catch { return 'LANDING' } })
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [onlineSession, setOnlineSession] = useState<OnlineSession | null>(null)
  const [fighterProfile, setFighterProfile] = useState<FighterProfile | null>(null)
  const [fighterHandle, setFighterHandle] = useState('')
  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>([])
  const [onlineFighters, setOnlineFighters] = useState<OnlineFighter[]>([])
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallenge | null>(null)
  const [challengeSecondsLeft, setChallengeSecondsLeft] = useState(0)
  const [globalChatMessages, setGlobalChatMessages] = useState<GlobalChatMessage[]>([])
  const [globalChatText, setGlobalChatText] = useState('')
  const [onlineMessage, setOnlineMessage] = useState('')
  const [onlineBusy, setOnlineBusy] = useState(false)
  const [activeOnlineMatch, setActiveOnlineMatch] = useState<ActiveOnlineMatch | null>(null)
  const [onlineMatchResult, setOnlineMatchResult] = useState<MatchResultSummary | null>(null)
  const [matchmakingStatus, setMatchmakingStatus] = useState<MatchmakingStatus | null>(null)
  const [mailInbox, setMailInbox] = useState<MailMessage[]>([])
  const [mailOpen, setMailOpen] = useState(false)
  const [mailComposeOpen, setMailComposeOpen] = useState(false)
  const [mailRecipientHandle, setMailRecipientHandle] = useState('')
  const [mailSubject, setMailSubject] = useState('')
  const [mailBody, setMailBody] = useState('')
  const [matchNetworkBusy, setMatchNetworkBusy] = useState(false)
  const matchNetworkBusyRef = useRef(false)
  const [reconnectSecondsLeft, setReconnectSecondsLeft] = useState(0)
  const [actionSecondsLeft, setActionSecondsLeft] = useState(0)
  const [started, setStarted] = useState(false)
  const [testCardId, setTestCardId] = useState(1)
  const [pendingChoice, setPendingChoice] = useState<PendingChoice | null>(null)
  const [localViewer, setLocalViewer] = useState<PlayerIndex>(0)
  const [passToPlayer, setPassToPlayer] = useState<PlayerIndex | null>(null)
  const [focusedCard, setFocusedCard] = useState<Card | null>(null)
  const [pileView, setPileView] = useState<{ title: string; cards: Card[] } | null>(null)
  const [selectedDiscardIds, setSelectedDiscardIds] = useState<number[]>([])
  const [impactFx, setImpactFx] = useState<{ attacker: PlayerIndex; defender: PlayerIndex; stage: 'WINDUP' | 'IMPACT' | 'RESOLVE' } | null>(null)
  const [arenaIntro, setArenaIntro] = useState(false)
  const [motionFx, setMotionFx] = useState<MotionEvent | null>(null)
  const [motionQueue, setMotionQueue] = useState<MotionEvent[]>([])
  const [confirmEndWithoutEffect, setConfirmEndWithoutEffect] = useState(false)
  const [statFx, setStatFx] = useState<Array<{ player: PlayerIndex; stat: 'ATK' | 'DEF' | 'STA'; delta: number; id: number }>>([])
  const previousStatsRef = useRef<[ReturnType<typeof getVSStats>, ReturnType<typeof getVSStats>]>([null, null])
  const previousGameRef = useRef<GameState | null>(null)
  const latestMatchVersionRef = useRef<number>(-1)
  const latestMatchIdRef = useRef<string | null>(null)
  const preMutationRectsRef = useRef<Map<number, RectSnapshot>>(new Map())

  function snapshotVisibleCardRects() {
    const next = new Map<number, RectSnapshot>()
    document.querySelectorAll<HTMLElement>('[data-card-id]').forEach((el) => {
      const id = Number(el.dataset.cardId)
      if (!Number.isFinite(id) || next.has(id)) return
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) next.set(id, { left: r.left, top: r.top, width: r.width, height: r.height })
    })
    preMutationRectsRef.current = next
  }

  function readAnchorRect(anchor: string): RectSnapshot | undefined {
    const el = document.querySelector<HTMLElement>(`[data-motion-anchor="${anchor}"]`)
    if (!el) return undefined
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return undefined
    return { left: r.left, top: r.top, width: r.width, height: r.height }
  }

  function readCardRect(cardId: number): RectSnapshot | undefined {
    const el = document.querySelector<HTMLElement>(`[data-card-id="${cardId}"]`)
    if (!el) return undefined
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return undefined
    return { left: r.left, top: r.top, width: r.width, height: r.height }
  }
  const playerDisplayName = (player: PlayerIndex) => activeOnlineMatch
    ? (player === 0 ? activeOnlineMatch.player1_handle : activeOnlineMatch.player2_handle) || playerLabel(player)
    : playerLabel(player)

  const [game, setGame] = useState<GameState>(() => ({
    deck: [],
    players: [emptyPlayer(), emptyPlayer()],
    round: 1,
    phase: 'SET_VS',
    firstPlayer: 0,
    effectTurn: null,
    attackTurn: null,
    needsVS: [true, true],
    effectSeq: 0,
    effectActionTaken: [false, false],
    positionSwitchLocked: [false, false],
    message: '',
    deckExhausted: false,
    winner: null,
    pendingSelfDiscard: null,
    pendingBoardChoice: null,
    tieBreaker: null,
  }))

  useEffect(() => {
    const googleSession = consumeGoogleSessionFromHash()
    const session = googleSession ?? getSavedSession()
    if (!session) return
    let disposed = false
    setOnlineSession(session)
    setOnlineBusy(true)
    void (async () => {
      try {
        const profile = await loadProfile(session)
        if (disposed) return
        setFighterProfile(profile)
      try {
        if (sessionStorage.getItem('mx-enter-lobby-after-auth') === '1' && profile?.fighter_handle) {
          sessionStorage.removeItem('mx-enter-lobby-after-auth')
          setOnlineBusy(false)
          setOnlineScreen('LOBBY')
          void getTop10Leaderboard(session).then(setLeaderboardRows).catch(() => undefined)
          return
        }
      } catch {}
        if (!profile?.fighter_handle) {
          setOnlineScreen('HANDLE')
          return
        }
        const [leaders, match] = await Promise.all([getTop10Leaderboard(session), getMyActiveMatchVsIntro(session)])
        if (disposed) return
        setLeaderboardRows(leaders)
        if (match) {
          applyOnlineMatchView(match)
        } else {
          setOnlineScreen('LOBBY')
        }
      } catch {
        if (disposed) return
        void signOut(session)
        setOnlineSession(null)
        setFighterProfile(null)
        setActiveOnlineMatch(null)
        setOnlineScreen('LANDING')
      } finally {
        if (!disposed) setOnlineBusy(false)
      }
    })()
    return () => { disposed = true }
  }, [])

  async function submitEmailAuth() {
    if (!authEmail || authPassword.length < 6 || onlineBusy) return
    setOnlineBusy(true)
    setOnlineMessage('')
    try {
      const session = authMode === 'SIGN_IN'
        ? await signInWithEmail(authEmail, authPassword)
        : (await signUpWithEmail(authEmail, authPassword)).session
      if (!session) {
        setOnlineMessage('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT.')
        return
      }
      setOnlineSession(session)
      const profile = await loadProfile(session)
      setFighterProfile(profile)
      if (profile?.fighter_handle) {
        try { sessionStorage.setItem('mx-enter-lobby-after-auth', '1') } catch {}
        window.location.reload()
        return
      }
      setOnlineBusy(false)
      setOnlineScreen('HANDLE')
    } catch (error) {
      setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'SIGN IN FAILED')
    } finally {
      setOnlineBusy(false)
    }
  }
  async function submitFighterHandle() {
    if (!onlineSession || !/^[A-Za-z0-9_]{3,16}$/.test(fighterHandle) || onlineBusy) return
    setOnlineBusy(true)
    setOnlineMessage('')
    try {
      const profile = await claimFighterHandle(onlineSession, fighterHandle)
      setFighterProfile(profile)
      setLeaderboardRows(await getTop10Leaderboard(onlineSession))
      setOnlineScreen('LOBBY')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'HANDLE FAILED'
      setOnlineMessage(message.includes('TAKEN') ? 'THAT X FIGHTER NAME IS ALREADY TAKEN.' : message.replaceAll('_', ' '))
    } finally {
      setOnlineBusy(false)
    }
  }

  function applyOnlineMatchView(match: ActiveOnlineMatch, sessionOverride?: OnlineSession) {
    const activeSession = sessionOverride ?? onlineSession
    if (latestMatchIdRef.current !== match.id) {
      latestMatchIdRef.current = match.id
      latestMatchVersionRef.current = -1
    }
    if (Number(match.state_version) < latestMatchVersionRef.current) return
    latestMatchVersionRef.current = Math.max(latestMatchVersionRef.current, Number(match.state_version))
    setActiveOnlineMatch(match)
    if (!activeSession) return
    const me: PlayerIndex = match.player1_id === activeSession.userId ? 0 : 1
    setLocalViewer(me)

    if ((match.status as string) === 'VS_INTRO') {
      setStarted(false)
      return
    }
    if (match.status === 'ACTIVE' || match.status === 'PAUSED' || match.status === 'ABANDONED') {
      const nextGame = onlineGameFromState(match.state, match, activeSession.userId)
      const rawChoice = match.state?.pendingChoice
      setPendingChoice(rawChoice && rawChoice !== null ? { kind: rawChoice.kind, chooser: Number(rawChoice.chooser) as PlayerIndex, target: Number(rawChoice.target) as PlayerIndex, remaining: Number(rawChoice.remaining ?? 0), hiddenOrder: Array.from({ length: Number(rawChoice.hiddenCount ?? 0) }, (_, i) => i), sourceCardName: String(rawChoice.sourceCardName ?? rawChoice.kind ?? 'EFFECT') } : null)
      setGame(nextGame)
      setStarted(true)
      setOnlineScreen('GAME')
      if (nextGame.phase === 'GAME_OVER') {
        void getMatchResultSummary(activeSession, match.id).then(setOnlineMatchResult).catch(() => undefined)
      }
    }
  }

  async function refreshActiveMatch() {
    if (!onlineSession) return null
    const match = await getMyActiveMatchVsIntro(onlineSession)
    if (match) {
      applyOnlineMatchView(match)
    } else if (activeOnlineMatch) {
      setActiveOnlineMatch(null)
      setOnlineMatchResult(null)
      setStarted(false)
      setReconnectSecondsLeft(0)
      setOnlineScreen('LOBBY')
      setOnlineMessage('')
      await heartbeatLobby(onlineSession).catch(() => undefined)
    }
    return match
  }

  async function dispatchOnlineAction(action: string, payload: Record<string, unknown> = {}) {
    if (!onlineSession || !activeOnlineMatch || matchNetworkBusyRef.current) return
    matchNetworkBusyRef.current = true
    setMatchNetworkBusy(true)
    try {
      const matchId = activeOnlineMatch.id
      let expectedVersion = activeOnlineMatch.state_version
      let result
      try {
        result = await submitMatchEngineAction(onlineSession, matchId, expectedVersion, action, payload)
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (!message.includes('STALE_MATCH_STATE')) throw error
        const fresh = await refreshActiveMatch()
        if (!fresh || fresh.id !== matchId) throw error
        expectedVersion = fresh.state_version
        result = await submitMatchEngineAction(onlineSession, matchId, expectedVersion, action, payload)
      }
      const nextMatch: ActiveOnlineMatch = { ...activeOnlineMatch, id: matchId, state: result.state, state_version: Number(result.state_version), phase: result.phase, status: result.status }
      applyOnlineMatchView(nextMatch)
      setOnlineMessage('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MATCH ACTION FAILED'
      setOnlineMessage(message.replaceAll('_', ' '))
      if (message.includes('STALE_MATCH_STATE')) await refreshActiveMatch().catch(() => undefined)
    } finally {
      matchNetworkBusyRef.current = false
      setMatchNetworkBusy(false)
    }
  }

  async function dispatchOnlineAttack() {
    if (!onlineSession || !activeOnlineMatch || matchNetworkBusyRef.current) return
    matchNetworkBusyRef.current = true
    setMatchNetworkBusy(true)
    try {
      const result = await submitMatchEngineAction(onlineSession, activeOnlineMatch.id, activeOnlineMatch.state_version, 'ATTACK', {})
      applyOnlineMatchView({ ...activeOnlineMatch, state: result.state, state_version: Number(result.state_version), phase: result.phase, status: result.status })
      setOnlineMessage('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ATTACK FAILED'
      setOnlineMessage(message.replaceAll('_', ' '))
      if (message.includes('STALE_MATCH_STATE')) await refreshActiveMatch().catch(() => undefined)
    } finally { matchNetworkBusyRef.current = false; setMatchNetworkBusy(false) }
  }


  useEffect(() => {
    if (onlineScreen !== 'LOBBY' || !onlineSession || !fighterProfile?.fighter_handle) return
    let disposed = false

    const refreshLobby = async () => {
      try {
        const [fighters, challenge, leaders, chat, match, inbox] = await Promise.all([
          getOnlineFighters(onlineSession),
          getMyActiveChallenge(onlineSession),
          getTop10Leaderboard(onlineSession),
          getGlobalChat(onlineSession),
          getMyActiveMatchVsIntro(onlineSession),
          getMailInbox(onlineSession),
        ])
        if (disposed) return
        setOnlineFighters(fighters)
        setActiveChallenge(challenge)
        setLeaderboardRows(leaders)
        setGlobalChatMessages(chat)
        setMailInbox(inbox)
        if (match) applyOnlineMatchView(match)
      } catch (error) {
        if (!disposed) setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'LOBBY CONNECTION ERROR')
      }
    }

    void heartbeatLobby(onlineSession).then(refreshLobby).catch(() => undefined)
    const heartbeatTimer = window.setInterval(() => { void heartbeatLobby(onlineSession).catch(() => undefined) }, 10_000)
    let refreshTimer = 0
    const scheduleRefresh = () => {
      refreshTimer = window.setTimeout(async () => {
        if (disposed) return
        await refreshLobby()
        if (!disposed) scheduleRefresh()
      }, 3_000)
    }
    scheduleRefresh()
    return () => {
      disposed = true
      window.clearInterval(heartbeatTimer)
      window.clearTimeout(refreshTimer)
    }
  }, [onlineScreen, onlineSession?.accessToken, fighterProfile?.fighter_handle])

  useEffect(() => {
    if (onlineScreen !== 'LOBBY' || !onlineSession || matchmakingStatus?.status !== 'WAITING') return
    let disposed = false
    const pollMatchmaking = async () => {
      try {
        const matchId = await joinMatchmakingVsIntro(onlineSession)
        if (disposed || !matchId) return
        const match = await getMyActiveMatchVsIntro(onlineSession)
        if (disposed) return
        setMatchmakingStatus({ status: 'MATCHED', match_id: matchId, joined_at: matchmakingStatus.joined_at })
        if (match) applyOnlineMatchView(match)
      } catch (error) {
        if (!disposed) setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'MATCHMAKING FAILED')
      }
    }
    let timer = 0
    const scheduleMatchmaking = () => {
      timer = window.setTimeout(async () => {
        if (disposed) return
        await pollMatchmaking()
        if (!disposed) scheduleMatchmaking()
      }, 1_500)
    }
    void pollMatchmaking().finally(scheduleMatchmaking)
    return () => { disposed = true; window.clearTimeout(timer) }
  }, [onlineScreen, onlineSession?.accessToken, matchmakingStatus?.status])

  useEffect(() => {
    if (onlineScreen !== 'GAME' || !onlineSession || !activeOnlineMatch) return
    let disposed = false
    const poll = async () => {
      try {
        const match = await refreshActiveMatch()
        if (disposed || !match) return
        if (match.status === 'PAUSED' && match.reconnect_deadline && new Date(match.reconnect_deadline).getTime() <= Date.now()) {
          await resolveReconnectTimeout(onlineSession, match.id)
        }
      } catch { /* next poll retries */ }
    }
    void heartbeatMatch(onlineSession, activeOnlineMatch.id).catch(() => undefined)
    const heartbeatTimer = window.setInterval(() => { void heartbeatMatch(onlineSession, activeOnlineMatch.id).catch(() => undefined) }, 20_000)
    let fallbackTimer = 0
    let signalTimer = 0
    let refreshing = false
    const refreshFromServer = async () => {
      if (disposed || refreshing) return
      refreshing = true
      try { await poll() } finally { refreshing = false }
    }
    let realtimeHealthy = false
    const unsubscribeMatch = subscribeToMatchChanges(onlineSession, activeOnlineMatch.id, () => {
      window.clearTimeout(signalTimer)
      signalTimer = window.setTimeout(() => { void refreshFromServer() }, 40)
    }, (healthy) => { realtimeHealthy = healthy })
    const scheduleFallback = () => {
      // Realtime is only an accelerator. If Supabase refuses/limits the channel,
      // ordinary HTTPS polling stays bounded instead of increasing load during degradation.
      const delay = document.visibilityState === 'hidden' ? 30_000 : 5_000
      fallbackTimer = window.setTimeout(async () => {
        if (disposed) return
        await refreshFromServer()
        if (!disposed) scheduleFallback()
      }, delay)
    }
    void refreshFromServer().finally(scheduleFallback)
    return () => {
      disposed = true
      unsubscribeMatch()
      window.clearInterval(heartbeatTimer)
      window.clearTimeout(signalTimer)
      window.clearTimeout(fallbackTimer)
    }
  }, [onlineScreen, onlineSession?.accessToken, activeOnlineMatch?.id])

  useEffect(() => {
    if (!activeChallenge || activeChallenge.status !== 'PENDING') {
      setChallengeSecondsLeft(0)
      return
    }
    const update = () => setChallengeSecondsLeft(Math.max(0, Math.ceil((new Date(activeChallenge.expires_at).getTime() - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [activeChallenge?.id, activeChallenge?.status, activeChallenge?.expires_at])

  useEffect(() => {
    if (activeOnlineMatch?.status !== 'PAUSED' || !activeOnlineMatch.reconnect_deadline) {
      setReconnectSecondsLeft(0)
      return
    }
    const update = () => setReconnectSecondsLeft(Math.max(0, Math.ceil((new Date(activeOnlineMatch.reconnect_deadline!).getTime() - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [activeOnlineMatch?.status, activeOnlineMatch?.reconnect_deadline])

  useEffect(() => {
    if (!onlineSession || activeOnlineMatch?.status !== 'ACTIVE') {
      setActionSecondsLeft(0)
      return
    }
    const deadlines = Array.isArray(activeOnlineMatch.state?.actionDeadlines) ? activeOnlineMatch.state.actionDeadlines : []
    const localIndex = activeOnlineMatch.player1_id === onlineSession.userId ? 0 : 1
    const displayDeadline = deadlines[localIndex] || deadlines[1 - localIndex] || null
    if (!displayDeadline) {
      setActionSecondsLeft(0)
      return
    }
    let resolving = false
    const update = () => {
      const now = Date.now()
      const left = Math.max(0, Math.ceil((new Date(displayDeadline).getTime() - now) / 1000))
      setActionSecondsLeft(left)
      const expired = deadlines.some((value: string | null) => value && new Date(value).getTime() <= now)
      if (expired && !resolving) {
        resolving = true
        void resolveActionTimeout(onlineSession, activeOnlineMatch.id)
          .then(() => refreshActiveMatch())
          .catch(() => refreshActiveMatch())
          .finally(() => { resolving = false })
      }
    }
    update()
    const timer = window.setInterval(update, 200)
    return () => window.clearInterval(timer)
  }, [onlineSession?.accessToken, activeOnlineMatch?.id, activeOnlineMatch?.status, activeOnlineMatch?.state_version])

  useEffect(() => {
    const startPractice = () => {
      console.log('[MX_QA] startPractice entry')
      const guestKey = 'mega-x-practice-guest-id-v1'
      let guestId = onlineSession?.userId || window.localStorage.getItem(guestKey)
      if (!guestId) {
        guestId = 'practice-guest:' + crypto.randomUUID()
        window.localStorage.setItem(guestKey, guestId)
      }
      const practiceSession = onlineSession ?? {
        accessToken: 'practice-local',
        refreshToken: 'practice-local',
        expiresAt: Number.MAX_SAFE_INTEGER,
        userId: guestId,
      }
      if (!onlineSession) setOnlineSession(practiceSession)
      console.log('[MX_QA] startPractice before startPracticeMatch')
      const match = startPracticeMatch(practiceSession.userId, fighterProfile?.fighter_handle || 'GUEST X FIGHTER')
      applyOnlineMatchView(match as any, practiceSession)
      console.log('[MX_QA] startPractice after applyOnlineMatchView')
    }
    const openGuestSignIn = () => {
      setOnlineScreen('AUTH')
    }
    const enterGuestLobby = () => {
      const guestKey = 'mega-x-practice-guest-id-v1'
      let guestId = onlineSession?.userId || window.localStorage.getItem(guestKey)
      if (!guestId) {
        guestId = 'practice-guest:' + crypto.randomUUID()
        window.localStorage.setItem(guestKey, guestId)
      }
      if (!onlineSession) setOnlineSession({
        accessToken: 'practice-local',
        refreshToken: 'practice-local',
        expiresAt: Number.MAX_SAFE_INTEGER,
        userId: guestId,
      })
      setOnlineScreen('LOBBY')
    }
    window.addEventListener('mega-x:open-sign-in', openGuestSignIn)
    window.addEventListener('mega-x:enter-guest-lobby', enterGuestLobby)
    window.addEventListener('mega-x:start-practice-match', startPractice)
    return () => { window.removeEventListener('mega-x:open-sign-in', openGuestSignIn); window.removeEventListener('mega-x:enter-guest-lobby', enterGuestLobby); window.removeEventListener('mega-x:start-practice-match', startPractice) }
  }, [onlineSession?.userId, fighterProfile?.fighter_handle])

  useEffect(() => {
    const exitPractice = () => {
      document.documentElement.classList.remove('mx-practice-active')
      setActiveOnlineMatch(null)
      setOnlineScreen('LOBBY')
    }
    window.addEventListener('mega-x:practice-exit', exitPractice)
    return () => window.removeEventListener('mega-x:practice-exit', exitPractice)
  }, [])

  const [mxAdminOpen, setMxAdminOpen] = useState(false)
  const [mxIsAdmin, setMxIsAdmin] = useState(false)
  const [mxAdminPlayers, setMxAdminPlayers] = useState<any[]>([])
  const [mxAdminBusy, setMxAdminBusy] = useState(false)

  const refreshMxAdmin = async () => {
    if (!onlineSession) return
    const status = await getMyAdminStatus(onlineSession)
    setMxIsAdmin(Boolean(status?.is_admin))
    if (status?.suspended) {
      await signOut(onlineSession).catch(() => undefined)
      setOnlineSession(null)
      setOnlineScreen('AUTH')
      setOnlineMessage('ACCOUNT SUSPENDED')
      return
    }
    if (status?.is_admin) setMxAdminPlayers(await adminListPlayers(onlineSession))
  }

  useEffect(() => {
    if (!onlineSession) { setMxIsAdmin(false); setMxAdminPlayers([]); return }
    void refreshMxAdmin().catch(() => undefined)
  }, [onlineSession?.userId])

  const mxModerate = async (playerId: string, kind: 'MUTE' | 'BAN', enabled: boolean) => {
    if (!onlineSession || mxAdminBusy) return
    setMxAdminBusy(true)
    try {
      if (kind === 'MUTE') await adminSetSilenced(onlineSession, playerId, enabled)
      else await adminSetSuspended(onlineSession, playerId, enabled)
      setMxAdminPlayers(await adminListPlayers(onlineSession))
    } catch (error) {
      setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'ADMIN ACTION FAILED')
    } finally {
      setMxAdminBusy(false)
    }
  }

  async function challengeFighter(targetPlayerId: string) {
    if (!onlineSession || onlineBusy || activeChallenge) return
    setOnlineBusy(true)
    setOnlineMessage('')
    try {
      const challenge = await sendChallenge(onlineSession, targetPlayerId)
      setActiveChallenge(challenge)
    } catch (error) {
      setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'CHALLENGE FAILED')
    } finally {
      setOnlineBusy(false)
    }
  }

  async function answerChallenge(accept: boolean) {
    if (!onlineSession || !activeChallenge || activeChallenge.target_id !== onlineSession.userId || onlineBusy) return
    setOnlineBusy(true)
    try {
      const result = await respondToChallengeVsIntro(onlineSession, activeChallenge.id, accept)
      setActiveChallenge(null)
      setOnlineMessage(result.status === 'ACCEPTED' ? '' : 'CHALLENGE DECLINED.')
      if (result.status === 'ACCEPTED') {
        const match = await getMyActiveMatchVsIntro(onlineSession)
        if (match) applyOnlineMatchView(match)
      }
    } catch (error) {
      setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'CHALLENGE RESPONSE FAILED')
      setActiveChallenge(null)
    } finally {
      setOnlineBusy(false)
    }
  }

  async function submitGlobalChat() {
    const message = globalChatText.trim()
    if (!onlineSession || !message || message.length > 240 || onlineBusy) return
    setOnlineBusy(true)
    try {
      await sendGlobalChat(onlineSession, message)
      setGlobalChatText('')
      setGlobalChatMessages(await getGlobalChat(onlineSession))
    } catch (error) {
      setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'CHAT FAILED')
    } finally {
      setOnlineBusy(false)
    }
  }

  async function cancelOutgoingChallenge() {
    if (!onlineSession || !activeChallenge || activeChallenge.challenger_id !== onlineSession.userId || onlineBusy) return
    setOnlineBusy(true)
    try {
      await cancelChallenge(onlineSession, activeChallenge.id)
      setActiveChallenge(null)
      setOnlineMessage('CHALLENGE CANCELLED.')
    } catch (error) {
      setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'CANCEL FAILED')
    } finally {
      setOnlineBusy(false)
    }
  }

  async function toggleMatchmaking() {
    if (!onlineSession || onlineBusy || activeChallenge) return
    setOnlineBusy(true)
    try {
      if (matchmakingStatus?.status === 'WAITING') {
        await cancelMatchmaking(onlineSession)
        setMatchmakingStatus(null)
      } else {
        const matchId = await joinMatchmakingVsIntro(onlineSession)
        if (matchId) {
          const match = await getMyActiveMatchVsIntro(onlineSession)
          if (match) applyOnlineMatchView(match)
          setMatchmakingStatus({ status: 'MATCHED', match_id: matchId, joined_at: null })
        } else {
          setMatchmakingStatus({ status: 'WAITING', match_id: null, joined_at: new Date().toISOString() })
        }
      }
    } catch (error) { setOnlineMessage(error instanceof Error ? error.message.replaceAll('_',' ') : 'MATCHMAKING FAILED') }
    finally { setOnlineBusy(false) }
  }

  async function openInbox() {
    if (!onlineSession) return
    try { setMailInbox(await getMailInbox(onlineSession)); setMailOpen(true) }
    catch (error) { setOnlineMessage(error instanceof Error ? error.message.replaceAll('_',' ') : 'INBOX FAILED') }
  }

  async function submitMailCompose() {
    if (!onlineSession || onlineBusy) return
    const handle = mailRecipientHandle.trim()
    const subject = mailSubject.trim()
    const body = mailBody.trim()
    if (!/^[A-Za-z0-9_]{3,16}$/.test(handle) || subject.length < 1 || subject.length > 80 || body.length < 1 || body.length > 1000) return
    setOnlineBusy(true)
    setOnlineMessage('')
    try {
      await sendMailToHandle(onlineSession, handle, subject, body)
      setMailRecipientHandle('')
      setMailSubject('')
      setMailBody('')
      setMailComposeOpen(false)
      setOnlineMessage('MAIL SENT.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MAIL SEND FAILED'
      setOnlineMessage(message.includes('RECIPIENT_NOT_FOUND') ? 'X FIGHTER NOT FOUND.' : message.replaceAll('_', ' '))
    } finally {
      setOnlineBusy(false)
    }
  }

  async function quitOnlineMatch() {
    if (!onlineSession || !activeOnlineMatch || matchNetworkBusy || game.phase === 'GAME_OVER') return
    if (!window.confirm('QUIT MATCH? This counts as a surrender.')) return
    setMatchNetworkBusy(true)
    try {
      await surrenderMatch(onlineSession, activeOnlineMatch.id)
      await refreshActiveMatch()
    } catch (error) {
      setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'SURRENDER FAILED')
    } finally {
      setMatchNetworkBusy(false)
    }
  }

  async function returnToLobbyFromResult() {
    if (!onlineSession || !activeOnlineMatch || matchNetworkBusy) return
    setMatchNetworkBusy(true)
    try {
      await leaveMatchResult(onlineSession, activeOnlineMatch.id)
      setActiveOnlineMatch(null)
      setOnlineMatchResult(null)
      setStarted(false)
      setOnlineScreen('LOBBY')
      setOnlineMessage('')
      await heartbeatLobby(onlineSession).catch(() => undefined)
    } catch (error) {
      setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'RESULT ACKNOWLEDGEMENT FAILED')
    } finally {
      setMatchNetworkBusy(false)
    }
  }

  async function leaveOnlineSession() {
    if (onlineSession) await leaveLobby(onlineSession).catch(() => undefined)
    await signOut(onlineSession)
    setOnlineSession(null)
    setFighterProfile(null)
    setLeaderboardRows([])
    setOnlineFighters([])
    setActiveChallenge(null)
    setOnlineScreen('LANDING')
  }

  useEffect(() => {
    if (!activeOnlineMatch || !onlineSession || game.phase !== 'TIE_BREAKER' || localViewer !== 0 || matchNetworkBusy) return
    const status = game.tieBreaker?.status ?? 'WAITING'
    if (!['WAITING','TIED'].includes(status)) return
    const timer = window.setTimeout(() => {
      setMatchNetworkBusy(true)
      void submitMatchSpecialAction(onlineSession, activeOnlineMatch.id, activeOnlineMatch.state_version, 'TIE_REVEAL', {})
        .then((result) => {
          applyOnlineMatchView({ ...activeOnlineMatch, state: result.state, state_version: Number(result.state_version), phase: result.phase, status: result.status })
          setOnlineMessage('')
        })
        .catch(async (e) => {
          const message = e instanceof Error ? e.message : 'TIE BREAKER FAILED'
          setOnlineMessage(message.replaceAll('_',' '))
          if (message.includes('STALE_MATCH_STATE')) await refreshActiveMatch().catch(() => undefined)
        })
        .finally(() => setMatchNetworkBusy(false))
    }, 1100)
    return () => window.clearTimeout(timer)
  }, [activeOnlineMatch?.id, activeOnlineMatch?.state_version, game.phase, game.tieBreaker?.status, localViewer])

  useEffect(() => {
    if (activeOnlineMatch) return
    if (game.phase !== 'TIE_BREAKER' || !game.tieBreaker) return

    const tieBreaker = game.tieBreaker
    let timer: number | undefined

    if (tieBreaker.status === 'WAITING') {
      timer = window.setTimeout(() => {
        setGame((prev) => {
          if (prev.phase !== 'TIE_BREAKER' || !prev.tieBreaker || prev.tieBreaker.status !== 'WAITING') return prev
          const next = cloneGame(prev)
          const state = next.tieBreaker!
          const left = state.deck[state.index] ?? null
          const right = state.deck[state.index + 1] ?? null
          if (!left || !right) {
            next.phase = 'GAME_OVER'
            next.winner = null
            next.message = 'Penentuan seri masih seri selepas semua kad Tie Breaker dibandingkan.'
            next.tieBreaker = null
            return next
          }
          state.left = left
          state.right = right
          state.status = 'REVEALED'
          state.pair += 1
          next.message = 'PENENTUAN SERI'
          return next
        })
      }, 650)
    } else if (tieBreaker.status === 'REVEALED') {
      timer = window.setTimeout(() => {
        setGame((prev) => {
          if (prev.phase !== 'TIE_BREAKER' || !prev.tieBreaker || prev.tieBreaker.status !== 'REVEALED') return prev
          const next = cloneGame(prev)
          const state = next.tieBreaker!
          const left = state.left
          const right = state.right
          if (!left || !right) return next

          if (left.atk === right.atk) {
            state.status = 'TIED'
            next.message = 'SERI'
            return next
          }

          next.winner = left.atk > right.atk ? 0 : 1
          state.status = 'DECIDED'
          next.message = `Zon X seri. Penentuan Seri: ${left.name} (${left.atk}) vs ${right.name} (${right.atk}). ${playerLabel(next.winner)} menang.`
          return next
        })
      }, 1450)
    } else if (tieBreaker.status === 'TIED') {
      timer = window.setTimeout(() => {
        setGame((prev) => {
          if (prev.phase !== 'TIE_BREAKER' || !prev.tieBreaker || prev.tieBreaker.status !== 'TIED') return prev
          const next = cloneGame(prev)
          const state = next.tieBreaker!
          state.index = state.index + 2
          state.left = null
          state.right = null
          state.status = 'WAITING'
          next.message = 'PENENTUAN SERI'
          return next
        })
      }, 900)
    } else if (tieBreaker.status === 'DECIDED') {
      timer = window.setTimeout(() => {
        setGame((prev) => {
          if (prev.phase !== 'TIE_BREAKER' || !prev.tieBreaker || prev.tieBreaker.status !== 'DECIDED') return prev
          const next = cloneGame(prev)
          next.phase = 'GAME_OVER'
          next.tieBreaker = null
          return next
        })
      }, 1100)
    }

    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [game.phase, game.tieBreaker?.status, game.tieBreaker?.index])

  const currentStats = useMemo(() => [getVSStats(game, 0), getVSStats(game, 1)] as const, [game])

  const arenaParticles = useMemo(() => Array.from({ length: 26 }, (_, i) => {
    const x = (7 + (i * 17) % 86)
    const y = (6 + (i * 29) % 78)
    const size = 2 + (i % 4)
    const duration = 3.8 + (i % 6) * 0.75
    const delay = -(i * 0.37)
    const driftX = ((i % 2 === 0 ? 1 : -1) * (12 + (i * 7) % 26))
    const driftY = ((i % 3 === 0 ? 1 : -1) * (8 + (i * 5) % 22))
    const glow = 1.5 + (i % 5) * 0.33
    const opacity = (0.34 + (i % 6) * 0.08).toFixed(2)
    const colors = ['rgba(157,221,255,.96)', 'rgba(255,216,118,.94)', 'rgba(255,157,176,.92)'] as const
    return { id: i, x, y, size, duration, delay, driftX, driftY, glow, opacity, color: colors[i % colors.length] }
  }), [])

  const motionEvents = useMemo(() => (motionFx ? [motionFx] : []), [motionFx])
  const isCardArriving = (cardId: number | undefined, zone?: string) => {
    if (cardId === undefined) return false
    return motionEvents.some((event) => event.card.id === cardId && (!zone || event.to === zone))
  }
  const arrivingIdsForZone = (zone: string) => motionEvents.filter((event) => event.to === zone).map((event) => event.card.id)
  const arrivalCount = (zone: string) => motionEvents.filter((event) => event.to === zone).length
  const departureCount = (zone: string) => motionEvents.filter((event) => event.from === zone).length
  const displayedPileCount = (zone: string, actual: number) => Math.max(0, actual - arrivalCount(zone))
  const displayedDeckCount = Math.max(0, game.deck.length + departureCount('master') - arrivalCount('master'))
  const visiblePileTop = (cards: Card[], zone: string) => {
    const arriving = new Set(arrivingIdsForZone(zone))
    for (let i = cards.length - 1; i >= 0; i -= 1) if (!arriving.has(cards[i].id)) return cards[i]
    return null
  }

  useLayoutEffect(() => {
    const prev = previousGameRef.current
    if (!prev || !started) {
      previousGameRef.current = game
      return
    }

    const previousRects = preMutationRectsRef.current
    const events: MotionEvent[] = []
    const previousZone = new Map<number, string>()
    const currentZone = new Map<number, string>()
    const cardById = new Map<number, Card>()

    const indexGame = (state: GameState, target: Map<number, string>) => {
      state.deck.forEach((card) => { target.set(card.id, 'master'); cardById.set(card.id, card) })
      for (const player of [0, 1] as PlayerIndex[]) {
        state.players[player].hand.forEach((card) => { target.set(card.id, `p${player + 1}-hand`); cardById.set(card.id, card) })
        if (state.players[player].vs) {
          const card = state.players[player].vs!.card
          target.set(card.id, `p${player + 1}-vs`); cardById.set(card.id, card)
        }
        state.players[player].effects.forEach((effect) => { target.set(effect.card.id, `p${player + 1}-effect`); cardById.set(effect.card.id, effect.card) })
        state.players[player].discard.forEach((card) => { target.set(card.id, `p${player + 1}-discard`); cardById.set(card.id, card) })
        state.players[player].x.forEach((card) => { target.set(card.id, `p${player + 1}-x`); cardById.set(card.id, card) })
      }
    }

    indexGame(prev, previousZone)
    indexGame(game, currentZone)

    const priority: Record<MotionKind, number> = { ENTER_VS: 0, SUPPORT: 1, CAPTURE: 2, DESTROY: 3, DISCARD: 4, RETURN: 5, DRAW: 6 }

    for (const [id, from] of previousZone.entries()) {
      const to = currentZone.get(id)
      if (!to || to === from) continue
      const card = cardById.get(id)
      if (!card) continue

      let kind: MotionKind
      if (from.includes('-hand') && to.includes('-vs')) kind = 'ENTER_VS'
      else if (from.includes('-hand') && to.includes('-effect')) kind = 'SUPPORT'
      else if (to.includes('-x')) kind = 'CAPTURE'
      else if (to.includes('-discard')) kind = from.includes('-hand') ? 'DISCARD' : 'DESTROY'
      else if (to === 'master') kind = 'RETURN'
      else if (from === 'master' && to.includes('-hand')) kind = 'DRAW'
      else continue


      events.push({
        card,
        from,
        to,
        kind,
        fromRect: previousRects.get(id) ?? readAnchorRect(from),
        toRect: (to.includes('-hand') || to.includes('-vs') || to.includes('-effect')) ? readCardRect(id) ?? readAnchorRect(to) : readAnchorRect(to),
      })
    }

    events.sort((a, b) => priority[a.kind] - priority[b.kind])
    const visualEvents = events.filter((event, index, list) => list.findIndex((candidate) => candidate.kind === event.kind) === index)
    previousGameRef.current = game
    preMutationRectsRef.current = new Map()
    if (visualEvents.length) setMotionQueue((queue) => [...queue.slice(-1), ...visualEvents])
  }, [game, started])

  // Dequeue one visual motion at a time.  The lifetime timer is deliberately
  // separate from this effect: the previous implementation cleared its own
  // timer as soon as setMotionFx() triggered a render, leaving destination
  // cards permanently hidden behind `.is-arrival-hidden`.
  useLayoutEffect(() => {
    if (motionFx || motionQueue.length === 0) return
    const [next, ...rest] = motionQueue
    const hydrated = {
      ...next,
      toRect:
        next.toRect ??
        ((next.to.includes('-hand') || next.to.includes('-vs') || next.to.includes('-effect'))
          ? readCardRect(next.card.id) ?? readAnchorRect(next.to)
          : readAnchorRect(next.to)),
    }
    setMotionQueue(rest)
    setMotionFx(hydrated)
  }, [motionFx, motionQueue])

  useEffect(() => {
    if (!motionFx) return
    const duration =
      motionFx.kind === 'ENTER_VS' ? 400 :
      motionFx.kind === 'SUPPORT' ? 380 :
      motionFx.kind === 'CAPTURE' ? 430 :
      motionFx.kind === 'DRAW' ? 100 :
      motionFx.kind === 'DESTROY' ? 200 :
      motionFx.kind === 'DISCARD' ? 160 :
      motionFx.kind === 'RETURN' ? 180 : 260
    const timer = window.setTimeout(() => setMotionFx(null), duration)
    return () => window.clearTimeout(timer)
  }, [motionFx])

  useEffect(() => {
    if (!started) {
      previousStatsRef.current = [currentStats[0], currentStats[1]]
      return
    }
    const prev = previousStatsRef.current
    const nextFx: Array<{ player: PlayerIndex; stat: 'ATK' | 'DEF' | 'STA'; delta: number; id: number }> = []
    ;([0, 1] as PlayerIndex[]).forEach((player) => {
      const before = prev[player]
      const after = currentStats[player]
      if (!before || !after) return
      ;(['atk', 'def', 'sta'] as const).forEach((key) => {
        const delta = after[key] - before[key]
        if (delta !== 0) nextFx.push({ player, stat: key.toUpperCase() as 'ATK' | 'DEF' | 'STA', delta, id: Date.now() + player * 10 + key.length })
      })
    })
    previousStatsRef.current = [currentStats[0], currentStats[1]]
    if (!nextFx.length) return
    setStatFx(nextFx)
    const timer = window.setTimeout(() => setStatFx([]), 1250)
    return () => window.clearTimeout(timer)
  }, [currentStats, started])

  // V19: responsive layout is handled by CSS. No whole-canvas shrink-to-fit.

  useEffect(() => {
    setSelectedDiscardIds([])
  }, [game.pendingSelfDiscard?.reason, game.pendingSelfDiscard?.count, game.pendingSelfDiscard?.player])

  // Central hot-seat synchronizer.
  // Whenever the rules engine changes whose private decisions are next,
  // hide both hands first and require a handoff to that player.
  useEffect(() => {
    if (activeOnlineMatch) { setPassToPlayer(null); return }
    if (!started || pendingChoice || game.pendingSelfDiscard || game.pendingBoardChoice || game.phase === 'GAME_OVER') return

    const expected = expectedViewerForState(game)
    if (expected === null) return

    if (expected !== localViewer && passToPlayer !== expected) {
      setPassToPlayer(expected)
    }
  }, [
    started,
    pendingChoice,
    game.pendingSelfDiscard,
    game.pendingBoardChoice,
    game.phase,
    game.firstPlayer,
    game.effectTurn,
    game.attackTurn,
    game.needsVS[0],
    game.needsVS[1],
    localViewer,
    passToPlayer,
  ])

  function shuffleIds(ids: number[]) {
    const out = [...ids]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }

  function makePendingChoice(
    kind: PendingChoiceKind,
    chooser: PlayerIndex,
    target: PlayerIndex,
    remaining: number,
    sourceCardName: string,
    snapshot: GameState,
  ): PendingChoice {
    return {
      kind,
      chooser,
      target,
      remaining,
      hiddenOrder: shuffleIds(snapshot.players[target].hand.map((c) => c.id)),
      sourceCardName,
    }
  }

  function schedulePendingChoice(choice: PendingChoice) {
    setTimeout(() => setPendingChoice(choice), 0)
  }

  function finishPendingChoice(next: GameState, choice: PendingChoice) {
    if (choice.kind === 'TOM') {
      next.deck = shuffleDeck(next.deck)
      drawCards(next, choice.chooser, 3, choice.chooser)
      next.message = `${choice.sourceCardName}: kad tangan lawan dikembalikan ke Master Deck dan dikocok. ${playerLabel(choice.chooser)} mengambil 3 kad.`
    } else if (choice.kind === 'PELUNCUR') {
      next.message = `${choice.sourceCardName}: pemilihan 2 kad lawan selesai.`
    } else if (choice.kind === 'GERGASI') {
      next.message = `${choice.sourceCardName}: tangan lawan kini dihadkan kepada 2 kad.`
    }
    setPendingChoice(null)
  }

  function resolveHiddenHandCard(cardId: number) {
    if (activeOnlineMatch) { void dispatchOnlineAction('RESOLVE_HIDDEN_CHOICE', { slot: cardId }); return }
    snapshotVisibleCardRects()
    const choice = pendingChoice
    if (!choice) return

    setGame((prev) => {
      const next = cloneGame(prev)
      const targetHand = next.players[choice.target].hand
      const index = targetHand.findIndex((c) => c.id === cardId)
      if (index < 0) return prev

      const [selected] = targetHand.splice(index, 1)
      let remaining = choice.remaining - 1

      if (choice.kind === 'ABNER') {
        next.players[choice.chooser].hand.push(selected)
        enforceHandLimit(next, choice.chooser, choice.chooser)
        next.message = `${choice.sourceCardName}: satu kad dipilih secara tertutup dan diambil daripada tangan lawan.`
        remaining = 0
      } else if (choice.kind === 'PELUNCUR') {
        next.players[choice.target].discard.push(selected)
        next.message = `${choice.sourceCardName}: ${selected.name} dimusnahkan daripada tangan lawan.`
      } else if (choice.kind === 'TOM') {
        next.deck.push(selected)
        next.message = `${choice.sourceCardName}: satu kad tangan lawan dipilih secara tertutup untuk dikembalikan ke Master Deck.`
      } else if (choice.kind === 'GERGASI') {
        next.players[choice.target].discard.push(selected)
        next.message = `${choice.sourceCardName}: ${selected.name} dimusnahkan daripada tangan lawan.`
      }

      const availableHidden = next.players[choice.target].hand.length
      const availableEffects = choice.kind === 'PELUNCUR' ? next.players[choice.target].effects.length : 0
      const canContinue = remaining > 0 && (availableHidden + availableEffects) > 0

      if (!canContinue) {
        finishPendingChoice(next, { ...choice, remaining: 0 })
      } else {
        setPendingChoice({
          ...choice,
          remaining,
          hiddenOrder: shuffleIds(next.players[choice.target].hand.map((c) => c.id)),
        })
      }
      return next
    })
  }

  function resolveVisibleEffectCard(cardId: number) {
    if (activeOnlineMatch && onlineSession) {
      if (!matchNetworkBusyRef.current) {
        matchNetworkBusyRef.current = true
        setMatchNetworkBusy(true)
        void submitMatchSpecialAction(onlineSession, activeOnlineMatch.id, activeOnlineMatch.state_version, 'RESOLVE_VISIBLE_EFFECT_CHOICE', { cardId })
          .then((result) => {
            applyOnlineMatchView({ ...activeOnlineMatch, state: result.state, state_version: Number(result.state_version), phase: result.phase, status: result.status })
            setOnlineMessage('')
          })
          .catch(async (e) => {
            const message = e instanceof Error ? e.message : 'CHOICE FAILED'
            setOnlineMessage(message.replaceAll('_',' '))
            if (message.includes('STALE_MATCH_STATE')) await refreshActiveMatch().catch(() => undefined)
          })
          .finally(() => { matchNetworkBusyRef.current = false; setMatchNetworkBusy(false) })
      }
      return
    }
    snapshotVisibleCardRects()
    const choice = pendingChoice
    if (!choice || choice.kind !== 'PELUNCUR') return

    setGame((prev) => {
      const next = cloneGame(prev)
      const effects = next.players[choice.target].effects
      const index = effects.findIndex((e) => e.card.id === cardId)
      if (index < 0) return prev

      const [selected] = effects.splice(index, 1)
      next.players[choice.target].discard.push(selected.card)
      const remaining = choice.remaining - 1
      next.message = `${choice.sourceCardName}: ${selected.card.name} dimusnahkan daripada Zon Effect lawan.`

      const available = next.players[choice.target].hand.length + next.players[choice.target].effects.length
      if (remaining <= 0 || available <= 0) {
        finishPendingChoice(next, { ...choice, remaining: 0 })
      } else {
        setPendingChoice({
          ...choice,
          remaining,
          hiddenOrder: shuffleIds(next.players[choice.target].hand.map((c) => c.id)),
        })
      }
      return next
    })
  }

  function resolveBoardChoice(cardId: number) {
    if (activeOnlineMatch) { void dispatchOnlineAction('RESOLVE_BOARD_CHOICE', { cardId }); return }
    snapshotVisibleCardRects()
    setGame((prev) => {
      const choice = prev.pendingBoardChoice
      if (!choice || !choice.cardIds.includes(cardId)) return prev
      const next = cloneGame(prev)
      const active = next.pendingBoardChoice!
      next.pendingBoardChoice = null
      const target = active.target
      const chooser = active.chooser

      if (active.purpose === 'DESTROY_ELIGIBLE') {
        if (next.players[target].vs?.card.id === cardId) {
          const card = next.players[target].vs!.card
          next.players[target].discard.push(card)
          next.players[target].vs = null
          finishRoundWithExistingResult(next, chooser, target, `${card.name} dimusnahkan oleh Effect.`)
        } else {
          const index = next.players[target].effects.findIndex((e) => e.card.id === cardId)
          if (index >= 0) {
            const [removed] = next.players[target].effects.splice(index, 1)
            next.players[target].discard.push(removed.card)
            next.message = `${removed.card.name} dimusnahkan ke Zon Tepi.`
          }
        }
      } else if (active.purpose === 'RETURN_EFFECT') {
        const index = next.players[target].effects.findIndex((e) => e.card.id === cardId)
        if (index >= 0) {
          const [returned] = next.players[target].effects.splice(index, 1)
          next.deck.push(returned.card)
          next.message = `${returned.card.name} dikembalikan ke Master Deck tanpa shuffle.`
        }
      } else {
        const index = next.players[target].effects.findIndex((e) => e.card.id === cardId)
        if (index >= 0) {
          const [removed] = next.players[target].effects.splice(index, 1)
          next.players[target].discard.push(removed.card)
        }
        if (active.purpose === 'GERGASI_EFFECT' && next.players[target].effects.length > 2) {
          next.pendingBoardChoice = { ...active, cardIds: next.players[target].effects.map((e) => e.card.id) }
          next.message = `GERGASI PEDANG BESI: pilih lagi sehingga hanya 2 kad Effect tinggal.`
        } else if (active.purpose === 'STA_CAPACITY') {
          const capacity = getEffectCapacity(next, target)
          if (next.players[target].effects.length > capacity) {
            next.pendingBoardChoice = { ...active, cardIds: next.players[target].effects.map((e) => e.card.id) }
            next.message = `STA mengehadkan Zon Effect. Pilih lagi ${next.players[target].effects.length - capacity} kad.`
          } else {
            next.message = `Kapasiti Zon Effect diselaraskan mengikut STA semasa.`
          }
        } else {
          next.message = `Kad Effect dipindahkan ke Zon Tepi.`
        }
      }
      return next
    })
  }

  function toggleDiscardCard(cardId: number) {
    const pending = game.pendingSelfDiscard
    if (!pending || pending.player !== localViewer) return
    setSelectedDiscardIds((current) => {
      if (current.includes(cardId)) return current.filter((id) => id !== cardId)
      if (pending.mode === 'EXACT' && current.length >= pending.count) return current
      return [...current, cardId]
    })
  }

  function confirmSelfDiscard() {
    const pending = game.pendingSelfDiscard
    if (!pending || pending.player !== localViewer) return
    if (pending.mode === 'EXACT' && selectedDiscardIds.length !== pending.count) return
    if (selectedDiscardIds.length === 0) return
    if (activeOnlineMatch) { void dispatchOnlineAction('RESOLVE_SELF_DISCARD', { cardIds: selectedDiscardIds }); return }
    snapshotVisibleCardRects()

    setGame((prev) => {
      const next = cloneGame(prev)
      const active = next.pendingSelfDiscard
      if (!active || active.player !== localViewer) return prev
      const selected = new Set(selectedDiscardIds)
      const discarded = next.players[active.player].hand.filter((card) => selected.has(card.id))
      next.players[active.player].hand = next.players[active.player].hand.filter((card) => !selected.has(card.id))
      next.players[active.player].discard.push(...discarded)

      if (active.reason === 'SPUDUR_VS' && next.players[active.player].vs?.card.id === 26) {
        next.players[active.player].vs!.spudurDiscardCount = discarded.length
        next.message = `SPUDUR VS: ${discarded.length} kad dibuang, +${discarded.length * 100} ATK.`
      }
      if (active.reason === 'SPUDUR_EFFECT' && active.sourceEffectSeq !== undefined) {
        const effect = next.players[active.player].effects.find((item) => item.seq === active.sourceEffectSeq)
        if (effect) effect.spudurDiscardCount = discarded.length
        next.message = `SPUDUR EFFECT: ${discarded.length} kad dibuang, VS lawan -${discarded.length * 100} ATK.`
      }

      if (active.followUpCount && active.followUpCount > 0) {
        next.pendingSelfDiscard = {
          player: active.player,
          count: Math.min(active.followUpCount, next.players[active.player].hand.length),
          mode: 'EXACT',
          reason: 'PIPIT',
        }
        next.message = `PIPIT PEMBURU: pilih ${next.pendingSelfDiscard.count} kad lagi untuk dibuang.`
      } else {
        next.pendingSelfDiscard = null
        if (active.reason === 'PIPIT') enforceHandLimit(next, active.player, active.player)
      }
      return next
    })
    setSelectedDiscardIds([])
  }

  function expectedViewerForState(state: GameState): PlayerIndex | null {
    if (state.phase === 'SET_VS') {
      if (state.needsVS[state.firstPlayer]) return state.firstPlayer
      const second = other(state.firstPlayer)
      if (state.needsVS[second]) return second
      return null
    }

    if (state.phase === 'EFFECT') return state.effectTurn
    if (state.phase === 'ATTACK') return state.attackTurn
    return null
  }

  function confirmPlayerHandoff() {
    if (passToPlayer === null) return
    setLocalViewer(passToPlayer)
    setPassToPlayer(null)
  }

  function initializeMatch(firstPlayer: PlayerIndex) {
    setPendingChoice(null)
    setPassToPlayer(null)
    const shuffled = shuffleDeck(masterDeck)
    const next: GameState = {
      deck: shuffled.slice(10),
      players: [
        { ...emptyPlayer(), hand: shuffled.slice(0, 5) },
        { ...emptyPlayer(), hand: shuffled.slice(5, 10) },
      ],
      round: 1,
      phase: 'SET_VS',
      firstPlayer,
      effectTurn: null,
      attackTurn: null,
      needsVS: [true, true],
      effectSeq: 0,
      effectActionTaken: [false, false],
      positionSwitchLocked: [false, false],
      message: `${playerLabel(firstPlayer)} bermula dahulu. Pilih kad VS dan posisi.`,
      deckExhausted: false,
      winner: null,
      pendingSelfDiscard: null,
      pendingBoardChoice: null,
      tieBreaker: null,
    }
    previousGameRef.current = next
    setLocalViewer(firstPlayer)
    setGame(next)
    setArenaIntro(true)
    setStarted(true)
    window.setTimeout(() => setArenaIntro(false), 1700)
  }

  function resetToCoin() {
    setStarted(false)
    setArenaIntro(false)
    setFocusedCard(null)
    setPileView(null)
    initializeMatch(0)
  }

  function setVS(player: PlayerIndex, cardId: number, position: Position) {
    if (activeOnlineMatch) { if (player === localViewer && !matchNetworkBusyRef.current) { snapshotVisibleCardRects(); void dispatchOnlineAction('SET_VS', { cardId, position }); window.dispatchEvent(new CustomEvent('mega-x:motion', { detail: { kind: 'ENTER_VS' } })); } return }
    snapshotVisibleCardRects()
    if (pendingChoice || game.pendingBoardChoice) return
    setGame((prev) => {
      const setupPlayer: PlayerIndex | null =
        prev.needsVS[prev.firstPlayer] ? prev.firstPlayer :
        prev.needsVS[other(prev.firstPlayer)] ? other(prev.firstPlayer) :
        null
      if (prev.phase !== 'SET_VS' || !prev.needsVS[player] || setupPlayer !== player || localViewer !== player) return prev
      const next = cloneGame(prev)
      const index = next.players[player].hand.findIndex((c) => c.id === cardId)
      if (index < 0) return prev
      const [card] = next.players[player].hand.splice(index, 1)
      next.players[player].vs = {
        card,
        position: hasActiveEffect(next, other(player), 6) ? 'DEF' : position,
        staDelta: 0,
        positionChangedThisRound: false,
        spudurDiscardCount: 0,
      }
      if (card.id === 26) {
        next.pendingSelfDiscard = {
          player,
          count: 0,
          mode: 'ANY',
          reason: 'SPUDUR_VS',
        }
      }
      next.needsVS[player] = false
      next.message = `${playerLabel(player)} set ${card.name} dalam posisi ${next.players[player].vs!.position}.`
      return next
    })
  }

  function beginRound() {
    if (activeOnlineMatch) { void dispatchOnlineAction('BEGIN_ROUND'); return }
    if (pendingChoice || game.pendingBoardChoice) return
    setGame((prev) => {
      if (prev.phase !== 'SET_VS' || prev.needsVS[0] || prev.needsVS[1] || !prev.players[0].vs || !prev.players[1].vs) return prev
      const next = cloneGame(prev)
      next.players[0].vs!.positionChangedThisRound = false
      next.players[1].vs!.positionChangedThisRound = false
      next.phase = 'EFFECT'
      next.effectActionTaken = [false, false]
      next.effectTurn = next.firstPlayer
      next.attackTurn = null
      next.message = `Pusingan ${next.round}: giliran Effect ${playerLabel(next.firstPlayer)}.`

      return next
    })
  }

  function switchPosition(player: PlayerIndex) {
    if (activeOnlineMatch) { if (player === localViewer) void dispatchOnlineAction('SWITCH_POSITION'); return }
    if (pendingChoice || game.pendingBoardChoice) return
    setGame((prev) => {
      if (prev.round === 1 || prev.phase !== 'EFFECT' || prev.effectTurn !== player || localViewer !== player) return prev
      const next = cloneGame(prev)
      const vs = next.players[player].vs
      if (!vs || vs.positionChangedThisRound || next.effectActionTaken[player] || hasActiveEffect(next, other(player), 6)) return prev
      vs.position = vs.position === 'ATK' ? 'DEF' : 'ATK'
      vs.positionChangedThisRound = true
      next.message = `${playerLabel(player)} menukar VS kepada ${vs.position}.`
      return next
    })
  }

  function playEffect(player: PlayerIndex, cardId: number) {
    if (activeOnlineMatch) { if (player === localViewer && !matchNetworkBusyRef.current) { snapshotVisibleCardRects(); void dispatchOnlineAction('PLAY_EFFECT', { cardId }); } return }
    snapshotVisibleCardRects()
    if (pendingChoice || game.pendingBoardChoice) return
    setGame((prev) => {
      if (prev.phase !== 'EFFECT' || prev.effectTurn !== player || localViewer !== player) return prev
      const next = cloneGame(prev)
      const handIndex = next.players[player].hand.findIndex((c) => c.id === cardId)
      if (handIndex < 0) return prev
      const capacity = getEffectCapacity(next, player)
      if (next.players[player].effects.length >= capacity) {
        next.message = `${playerLabel(player)} tidak boleh memainkan Effect lagi. Had STA / Zon Effect telah dicapai.`
        return next
      }

      const [card] = next.players[player].hand.splice(handIndex, 1)
      next.effectActionTaken[player] = true
      next.effectSeq += 1
      const effect: EffectState = { card, seq: next.effectSeq, spudurDiscardCount: 0, playedRound: next.round }
      next.players[player].effects.push(effect)

      // NAGA ANGIN menangkap Effect yang layak sebelum Effect itu sempat diselesaikan.
      const nagaOwner = other(player)
      if (hasActiveEffect(next, nagaOwner, 9) && qualifiesForNaga(card)) {
        next.players[player].effects = next.players[player].effects.filter((e) => e.card.id !== card.id)
        next.players[nagaOwner].x.push(card)
        next.message = `NAGA ANGIN menangkap ${card.name} serta-merta. Effect kad itu tidak diselesaikan.`
        return next
      }

      const opponent = other(player)

      // Kad tangan lawan sentiasa maklumat tersembunyi.
      if (card.id === 3) {
        const count = Math.min(1, next.players[opponent].hand.length)
        if (count === 0) {
          next.message = `${card.name}: lawan tiada kad di tangan.`
        } else {
          schedulePendingChoice(makePendingChoice('ABNER', player, opponent, count, card.name, next))
          next.message = `${card.name}: pilih satu kad tertutup daripada tangan lawan.`
        }
        return next
      }

      if (card.id === 15) {
        const totalTargets = next.players[opponent].hand.length + next.players[opponent].effects.length
        const count = Math.min(2, totalTargets)
        if (count === 0) {
          next.message = `${card.name}: lawan tiada kad yang boleh dimusnahkan.`
        } else {
          schedulePendingChoice(makePendingChoice('PELUNCUR', player, opponent, count, card.name, next))
          next.message = `${card.name}: pilih ${count} kad lawan. Kad tangan kekal tertutup; kad Zon Effect kekal terbuka.`
        }
        return next
      }

      if (card.id === 18) {
        enforceGergasiEffectLimit(next, player, opponent)
        const excess = Math.max(0, next.players[opponent].hand.length - 2)
        if (excess > 0) {
          schedulePendingChoice(makePendingChoice('GERGASI', player, opponent, excess, card.name, next))
          next.message = `${card.name}: pilih ${excess} kad tertutup daripada tangan lawan untuk dimusnahkan sehingga tinggal 2.`
        } else {
          next.message = `${card.name}: tangan dan Zon Effect lawan dihadkan kepada 2 kad pada pusingan ini.`
        }
        return next
      }

      if (card.id === 22) {
        const count = Math.min(3, next.players[opponent].hand.length)
        if (count === 0) {
          drawCards(next, player, 3, player)
          next.message = `${card.name}: lawan tiada kad tangan untuk dikembalikan. ${playerLabel(player)} mengambil 3 kad.`
        } else {
          schedulePendingChoice(makePendingChoice('TOM', player, opponent, count, card.name, next))
          next.message = `${card.name}: pilih ${count} kad tertutup daripada tangan lawan.`
        }
        return next
      }

      resolveEffect(next, player, effect)
      if (next.phase !== 'GAME_OVER') {
        applyNagaCaptures(next)
      }
      return next
    })
  }

  function requestEndEffectTurn() {
    if (pendingChoice || game.pendingBoardChoice || game.phase !== 'EFFECT' || game.effectTurn === null) return
    if (!game.effectActionTaken[game.effectTurn]) {
      setConfirmEndWithoutEffect(true)
      return
    }
    endEffectTurn()
  }

  function endEffectTurn() {
    if (activeOnlineMatch) { void dispatchOnlineAction('END_EFFECT_TURN'); setConfirmEndWithoutEffect(false); return }
    setConfirmEndWithoutEffect(false)
    if (pendingChoice || game.pendingBoardChoice) return
    setGame((prev) => {
      if (prev.phase !== 'EFFECT' || prev.effectTurn === null) return prev
      const next = cloneGame(prev)
      const first = next.firstPlayer
      const second = other(first)
      if (next.effectTurn === first) {
        next.effectTurn = second
        next.effectActionTaken[second] = false
        next.message = `Giliran Effect ${playerLabel(second)}.`
      } else {
        next.effectTurn = null
        beginAttackDecision(next, first)
      }
      return next
    })
  }

  function attack(player: PlayerIndex) {
    if (activeOnlineMatch) {
      if (player !== localViewer || impactFx || matchNetworkBusy) return
      const defender = other(player)
      snapshotVisibleCardRects()
      setImpactFx({ attacker: player, defender, stage: 'WINDUP' })
      void dispatchOnlineAttack()
      window.setTimeout(() => setImpactFx({ attacker: player, defender, stage: 'IMPACT' }), 180)
      window.setTimeout(() => setImpactFx({ attacker: player, defender, stage: 'RESOLVE' }), 430)
      window.setTimeout(() => setImpactFx(null), 820); return
    }
    snapshotVisibleCardRects()
    if (pendingChoice || game.pendingBoardChoice || impactFx) return
    const defender = other(player)
    setImpactFx({ attacker: player, defender, stage: 'WINDUP' })
    window.setTimeout(() => setImpactFx({ attacker: player, defender, stage: 'IMPACT' }), 300)
    window.setTimeout(() => setImpactFx({ attacker: player, defender, stage: 'RESOLVE' }), 650)
    window.setTimeout(() => setImpactFx(null), 1250)
    window.setTimeout(() => setGame((prev) => {
      if (prev.phase !== 'ATTACK' || prev.attackTurn !== player || localViewer !== player) return prev
      const next = cloneGame(prev)
      const attackerVS = next.players[player].vs
      const defenderVS = next.players[defender].vs
      if (!attackerVS || !defenderVS) return prev

      if (attackerVS.position !== 'ATK') {
        next.message = `${playerLabel(player)} berada dalam DEF dan tidak boleh menyerang. Pilih PASS.`
        return next
      }

      const a = getVSStats(next, player)
      const d = getVSStats(next, defender)
      if (!a || !d) return prev

      if (defenderVS.position === 'ATK') {
        if (a.atk > d.atk) {
          captureVSAndFinishRound(next, player, defender, `${playerLabel(player)} menang ATK lawan ATK.`)
        } else if (a.atk < d.atk) {
          captureVSAndFinishRound(next, defender, player, `${playerLabel(defender)} menang ATK lawan ATK.`)
        } else {
          destroyBothVSNoWinner(next, 'ATK sama: kedua-dua kad VS dimusnahkan.')
        }
        return next
      }

      if (a.atk > d.def) {
        captureVSAndFinishRound(next, player, defender, `${playerLabel(player)} menembusi DEF dan memenangi pusingan.`)
      } else if (a.atk < d.def) {
        captureVSAndFinishRound(next, defender, player, `${playerLabel(defender)} mempunyai DEF lebih tinggi dan memenangi pusingan.`)
      } else {
        finishRoundNoWinner(next, 'ATK sama dengan DEF: kedua-dua kad VS kekal.')
      }
      return next
    }), 650)
  }

  function passAttack(player: PlayerIndex) {
    if (activeOnlineMatch) { if (player === localViewer) void dispatchOnlineAction('PASS_ATTACK'); return }
    if (pendingChoice || game.pendingBoardChoice || impactFx) return
    setGame((prev) => {
      if (prev.phase !== 'ATTACK' || prev.attackTurn !== player || localViewer !== player) return prev
      const next = cloneGame(prev)
      if (player === next.firstPlayer) {
        const second = other(player)
        beginAttackDecision(next, second, `${playerLabel(player)} memilih PASS.`)
      } else {
        finishRoundNoWinner(next, 'Kedua-dua X Fighter memilih PASS. Tiada pertarungan pada pusingan ini.')
      }
      return next
    })
  }

  function giveTestCard(player: PlayerIndex) {
    snapshotVisibleCardRects()
    if (pendingChoice || game.pendingBoardChoice) return
    setGame((prev) => {
      if (!started || prev.phase === 'GAME_OVER') return prev
      const next = cloneGame(prev)
      const deckIndex = next.deck.findIndex((c) => c.id === testCardId)
      if (deckIndex < 0) {
        next.message = `UJIAN: Kad #${testCardId} tiada dalam Master Deck sekarang. Mulakan semula atau pilih kad lain.`
        return next
      }
      const [card] = next.deck.splice(deckIndex, 1)
      next.players[player].hand.push(card)
      enforceHandLimit(next, player, player)
      next.message = `UJIAN: ${card.name} dipindahkan daripada Master Deck ke ${playerLabel(player)} tangan.`
      return next
    })
  }

  const revealRoundOneVS = game.round > 1 || (!game.needsVS[0] && !game.needsVS[1])
  const canBegin = game.phase === 'SET_VS' && !game.needsVS[0] && !game.needsVS[1] && !!game.players[0].vs && !!game.players[1].vs

  const setupPlayer: PlayerIndex | null =
    game.phase === 'SET_VS'
      ? (game.needsVS[game.firstPlayer]
          ? game.firstPlayer
          : game.needsVS[other(game.firstPlayer)]
            ? other(game.firstPlayer)
            : null)
      : null

  // UI is player-relative: the person currently holding the device is always at the bottom.
  const bottomPlayer: PlayerIndex = localViewer
  const topPlayer: PlayerIndex = other(localViewer)
  const activePlayer: PlayerIndex | null = game.phase === 'EFFECT' ? game.effectTurn : game.phase === 'ATTACK' ? game.attackTurn : game.phase === 'SET_VS' ? setupPlayer : null
  const actionDeadlineList: Array<string | null> = Array.isArray(activeOnlineMatch?.state?.actionDeadlines) ? activeOnlineMatch!.state.actionDeadlines : []
  const onlinePlayerIndex: PlayerIndex | null = activeOnlineMatch && onlineSession ? (activeOnlineMatch.player1_id === onlineSession.userId ? 0 : 1) : null
  const actionTimerIndex: PlayerIndex | null = onlinePlayerIndex !== null && actionDeadlineList[onlinePlayerIndex] ? onlinePlayerIndex : onlinePlayerIndex !== null && actionDeadlineList[other(onlinePlayerIndex)] ? other(onlinePlayerIndex) : null
  const actionTimerVisible = actionTimerIndex !== null && Boolean(actionDeadlineList[actionTimerIndex]) && activeOnlineMatch?.status === 'ACTIVE'

  if (showColdOpen) {
    return <AppOpenHook onComplete={() => setShowColdOpen(false)} />
  }

  if (activeOnlineMatch && onlineSession && (activeOnlineMatch.status as string) === 'VS_INTRO') {
    return (
      <VsIntroScreen key={activeOnlineMatch.id} session={onlineSession} match={activeOnlineMatch} onComplete={(nextMatch) => applyOnlineMatchView(nextMatch)} onError={setOnlineMessage} />
    )
  }

  if (onlineScreen === 'LANDING') {
    return (
      <main className="mx-online-screen mx-landing">
        <div className="mx-landing-hero" aria-hidden="true" />
        <section className="mx-landing-copy">
          <img className="mx-resume-official-logo" src="/ui/landing/logo.avif" alt="MEGA-X" />
          
          <button className="mx-play-now" onClick={() => { if (activeOnlineMatch) applyOnlineMatchView(activeOnlineMatch); else setOnlineScreen(onlineSession ? (fighterProfile?.fighter_handle ? 'LOBBY' : 'HANDLE') : 'AUTH') }}>{activeOnlineMatch ? 'RESUME MATCH' : 'PLAY NOW'}</button>
          {!activeOnlineMatch && <button className="mx-practice-now" onClick={() => window.dispatchEvent(new CustomEvent('mega-x:enter-guest-lobby'))}>PLAY AS GUEST</button>}
        </section>
      </main>
    )
  }

  if (onlineScreen === 'AUTH') {
    return (
      <main className="mx-online-screen mx-auth">
        <section className="mx-auth-card">
          <span>MEGA-X ONLINE</span>
          <h1>{authMode === 'SIGN_IN' ? 'SIGN IN' : 'SIGN UP'}</h1>
          <p>Your email is private. Your X Fighter name is your public identity.</p>
          <div className="mx-auth-tabs">
            <button className={authMode === 'SIGN_IN' ? 'is-active' : ''} onClick={() => setAuthMode('SIGN_IN')}>SIGN IN</button>
            <button className={authMode === 'SIGN_UP' ? 'is-active' : ''} onClick={() => setAuthMode('SIGN_UP')}>SIGN UP</button>
          </div>
          <input type="email" autoComplete="email" placeholder="EMAIL" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
          <input type="password" autoComplete={authMode === 'SIGN_IN' ? 'current-password' : 'new-password'} placeholder="PASSWORD" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitEmailAuth()} />
            {authMode === 'SIGN_IN' && <button type="button" className="mx-auth-forgot" onClick={async () => {
              if (!authEmail.trim()) { setOnlineMessage('ENTER YOUR EMAIL FIRST'); return }
              try {
                await requestPasswordReset(authEmail.trim())
                setOnlineMessage('PASSWORD RESET EMAIL SENT')
              } catch (error) {
                setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'PASSWORD RESET FAILED')
              }
            }}>FORGOT PASSWORD?</button>}
          <div className="mx-online-message">{onlineMessage}</div>
          <button className="mx-online-primary" disabled={onlineBusy} onClick={submitEmailAuth}>{onlineBusy ? 'CONNECTING…' : authMode === 'SIGN_IN' ? 'SIGN IN' : 'CREATE ACCOUNT'}</button>
          <button className="mx-auth-google" disabled={onlineBusy} onClick={signInWithGoogle}>CONTINUE WITH GOOGLE</button>
          <button className="mx-back-link" onClick={() => setOnlineScreen('LANDING')}>BACK</button>
        </section>
      </main>
    )
  }

  if (onlineScreen === 'HANDLE') {
    return (
      <main className="mx-online-screen mx-handle">
        <section className="mx-handle-card">
          <span>IDENTITY SETUP</span>
          <h1>CREATE X FIGHTER NAME</h1>
          <p>3–16 characters. Letters, numbers and underscore. No spaces.</p>
          <input maxLength={16} placeholder="X_FIGHTER" value={fighterHandle} onChange={(e) => setFighterHandle(e.target.value.replace(/[^A-Za-z0-9_]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && submitFighterHandle()} />
          <div className="mx-online-message">{onlineMessage}</div>
          <button className="mx-online-primary" disabled={onlineBusy || !/^[A-Za-z0-9_]{3,16}$/.test(fighterHandle)} onClick={submitFighterHandle}>{onlineBusy ? 'CLAIMING…' : 'CLAIM NAME'}</button>
        </section>
      </main>
    )
  }

  if (onlineScreen === 'LOBBY') {
    const podium = leaderboardRows.slice(0, 3)
    const stack = leaderboardRows.slice(3, 20)
    return (
      <main className="mx-online-screen mx-lobby-shell">
        <header className="mx-lobby-player">
          <span className="mx-lobby-season">GEN 1 · SEASON 1</span>
          <div className="mx-lobby-identity">
            <strong>{fighterProfile?.fighter_handle ?? 'X FIGHTER'}</strong>
            <span className="mx-self-place">#{onlineFighters.find((fighter) => fighter.player_id === onlineSession?.userId)?.place || '—'}</span>
          </div>
          <div className="mx-lobby-actions">
            {mxIsAdmin && <button className="mx-lobby-signout" onClick={() => setMxAdminOpen(true)}>ADMIN</button>}
              <button className="mx-lobby-signout" onClick={leaveOnlineSession}>SIGN OUT</button>
          </div>
        </header>
        {onlineMessage && <div className="mx-live-status mx-lobby-status" role="status">{onlineMessage}</div>}
        {onlineSession?.accessToken === 'practice-local' && <div className="mx-guest-banner" role="status">
          <strong>PLAYING AS GUEST</strong>
          <span>POINTS AND LEADERBOARD PROGRESS ARE NOT RECORDED FOR GUEST MATCHES.</span>
          <button className="mx-guest-practice-start" onClick={() => window.dispatchEvent(new CustomEvent('mega-x:start-practice-match'))}>START PRACTICE MATCH</button>
        </div>}
          {mxIsAdmin && mxAdminOpen && <div className="mega-x-admin-panel" style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,.88)',display:'grid',placeItems:'center',padding:20}}>
            <div style={{width:'min(820px,96vw)',maxHeight:'82vh',overflow:'auto',background:'#090d14',border:'1px solid rgba(255,210,90,.45)',boxShadow:'0 24px 80px rgba(0,0,0,.7)',padding:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:16}}><strong style={{letterSpacing:2}}>ADMIN · PLAYER CONTROL</strong><button onClick={() => setMxAdminOpen(false)}>CLOSE</button></div>
              {mxAdminPlayers.length === 0 ? <div>NO PLAYER ACCOUNTS</div> : mxAdminPlayers.map((p:any) => <div key={p.user_id} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:10,alignItems:'center',padding:'10px 0',borderTop:'1px solid rgba(255,255,255,.08)'}}>
                <div><strong>{p.fighter_handle || 'UNCLAIMED'}</strong><div style={{fontSize:12,opacity:.62}}>{p.email || p.user_id}</div></div>
                <button disabled={mxAdminBusy} onClick={() => void mxModerate(p.user_id,'MUTE',!p.silenced)}>{p.silenced ? 'UNMUTE' : 'MUTE'}</button>
                <button disabled={mxAdminBusy} onClick={() => void mxModerate(p.user_id,'BAN',!p.suspended)}>{p.suspended ? 'UNBAN' : 'BAN'}</button>
              </div>)}
            </div>
          </div>}
        <aside className="mx-lobby-left">
          <h2>ONLINE X FIGHTERS</h2>
          <div className="mx-online-roster">
            {onlineFighters.filter((fighter) => fighter.player_id !== onlineSession?.userId).map((fighter) => (
              <div className="mx-online-fighter" key={fighter.player_id}>
                <span className="mx-place-tag">#{fighter.place || '—'}</span>
                <div><strong>{fighter.fighter_handle}</strong><small>{fighter.points} PTS · {fighter.status.replace('_', ' ')}</small></div>
                <button disabled={fighter.status !== 'ONLINE' || !!activeChallenge || onlineBusy} onClick={() => challengeFighter(fighter.player_id)}>{fighter.status === 'IN_MATCH' ? 'IN MATCH' : fighter.status === 'AWAY' ? 'AWAY' : 'CHALLENGE'}</button>
              </div>
            ))}
            {onlineFighters.filter((fighter) => fighter.player_id !== onlineSession?.userId).length === 0 && <div className="mx-roster-empty">WAITING FOR X FIGHTERS…</div>}
          </div>
        </aside>
        <section className="mx-leaderboard">
          <h1>TOP X FIGHTERS</h1>
          <div className="mx-top-three">
            {[{ place: 2, row: podium[1] }, { place: 1, row: podium[0] }, { place: 3, row: podium[2] }].map(({ place, row }) => (
              <div key={place} className={`mx-rank-card rank-${place} ${row ? '' : 'mx-empty-rank'}`}><b>#{place}</b><strong>{row?.fighter_handle ?? '—'}</strong><span>{row ? `${row.points} PTS` : '0 PTS'}</span></div>
            ))}
          </div>
          <div className="mx-rank-stack">
            {Array.from({ length: 17 }, (_, index) => {
              const row = stack[index]
              const place = index + 4
              return <div key={place} className={`mx-rank-row ${row ? '' : 'mx-empty-rank'}`}><b>#{place}</b><strong>{row?.fighter_handle ?? '—'}</strong><span>{row ? `${row.points} PTS` : '0 PTS'}</span></div>
            })}
          </div>
        </section>
        <aside className="mx-lobby-right"><h2>GLOBAL CHAT</h2><div className="mx-global-chat-feed">{globalChatMessages.map((message) => <div className="mx-chat-line" key={message.id}><b className="mx-chat-place">#{message.place || '—'}</b><strong>{message.fighter_handle}</strong><span>{message.message}</span></div>)}{globalChatMessages.length === 0 && <div className="mx-chat-empty">NO MESSAGES YET.</div>}</div><div className="mx-global-chat-input"><input maxLength={240} placeholder="MESSAGE GLOBAL CHAT" value={globalChatText} onChange={(e) => setGlobalChatText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitGlobalChat()} /><button disabled={!globalChatText.trim() || onlineBusy} onClick={submitGlobalChat}>SEND</button></div></aside>
        {activeChallenge?.status === 'PENDING' && onlineSession && (
          <div className="mx-challenge-overlay">
            <section className={`mx-challenge-popup ${activeChallenge.target_id === onlineSession.userId ? 'is-incoming' : 'is-outgoing'}`}>
              <span>{activeChallenge.target_id === onlineSession.userId ? 'CHALLENGE RECEIVED' : 'CHALLENGE SENT'}</span>
              <h2>{activeChallenge.target_id === onlineSession.userId ? activeChallenge.challenger_handle : activeChallenge.target_handle}</h2>
              <div className="mx-challenge-rank">
                {(() => {
                  const opponentId = activeChallenge.target_id === onlineSession.userId ? activeChallenge.challenger_id : activeChallenge.target_id
                  const opponent = onlineFighters.find((fighter) => fighter.player_id === opponentId)
                  return opponent ? <><b className="mx-place-tag">#{opponent.place}</b><strong>{opponent.points} PTS</strong></> : <strong>X FIGHTER</strong>
                })()}
              </div>
              <div className="mx-challenge-timer">{challengeSecondsLeft}</div>
              {activeChallenge.target_id === onlineSession.userId ? (
                <div className="mx-challenge-actions"><button className="mx-accept-challenge" disabled={onlineBusy} onClick={() => answerChallenge(true)}>ACCEPT</button><button disabled={onlineBusy} onClick={() => answerChallenge(false)}>DECLINE</button></div>
              ) : (
                <div className="mx-challenge-actions"><button disabled={onlineBusy} onClick={cancelOutgoingChallenge}>CANCEL CHALLENGE</button></div>
              )}
            </section>
          </div>
        )}
        {mailOpen && (
          <div className="mx-mail-overlay"><section className="mx-mail-panel"><header><h2>INBOX</h2><button onClick={() => setMailOpen(false)}>CLOSE</button></header><div className="mx-mail-list">{mailInbox.length === 0 ? <p>NO MAIL.</p> : mailInbox.map((mail) => <article key={mail.id} className={mail.read_at ? '' : 'is-unread'} onClick={() => { if (!mail.read_at && onlineSession) void markMailRead(onlineSession, mail.id).then(openInbox) }}><b>#{mail.sender_place || '—'} {mail.sender_handle}</b><strong>{mail.subject}</strong><p>{mail.body}</p></article>)}</div></section></div>
        )}
        {mailComposeOpen && (
          <div className="mx-mail-overlay"><section className="mx-mail-panel mx-mail-compose"><header><h2>NEW MAIL</h2><button onClick={() => setMailComposeOpen(false)}>CLOSE</button></header><label>TO X FIGHTER<input maxLength={16} placeholder="X_FIGHTER" value={mailRecipientHandle} onChange={(e) => setMailRecipientHandle(e.target.value.replace(/[^A-Za-z0-9_]/g, ''))} /></label><label>SUBJECT<input maxLength={80} placeholder="SUBJECT" value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} /></label><label>MESSAGE<textarea maxLength={1000} placeholder="MESSAGE" value={mailBody} onChange={(e) => setMailBody(e.target.value)} /></label><div className="mx-mail-compose-count">{mailBody.length}/1000</div><button className="mx-online-primary" disabled={onlineBusy || !/^[A-Za-z0-9_]{3,16}$/.test(mailRecipientHandle) || !mailSubject.trim() || !mailBody.trim()} onClick={submitMailCompose}>{onlineBusy ? 'SENDING…' : 'SEND MAIL'}</button></section></div>
        )}
      </main>
    )
  }

  return (
    <main className="app">
      {activeOnlineMatch?.status === 'PAUSED' && <div className="mx-reconnect-overlay"><section><span>CONNECTION INTERRUPTED</span><h2>{activeOnlineMatch.disconnected_player === onlineSession?.userId ? 'RECONNECTING…' : 'OPPONENT DISCONNECTED'}</h2><p>Match paused. Reconnect protection: <strong>{reconnectSecondsLeft}s</strong></p></section></div>}
      {started && (
        <section className="duel-shell">
            {game.pendingSelfDiscard && game.pendingSelfDiscard.player === localViewer && (
              <div className="mx-discard-confirm-sheet" role="dialog" aria-modal="true" aria-label="Confirm cards to discard">
                <div className="mx-discard-confirm-head">
                  <strong className="mx-responsive-discard-title">{game.pendingSelfDiscard.reason.startsWith('SPUDUR') ? 'SPUDUR — PILIH KAD UNTUK DIBUANG' : 'PILIH KAD UNTUK DIBUANG'}</strong>
                  <span>{selectedDiscardIds.length} / {game.pendingSelfDiscard.count}</span>
                </div>
                <div className="mx-discard-confirm-cards">
                  {game.players[localViewer].hand.map((card) => {
                    const selected = selectedDiscardIds.includes(card.id)
                    return <button key={card.id} type="button" className={`mx-discard-card ${selected ? 'is-selected' : ''}`} aria-pressed={selected} onClick={() => toggleDiscardCard(card.id)}><CardView card={card} /></button>
                  })}
                </div>
                <button type="button" className="mx-confirm-discard" disabled={game.pendingSelfDiscard.mode === 'EXACT' ? selectedDiscardIds.length !== game.pendingSelfDiscard.count : selectedDiscardIds.length === 0} onClick={confirmSelfDiscard}>CONFIRM DISCARD</button>
              </div>
            )}
          {arenaIntro && <div className="arena-transition-final" aria-hidden="true"><div className="arena-door arena-door-left"></div><div className="arena-door arena-door-right"></div><div className="arena-transition-flash"></div><div className="arena-transition-fight">FIGHT!</div></div>}
          {game.phase === 'TIE_BREAKER' && game.tieBreaker && (
            <div className="tie-breaker-stage" role="status" aria-live="polite">
              <div className="tie-breaker-stage-energy" aria-hidden="true" />
              <div className="tie-breaker-stage-title">PENENTUAN SERI</div>
              <div className="tie-breaker-pair" key={`tie-pair-${game.tieBreaker.pair}-${game.tieBreaker.index}`}>
                <div className="tie-breaker-card tie-breaker-card-left">
                  <span>X Fighter 1</span>
                  {game.tieBreaker.left ? <CardView card={game.tieBreaker.left} /> : <div className="tie-breaker-card-back"><img src="/cards/back-game.webp" alt="" /></div>}
                  {game.tieBreaker.left && <strong>ATK {game.tieBreaker.left.atk}</strong>}
                </div>
                <div className="tie-breaker-vs">VS</div>
                <div className="tie-breaker-card tie-breaker-card-right">
                  <span>X Fighter 2</span>
                  {game.tieBreaker.right ? <CardView card={game.tieBreaker.right} /> : <div className="tie-breaker-card-back"><img src="/cards/back-game.webp" alt="" /></div>}
                  {game.tieBreaker.right && <strong>ATK {game.tieBreaker.right.atk}</strong>}
                </div>
              </div>
              {game.tieBreaker.status === 'TIED' && <div className="tie-breaker-tied">SERI</div>}
            </div>
          )}
          {game.phase === 'GAME_OVER' && (
            <div className="match-result-splash" role="dialog" aria-modal="true" aria-labelledby="match-result-title">
              <div className="winner-energy winner-energy-left" aria-hidden="true" />
              <div className="winner-energy winner-energy-right" aria-hidden="true" />
              <div className="winner-impact-x" aria-hidden="true">X</div>
              <div className="match-result-panel">
                <span className="match-result-kicker">PERLAWANAN TAMAT</span>
                <h1 id="match-result-title">{game.winner === null ? <span className="winner-win">SERI!</span> : <><span className="winner-name">{playerDisplayName(game.winner)}</span><span className="winner-win">MENANG!</span></>}</h1>
                <div className="match-result-score">ZON X · {game.players[0].x.length} — {game.players[1].x.length}</div>{activeOnlineMatch && game.phase === 'GAME_OVER' && <div className="mx-online-result-points">{onlineMatchResult ? <><strong>{onlineMatchResult.winner_id === onlineSession?.userId ? `+${onlineMatchResult.winner_points_delta}` : `${onlineMatchResult.loser_points_delta}`} PTS</strong><span>{onlineMatchResult.scored ? `${onlineMatchResult.my_start_place > 0 ? `#${onlineMatchResult.my_start_place} → ` : ''}#${onlineMatchResult.my_place} · ${onlineMatchResult.my_start_points} → ${onlineMatchResult.my_points} PTS` : `NO POINTS — REPEAT OPPONENT LIMIT · #${onlineMatchResult.my_place}`}</span></> : <span>SYNCING RESULT…</span>}<button onClick={returnToLobbyFromResult} disabled={matchNetworkBusy}>RETURN TO LOBBY</button></div>}
                {game.message.includes('Penentuan Seri:') && (
                  <div className="tie-breaker-reveal">
                    <strong>PENENTUAN SERI</strong>
                    <span>{game.message.replace(/^Zon X seri\.\s*/i, '')}</span>
                  </div>
                )}
                {!game.message.includes('Penentuan Seri:') && <p>{game.message}</p>}
                {!activeOnlineMatch && <button className="match-rematch-button" onClick={resetToCoin}>PERLAWANAN BARU</button>}
              </div>
            </div>
          )}
          {activeOnlineMatch && onlineMessage && <div className="mx-live-status mx-arena-status" role="status">{onlineMessage}</div>}
          <header className="fighter-hud">
            {activeOnlineMatch && game.phase !== 'GAME_OVER' && <button className="mx-quit-match" disabled={matchNetworkBusy} onClick={quitOnlineMatch}>QUIT MATCH</button>}
            <div className="arcade-center-hud">
              <div className="round-slam" key={`round-${game.round}`}>PUSINGAN {game.round}</div>
              {game.message.includes('peluang serangan') && game.message.includes('disekat') && (
                <div className="mx-attack-blocked-slam" role="status" aria-live="assertive">
                  <strong>SERANGAN DISEKAT</strong>
                  <span>EFFECT AKTIF — GILIRAN SERANGAN DILANGKAU</span>
                </div>
              )}
              {actionTimerVisible && <div className={`mx-action-timer ${actionSecondsLeft <= 5 ? 'is-critical' : actionSecondsLeft <= 10 ? 'is-danger' : actionSecondsLeft <= 15 ? 'is-warning' : ''}`}><span>{actionTimerIndex === localViewer ? 'YOUR TURN' : 'OPPONENT TURN'}</span><strong>{actionSecondsLeft}</strong><em>SEC</em><i aria-hidden="true"><b style={{ width: Math.max(0, Math.min(100, (actionSecondsLeft / 60) * 100)) + '%' }} /></i></div>}
            </div>
          </header>
          <div className="arena-history-callout" key={game.message}>{game.message}</div>

          <PlayerHand
            title=""
            hand={game.players[topPlayer].hand}
            hidden={true}
            opponent
            canSetVS={false}
            canPlayEffect={false}
            onSetVS={() => {}}
            onPlayEffect={() => {}}
            motionAnchor={`p${topPlayer + 1}-hand`}
            arrivingCardIds={arrivingIdsForZone(`p${topPlayer + 1}-hand`)}
            displayCount={Math.max(0, game.players[topPlayer].hand.length - arrivalCount(`p${topPlayer + 1}-hand`))}
          />

          <div className="arena-wrap">
            <div className={`arena arena-v9 phase-${game.phase.toLowerCase()} ${game.phase === 'EFFECT' && game.effectTurn === localViewer ? 'phase-effect-local' : ''}`}>
              <div className="energy-field" aria-hidden="true" />
              <div className="arena-depth-grid" aria-hidden="true" />
              <div className="arena-energy-core arena-energy-core-left" aria-hidden="true" />
              <div className="arena-energy-core arena-energy-core-right" aria-hidden="true" />
              <div className="arena-pressure-field" aria-hidden="true" />
              <div className="arena-particle-field" aria-hidden="true">
                {arenaParticles.map((particle) => (
                  <span
                    key={particle.id}
                    className="arena-firefly"
                    style={{
                      ['--mx-x' as any]: `${particle.x}%`,
                      ['--mx-y' as any]: `${particle.y}%`,
                      ['--mx-size' as any]: `${particle.size}px`,
                      ['--mx-duration' as any]: `${particle.duration}s`,
                      ['--mx-delay' as any]: `${particle.delay}s`,
                      ['--mx-dx' as any]: `${particle.driftX}px`,
                      ['--mx-dy' as any]: `${particle.driftY}px`,
                      ['--mx-glow' as any]: `${particle.glow}s`,
                      ['--mx-opacity' as any]: particle.opacity,
                      ['--mx-color' as any]: particle.color,
                    }}
                  />
                ))}
              </div>
              <div className="arena-live-rail" aria-hidden="true" />
              <div className={`fighter-identity fighter-identity-left ${activePlayer === 0 ? 'is-active' : ''}`}>
                <span className="fighter-id-side">X FIGHTER 1</span>
                <strong>{playerDisplayName(0)}</strong>
                {activePlayer === 0 && <em>AKTIF</em>}
              </div>
              <div className={`fighter-identity fighter-identity-right ${activePlayer === 1 ? 'is-active' : ''}`}>
                <span className="fighter-id-side">X FIGHTER 2</span>
                <strong>{playerDisplayName(1)}</strong>
                {activePlayer === 1 && <em>AKTIF</em>}
              </div>
              {passToPlayer === null && game.phase === 'SET_VS' && setupPlayer === localViewer && (
                <div className="arena-vs-prompt">
                  <strong className="mx-responsive-vs-title">PILIH KAD VS</strong>
                </div>
              )}
              {passToPlayer === null && game.phase === 'EFFECT' && game.effectTurn === localViewer && (
                <div className="arena-command-prompt">
                  <strong className="mx-responsive-effect-title">PILIH KAD EFFECT</strong>
                </div>
              )}

              <div className={`center-clash ${impactFx ? `is-combat stage-${impactFx.stage.toLowerCase()}` : ''}`} aria-hidden="true">
                <div className="arena-ring-fx" />
                <div className="vs-emblem"><span>VS</span></div>
                {impactFx && <div className="combat-callout">SERANG!</div>}
              </div>
              {impactFx && (
                <div className={`combat-screen-fx stage-${impactFx.stage.toLowerCase()}`} aria-hidden="true">
                  <i className="combat-flash" />
                  <i className="combat-shock combat-shock-one" />
                  <i className="combat-shock combat-shock-two" />
                  <i className="combat-slash combat-slash-one" />
                  <i className="combat-slash combat-slash-two" />
                </div>
              )}
              {motionFx && (
                <div className={`motion-card-fx ${motionFx.kind.toLowerCase()} ${motionFx.from} ${motionFx.to}`} style={motionStyle(motionFx)} key={`${motionFx.card.id}-${motionFx.kind}-${motionFx.to}`}>
                  {motionFx.kind === 'DRAW' ? (
                    <div className="digital-card card-back motion-hidden-card">
                      <img src="/cards/back-game.webp" alt="Kad diambil secara tertutup" />
                    </div>
                  ) : (
                    <CardView card={motionFx.card} />
                  )}
                  <strong>{motionFx.kind === 'CAPTURE' ? 'ZON X!' : motionFx.kind === 'DESTROY' ? 'DIMUSNAHKAN!' : motionFx.kind === 'DISCARD' ? 'BUANG!' : motionFx.kind === 'RETURN' ? 'KEMBALI!' : motionFx.kind === 'ENTER_VS' ? 'X FIGHTER MASUK!' : motionFx.kind === 'SUPPORT' ? 'EFFECT AKTIF!' : 'AMBIL KAD!'}</strong>
                </div>
              )}

              <section className="fighter-field fighter-field-left">
                <div className={`fighter-turn-energy fighter-turn-energy-left ${activePlayer === 0 ? 'is-active' : ''}`} aria-hidden="true" />
                <div className="stat-fx-layer" aria-live="polite">{statFx.filter((fx) => fx.player === 0).map((fx) => <span key={fx.id} className={`stat-fx stat-${fx.stat.toLowerCase()}`}>{fx.stat} {fx.delta > 0 ? '+' : ''}{fx.delta}</span>)}</div>
                <div className="vs-battle-row">
                  <LiveStats stats={isCardArriving(game.players[0].vs?.card.id, 'p1-vs') ? null : currentStats[0]} side="left" />
                  <div data-motion-anchor="p1-vs" className={`v9-vs-card ${impactFx?.attacker === 0 ? `is-attacking stage-${impactFx.stage.toLowerCase()}` : ''} ${impactFx?.defender === 0 ? `is-hit stage-${impactFx.stage.toLowerCase()}` : ''} ${isCardArriving(game.players[0].vs?.card.id, 'p1-vs') ? 'is-arrival-hidden' : ''}`}>
                    <VSZone title="" vs={game.players[0].vs} stats={currentStats[0]} hidden={!revealRoundOneVS && game.round === 1} onInspect={(card) => setFocusedCard(card)} />
                  </div>
                </div>
                <div className={`effect-rack ${game.phase === 'EFFECT' && game.effectTurn === 0 ? 'is-valid-destination' : ''}`} data-motion-anchor="p1-effect">
                  {Array.from({ length: 5 }, (_, i) => {
                    const effect = game.players[0].effects[i]
                    return <div key={`p1-effect-${i}`} className="effect-card-slot"><span>EFFECT {i + 1}</span>{effect && <button data-card-id={effect.card.id} className={`zone-card-button ${isCardArriving(effect.card.id, 'p1-effect') ? 'is-arrival-hidden' : ''}`} onClick={() => setFocusedCard(effect.card)}><CardView card={effect.card} /></button>}</div>
                  })}
                </div>
              </section>

              <section className="fighter-field fighter-field-right">
                <div className={`fighter-turn-energy fighter-turn-energy-right ${activePlayer === 1 ? 'is-active' : ''}`} aria-hidden="true" />
                <div className="stat-fx-layer" aria-live="polite">{statFx.filter((fx) => fx.player === 1).map((fx) => <span key={fx.id} className={`stat-fx stat-${fx.stat.toLowerCase()}`}>{fx.stat} {fx.delta > 0 ? '+' : ''}{fx.delta}</span>)}</div>
                <div className="vs-battle-row reverse">
                  <div data-motion-anchor="p2-vs" className={`v9-vs-card ${impactFx?.attacker === 1 ? `is-attacking stage-${impactFx.stage.toLowerCase()}` : ''} ${impactFx?.defender === 1 ? `is-hit stage-${impactFx.stage.toLowerCase()}` : ''} ${isCardArriving(game.players[1].vs?.card.id, 'p2-vs') ? 'is-arrival-hidden' : ''}`}>
                    <VSZone title="" vs={game.players[1].vs} stats={currentStats[1]} hidden={!revealRoundOneVS && game.round === 1} onInspect={(card) => setFocusedCard(card)} />
                  </div>
                  <LiveStats stats={isCardArriving(game.players[1].vs?.card.id, 'p2-vs') ? null : currentStats[1]} side="right" />
                </div>
                <div className={`effect-rack ${game.phase === 'EFFECT' && game.effectTurn === 1 ? 'is-valid-destination' : ''}`} data-motion-anchor="p2-effect">
                  {Array.from({ length: 5 }, (_, i) => {
                    const effect = game.players[1].effects[i]
                    return <div key={`p2-effect-${i}`} className="effect-card-slot"><span>EFFECT {i + 1}</span>{effect && <button data-card-id={effect.card.id} className={`zone-card-button ${isCardArriving(effect.card.id, 'p2-effect') ? 'is-arrival-hidden' : ''}`} onClick={() => setFocusedCard(effect.card)}><CardView card={effect.card} /></button>}</div>
                  })}
                </div>
              </section>

              <div className="pile-cluster score-pile p1-x" data-motion-anchor="p1-x">
                <button className="support-zone pile-button x-pile" onClick={() => setPileView({ title: 'X FIGHTER 1 · ZON X', cards: game.players[0].x })}>
                  <span>ZON X</span>{visiblePileTop(game.players[0].x, 'p1-x') ? <CardView card={visiblePileTop(game.players[0].x, 'p1-x')!} /> : <span className="empty-pile">CAPTURE</span>}
                </button><span key={`p1-score-${game.players[0].x.length}`} className="pile-counter x-counter score-pulse">{displayedPileCount('p1-x', game.players[0].x.length)}</span>
              </div>
              <div className="pile-cluster score-pile p2-x" data-motion-anchor="p2-x">
                <button className="support-zone pile-button x-pile" onClick={() => setPileView({ title: 'X FIGHTER 2 · ZON X', cards: game.players[1].x })}>
                  <span>ZON X</span>{visiblePileTop(game.players[1].x, 'p2-x') ? <CardView card={visiblePileTop(game.players[1].x, 'p2-x')!} /> : <span className="empty-pile">CAPTURE</span>}
                </button><span key={`p2-score-${game.players[1].x.length}`} className="pile-counter x-counter score-pulse">{displayedPileCount('p2-x', game.players[1].x.length)}</span>
              </div>
              <div className="pile-cluster p1-discard" data-motion-anchor="p1-discard"><button className="support-zone pile-button" onClick={() => setPileView({ title: 'X FIGHTER 1 · ZON TEPI', cards: game.players[0].discard })}><span>ZON TEPI</span>{visiblePileTop(game.players[0].discard, 'p1-discard') ? <CardView card={visiblePileTop(game.players[0].discard, 'p1-discard')!} /> : <span className="empty-pile">BUANG</span>}</button></div>
              <div className={`pile-cluster master-pile ${/shuffle/i.test(game.message) ? 'is-shuffling' : ''}`} data-motion-anchor="master"><div className="support-zone deck-pile"><img src="/cards/back-game.webp" alt="Master Deck" /><span className="deck-card-title">MASTER DECK</span></div><span className="pile-counter">{displayedDeckCount}</span></div>
              <div className="pile-cluster p2-discard" data-motion-anchor="p2-discard"><button className="support-zone pile-button" onClick={() => setPileView({ title: 'X FIGHTER 2 · ZON TEPI', cards: game.players[1].discard })}><span>ZON TEPI</span>{visiblePileTop(game.players[1].discard, 'p2-discard') ? <CardView card={visiblePileTop(game.players[1].discard, 'p2-discard')!} /> : <span className="empty-pile">BUANG</span>}</button></div>
            </div>
          </div>

          <PlayerHand
            title="TANGAN ANDA"
            hand={game.players[bottomPlayer].hand}
            hidden={passToPlayer !== null}
            canSetVS={
              game.phase === 'SET_VS' &&
              game.needsVS[bottomPlayer] &&
              (activeOnlineMatch ? true : setupPlayer === bottomPlayer) &&
              !pendingChoice &&
              passToPlayer === null
            }
            canPlayEffect={
              game.phase === 'EFFECT' &&
              game.effectTurn === bottomPlayer &&
              !pendingChoice &&
              passToPlayer === null
            }
            onSetVS={(id, pos) => setVS(bottomPlayer, id, pos)}
            onPlayEffect={(id) => playEffect(bottomPlayer, id)}
            onInspect={(card) => setFocusedCard(card)}
            motionAnchor={`p${bottomPlayer + 1}-hand`}
            arrivingCardIds={arrivingIdsForZone(`p${bottomPlayer + 1}-hand`)}
            displayCount={Math.max(0, game.players[bottomPlayer].hand.length - arrivalCount(`p${bottomPlayer + 1}-hand`))}
          />

          <div className="action-bar">
            {canBegin && passToPlayer === null && (!activeOnlineMatch || localViewer === game.firstPlayer) && <button onClick={beginRound}>MULA PUSINGAN</button>}

            {game.phase === 'EFFECT' && game.effectTurn !== null && passToPlayer === null && (!activeOnlineMatch || game.effectTurn === localViewer) && (
              <>
                {game.round > 1 &&
                  game.players[game.effectTurn].vs &&
                  !game.players[game.effectTurn].vs!.positionChangedThisRound &&
                  !hasActiveEffect(game, other(game.effectTurn), 6) &&
                  !game.effectActionTaken[game.effectTurn] && (
                    <button onClick={() => switchPosition(game.effectTurn!)}>TUKAR POSISI VS</button>
                  )}
                <button className={`end-turn-action ${!game.effectActionTaken[game.effectTurn] ? 'end-turn-warning' : ''}`} onClick={requestEndEffectTurn}>{game.effectActionTaken[game.effectTurn] ? 'TAMAT GILIRAN' : 'TAMAT TANPA EFFECT'}</button>
              </>
            )}

            {game.phase === 'ATTACK' && game.attackTurn !== null && passToPlayer === null && (!activeOnlineMatch || game.attackTurn === localViewer) && (
              <>
                {game.players[game.attackTurn].vs?.position === 'ATK' && <button className="primary-action" onClick={() => attack(game.attackTurn!)}>SERANG</button>}
                <button onClick={() => passAttack(game.attackTurn!)}>PASS</button>
              </>
            )}

            {game.phase === 'GAME_OVER' && (
              <>
                <strong>{game.winner === null ? 'SERI' : `${playerLabel(game.winner)} MENANG`}</strong>
                <button onClick={resetToCoin}>PERLAWANAN BARU</button>
              </>
            )}
          </div>

          {confirmEndWithoutEffect && (
            <div className="end-turn-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="end-turn-confirm-title">
              <div className="end-turn-confirm-panel">
                <div className="end-turn-confirm-kicker">AMARAN</div>
                <h2 id="end-turn-confirm-title">ANDA PASTI MAHU TAMATKAN GILIRAN TANPA BERMAIN KAD EFFECT?</h2>
                <p>Anda belum memainkan kad Effect pada giliran ini.</p>
                <div className="end-turn-confirm-actions">
                  <button className="confirm-yes" onClick={endEffectTurn}>YA</button>
                  <button className="confirm-no" autoFocus onClick={() => setConfirmEndWithoutEffect(false)}>TIDAK</button>
                </div>
              </div>
            </div>
          )}

          {focusedCard && passToPlayer === null && pendingChoice === null && game.pendingBoardChoice === null && (
            <div className="card-focus-overlay" onClick={() => setFocusedCard(null)}>
              <div className="card-focus-panel" onClick={(e: any) => e.stopPropagation()}>
                <CardView card={focusedCard} full />
                <button onClick={() => setFocusedCard(null)}>TUTUP</button>
              </div>
            </div>
          )}

          {pileView && passToPlayer === null && pendingChoice === null && !game.pendingSelfDiscard && game.pendingBoardChoice === null && (
            <div className="card-focus-overlay" onClick={() => setPileView(null)}>
              <div className="pile-view-panel" onClick={(e: any) => e.stopPropagation()}>
                <div className="pile-view-header"><h3>{pileView.title}</h3><span>{pileView.cards.length} KAD</span></div>
                <div className="pile-card-grid">
                  {pileView.cards.length === 0 ? <p className="empty-copy">Tiada kad.</p> : pileView.cards.map((card, index) => (
                    <button key={`${card.id}-${index}`} className="pile-card-choice" onClick={() => { setPileView(null); setFocusedCard(card) }}>
                      <CardView card={card} />
                    </button>
                  ))}
                </div>
                <button onClick={() => setPileView(null)}>TUTUP</button>
              </div>
            </div>
          )}

          {game.pendingSelfDiscard && passToPlayer === null && pendingChoice === null && (
            <div className="choice-overlay">
              <div className="choice-panel discard-panel" data-pending-discard-reason={game.pendingSelfDiscard.reason} data-pending-discard-mode={game.pendingSelfDiscard.mode} data-pending-discard-count={game.pendingSelfDiscard.count}>
                {activeOnlineMatch && game.pendingSelfDiscard.player !== localViewer ? (
                  <>
                    <h3>MENUNGGU LAWAN</h3>
                    <p>{playerLabel(game.pendingSelfDiscard.player)} sedang memilih kad untuk dibuang.</p>
                  </>
                ) : (
                  <>
                    <h3>{game.pendingSelfDiscard.reason.startsWith('SPUDUR') ? 'PILIH KAD UNTUK SPUDUR' : 'PILIH KAD UNTUK DIBUANG'}</h3>
                    <p>
                      {game.pendingSelfDiscard.mode === 'ANY'
                        ? 'Pilih mana-mana kad tangan yang mahu dibuang, kemudian sahkan. Boleh pilih 0 kad.'
                        : `Pilih tepat ${game.pendingSelfDiscard.count} kad. ${selectedDiscardIds.length}/${game.pendingSelfDiscard.count} dipilih.`}
                    </p>
                    <div className="discard-card-grid">
                      {game.players[game.pendingSelfDiscard.player].hand.map((card) => {
                        const selected = selectedDiscardIds.includes(card.id)
                        return (
                          <button key={card.id} className={`discard-card-choice ${selected ? 'is-selected' : ''}`} onClick={() => toggleDiscardCard(card.id)}>
                            <CardView card={card} />
                            <span className="discard-check">{selected ? '✓ DIPILIH' : 'PILIH'}</span>
                          </button>
                        )
                      })}
                    </div>
                    <button
                      className="primary-action discard-confirm"
                      disabled={game.pendingSelfDiscard.mode === 'EXACT' && selectedDiscardIds.length !== game.pendingSelfDiscard.count}
                      onClick={confirmSelfDiscard}
                    >
                      SAHKAN BUANG
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {passToPlayer !== null && (
            <div className="choice-overlay">
              <div className="choice-panel handoff-panel">
                <h2>SERAH PERANTI</h2>
                <p>Serahkan peranti kepada {playerLabel(passToPlayer)}.</p>
                <p>Kedua-dua tangan disembunyikan sehingga pemain seterusnya bersedia.</p>
                <button onClick={confirmPlayerHandoff}>
                  SAYA {playerLabel(passToPlayer)} — TERUSKAN
                </button>
              </div>
            </div>
          )}

          {game.pendingBoardChoice && passToPlayer === null && pendingChoice === null && (
            <div className="choice-overlay">
              <div className="choice-panel board-choice-panel" data-pending-choice-kind={game.pendingBoardChoice.purpose} data-pending-choice-remaining={game.pendingBoardChoice.cardIds.length} data-pending-choice-source={game.pendingBoardChoice.title}>
                {activeOnlineMatch && game.pendingBoardChoice.chooser !== localViewer ? (
                  <>
                    <h3>MENUNGGU LAWAN</h3>
                    <p>{playerLabel(game.pendingBoardChoice.chooser)} sedang memilih sasaran.</p>
                  </>
                ) : (
                  <>
                    <h3>PILIH KAD</h3>
                    <p>{game.pendingBoardChoice.title}</p>
                    <div className="target-row board-target-row">
                      {game.pendingBoardChoice.cardIds.map((cardId) => {
                        const vsCard = game.players[game.pendingBoardChoice!.target].vs?.card
                        const effectCard = game.players[game.pendingBoardChoice!.target].effects.find((e) => e.card.id === cardId)?.card
                        const card = vsCard?.id === cardId ? vsCard : effectCard
                        if (!card) return null
                        return (
                          <button className="target-effect board-target-card" key={`board-${cardId}`} onClick={() => resolveBoardChoice(cardId)}>
                            <CardView card={card} />
                            <small>{vsCard?.id === cardId ? 'ZON VS' : 'ZON EFFECT'}</small>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {pendingChoice && passToPlayer === null && (
            <div className="choice-overlay">
              <div className="choice-panel" data-pending-choice-kind={pendingChoice.kind} data-pending-choice-remaining={pendingChoice.remaining} data-pending-choice-source={pendingChoice.sourceCardName}>
                {activeOnlineMatch && pendingChoice.chooser !== localViewer ? (
                  <>
                    <h3>MENUNGGU LAWAN</h3>
                    <p>{playerLabel(pendingChoice.chooser)} sedang memilih sasaran tertutup.</p>
                  </>
                ) : (
                  <>
                    <h3>PILIH SASARAN</h3>
                    <p>{playerLabel(pendingChoice.chooser)}: pilih {pendingChoice.remaining} kad lagi.</p>

                    {pendingChoice.kind === 'PELUNCUR' && game.players[pendingChoice.target].effects.length > 0 && (
                      <div className="target-row">
                        {game.players[pendingChoice.target].effects.map((effect) => (
                          <button className="target-effect" key={`effect-${effect.card.id}`} onClick={() => resolveVisibleEffectCard(effect.card.id)}>
                            <CardView card={effect.card} compact />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="target-row">
                      {pendingChoice.hiddenOrder.map((cardId, index) => (
                        <button className="card-back-button" key={`hidden-${cardId}`} onClick={() => resolveHiddenHandCard(cardId)}>
                          <img src="/cards/back-game.webp" alt="Kad tersembunyi" />
                          <small>KAD {index + 1}</small>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {!activeOnlineMatch && <details className="test-tools" open={false}>
            <summary>ALAT UJIAN</summary>
            <select value={testCardId} onChange={(e: any) => setTestCardId(Number(e.target.value))}>
              {masterDeck.map((card) => <option key={card.id} value={card.id}>#{card.id} {card.name}</option>)}
            </select>
            <button disabled={passToPlayer !== null || pendingChoice !== null} onClick={() => giveTestCard(0)}>BERI X FIGHTER 1</button>
            <button disabled={passToPlayer !== null || pendingChoice !== null} onClick={() => giveTestCard(1)}>BERI X FIGHTER 2</button>
          </details>}
        </section>
      )}
    </main>
  )
}

function resolveEffect(game: GameState, owner: PlayerIndex, effect: EffectState) {
  const opponent = other(owner)
  const card = effect.card

  switch (card.id) {
    case 1:
      drawCards(game, owner, 1, owner)
      game.message = `${card.name}: ${playerLabel(owner)} ambil 1 kad.`
      break
    case 2:
    case 4:
    case 12:
    case 20:
    case 24:
    case 29:
      game.message = `${card.name}: Effect berterusan aktif selagi kad ini kekal di medan.`
      break
    case 3:
      game.message = `${card.name}: pemilihan tangan lawan dikendalikan secara tertutup.`
      break
    case 5:
      destroyAllEffects(game, opponent)
      game.message = `${card.name}: semua kad Effect lawan dimusnahkan.`
      break
    case 6: {
      const opponentVS = game.players[opponent].vs
      if (opponentVS) opponentVS.position = 'DEF'
      game.message = 'BARA NANDEZ: LAWAN TIDAK BOLEH TUKAR POSISI ATK/DEF PADA GILIRAN SETERUSNYA.'
      break
    }
    case 7:
      destroyOneEligibleVSOrEffect(game, owner, opponent, 'DEF', (value) => {
        const own = getVSStats(game, owner)
        return own ? value < own.def : false
      }, `${card.name}: pilih VS/Effect lawan dengan DEF lebih rendah daripada DEF VS anda.`)
      break
    case 8:
      modifySta(game, owner, opponent, -3)
      break
    case 9:
      game.message = `${card.name}: Effect tangkapan berterusan aktif.`
      break
    case 10:
      destroyOneEligibleVSOrEffect(game, owner, opponent, 'ATK', (value) => value <= 800, `${card.name}: pilih VS/Effect lawan dengan ATK 800 atau ke bawah.`)
      break
    case 11:
      modifySta(game, owner, opponent, -2)
      break
    case 13:
      game.players[opponent].attackBlocks += 1
      game.message = `${card.name}: DEF VS lawan -200 selagi aktif dan peluang serangan seterusnya disekat.`
      break
    case 14:
      game.players[opponent].attackBlocks += 1
      game.message = `${card.name}: serangan lawan seterusnya disekat dan hanya 2 slot Zon Effect boleh digunakan selagi kad ini aktif.`
      break
    case 15:
      game.message = `${card.name}: pemilihan sasaran dikendalikan melalui kad tangan tertutup / Zon Effect terbuka.`
      break
    case 16:
      drawCards(game, owner, 3, owner)
      game.message = `${card.name}: ${playerLabel(owner)} ambil 3 kad.`
      break
    case 17:
      resolveGravitian(game, owner, opponent)
      break
    case 18:
      game.message = `${card.name}: had tangan / Zon Effect lawan dikendalikan oleh sistem pilihan tertutup.`
      break
    case 19:
      modifySta(game, owner, owner, -1)
      if (game.phase !== 'GAME_OVER' && game.phase !== 'SET_VS') {
        game.message = `${card.name}: STA VS sendiri -1; +1000 ATK selagi KAPORES kekal di Zon Effect.`
      }
      break
    case 21:
      setStaZero(game, owner, opponent)
      break
    case 22:
      game.message = `${card.name}: pemilihan tangan lawan dikendalikan secara tertutup.`
      break
    case 23:
      returnOneOpponentEffectToDeck(game, opponent)
      break
    case 25:
      drawCards(game, owner, 5, owner)
      game.message = `${card.name}: ${playerLabel(owner)} ambil 5 kad.`
      break
    case 26: {
      game.pendingSelfDiscard = {
        player: owner,
        count: 0,
        mode: 'ANY',
        reason: 'SPUDUR_EFFECT',
        sourceEffectSeq: effect.seq,
      }
      game.message = `${card.name}: pilih kad tangan secara visual untuk dibuang. Setiap kad memberi -100 ATK kepada VS lawan.`
      break
    }
    case 27:
      if (game.players[owner].vs?.position === 'DEF' && game.players[opponent].vs) {
        const captured = game.players[opponent].vs!.card
        game.players[owner].x.push(captured)
        game.players[opponent].vs = null
        game.players[opponent].discard.push(...game.players[opponent].hand)
        game.players[opponent].hand = []
        finishRoundWithExistingResult(
          game,
          owner,
          opponent,
          `${card.name}: LIGHT SWORD PRISM mengambil ${captured.name} ke Zon X dan memusnahkan semua kad tangan lawan.`,
        )
      } else {
        game.message = `${card.name}: syarat tidak dipenuhi kerana VS pemain bukan dalam posisi DEF.`
      }
      break
    case 28:
      resolveBlackHole(game, owner)
      break
    case 30:
      drawCardsWithoutHandLimit(game, owner, 5)
      mandatoryDiscard(game, owner, 2)
      game.message = `${card.name}: ambil 5 kad, kemudian buang tepat 2 kad ke Zon Tepi.`
      break
    default:
      game.message = `${card.name}: tiada Effect tambahan untuk diselesaikan.`
  }

}

function getVSStats(game: GameState, player: PlayerIndex): { atk: number; def: number; sta: number } | null {
  const vs = game.players[player].vs
  if (!vs) return null
  let atk = vs.card.atk
  let def = vs.card.def

  if (vs.card.id === 26) atk += vs.spudurDiscardCount * 100

  const allEffects: { owner: PlayerIndex; effect: EffectState }[] = []
  game.players[0].effects.forEach((effect) => allEffects.push({ owner: 0, effect }))
  game.players[1].effects.forEach((effect) => allEffects.push({ owner: 1, effect }))
  allEffects.sort((a, b) => a.effect.seq - b.effect.seq)

  for (const { owner, effect } of allEffects) {
    const id = effect.card.id
    if (owner === player) {
      if (id === 19) atk += 1000
      if (id === 20) atk += 600
    } else {
      if (id === 2) atk = 0
      if (id === 4) atk -= 100
      if (id === 12) atk -= 200
      if (id === 13) def -= 200
      if (id === 24) [atk, def] = [def, atk]
      if (id === 26) atk -= effect.spudurDiscardCount * 100
    }
  }

  if (vs.card.id === 29 && game.players[player].effects.some((e) => e.card.name.includes('BARA'))) {
    atk *= 2
  }

  // SINGAU is absolute while it remains in the opponent Effect Zone.
  if (hasActiveEffect(game, other(player), 2)) atk = 0

  return {
    atk: Math.max(0, atk),
    def: Math.max(0, def),
    sta: Math.max(0, vs.card.sta + vs.staDelta),
  }
}

function getEffectCapacity(game: GameState, player: PlayerIndex) {
  const stats = getVSStats(game, player)
  if (!stats) return 0
  let capacity = Math.min(5, Math.max(0, Math.min(stats.sta, 6) - 1))
  if (hasActiveEffect(game, other(player), 14)) capacity = Math.min(capacity, 2)
  if (hasCurrentRoundEffect(game, other(player), 18)) capacity = Math.min(capacity, 2)
  return capacity
}

function getHandLimit(game: GameState, player: PlayerIndex) {
  return hasCurrentRoundEffect(game, other(player), 18) ? 2 : 5
}

function hasActiveEffect(game: GameState, player: PlayerIndex, cardId: number) {
  return game.players[player].effects.some((e) => e.card.id === cardId)
}

function hasCurrentRoundEffect(game: GameState, player: PlayerIndex, cardId: number) {
  return game.players[player].effects.some((e) => e.card.id === cardId && e.playedRound === game.round)
}

function qualifiesForNaga(card: Card) {
  return card.atk <= 500 || card.def <= 500
}

function applyNagaCaptures(game: GameState) {
  for (const owner of [0, 1] as PlayerIndex[]) {
    if (!hasActiveEffect(game, owner, 9)) continue
    const opponent = other(owner)

    const capturedEffects = game.players[opponent].effects.filter((e) => qualifiesForNaga(e.card))
    if (capturedEffects.length > 0) {
      game.players[opponent].effects = game.players[opponent].effects.filter((e) => !qualifiesForNaga(e.card))
      game.players[owner].x.push(...capturedEffects.map((e) => e.card))
    }

    const opponentVS = game.players[opponent].vs
    if (opponentVS && qualifiesForNaga(opponentVS.card)) {
      const captured = opponentVS.card
      game.players[owner].x.push(captured)
      game.players[opponent].vs = null
      finishRoundWithExistingResult(game, owner, opponent, `NAGA ANGIN mengambil ${captured.name} daripada Zon VS lawan ke Zon X.`)
      return
    }
  }
}

function drawCards(game: GameState, player: PlayerIndex, amount: number, chooser: PlayerIndex) {
  const count = Math.min(amount, game.deck.length)
  const drawn = game.deck.splice(0, count)
  game.players[player].hand.push(...drawn)
  if (game.deck.length === 0) game.deckExhausted = true
  enforceHandLimit(game, player, chooser)
}

function drawCardsWithoutHandLimit(game: GameState, player: PlayerIndex, amount: number) {
  const count = Math.min(amount, game.deck.length)
  const drawn = game.deck.splice(0, count)
  game.players[player].hand.push(...drawn)
  if (game.deck.length === 0) game.deckExhausted = true
}

function enforceHandLimit(game: GameState, player: PlayerIndex, chooser: PlayerIndex) {
  void chooser
  const limit = getHandLimit(game, player)
  const excess = Math.max(0, game.players[player].hand.length - limit)
  if (excess <= 0) return

  if (game.pendingSelfDiscard && game.pendingSelfDiscard.player === player) {
    game.pendingSelfDiscard.count = Math.max(game.pendingSelfDiscard.count, excess)
    return
  }

  game.pendingSelfDiscard = {
    player,
    count: excess,
    mode: 'EXACT',
    reason: 'HAND_LIMIT',
  }
  game.message = `${playerLabel(player)} melebihi had tangan. Pilih ${excess} kad sendiri untuk dibuang.`
}

function mandatoryDiscard(game: GameState, player: PlayerIndex, amount: number) {
  const count = Math.min(amount, game.players[player].hand.length)
  if (count <= 0) return
  if (game.pendingSelfDiscard && game.pendingSelfDiscard.player === player) {
    game.pendingSelfDiscard.followUpCount = (game.pendingSelfDiscard.followUpCount ?? 0) + count
    return
  }
  game.pendingSelfDiscard = {
    player,
    count,
    mode: 'EXACT',
    reason: 'PIPIT',
  }
}

function discardSelectedCardsOnce(game: GameState, player: PlayerIndex, indexes: number[]) {
  if (indexes.length === 0) return 0
  const uniqueDescending = [...new Set(indexes)]
    .filter((i) => i >= 0 && i < game.players[player].hand.length)
    .sort((a, b) => b - a)
  const discarded: Card[] = []
  for (const index of uniqueDescending) {
    const [card] = game.players[player].hand.splice(index, 1)
    if (card) discarded.push(card)
  }
  game.players[player].discard.push(...discarded.reverse())
  return discarded.length
}

function destroyAllEffects(game: GameState, player: PlayerIndex) {
  game.players[player].discard.push(...game.players[player].effects.map((e) => e.card))
  game.players[player].effects = []
}

function destroyOneEligibleVSOrEffect(
  game: GameState,
  chooser: PlayerIndex,
  target: PlayerIndex,
  stat: 'ATK' | 'DEF',
  eligible: (value: number) => boolean,
  title: string,
) {
  const cardIds: number[] = []
  const vs = game.players[target].vs
  if (vs) {
    const value = stat === 'ATK' ? vs.card.atk : vs.card.def
    if (eligible(value)) cardIds.push(vs.card.id)
  }
  for (const effect of game.players[target].effects) {
    const value = stat === 'ATK' ? effect.card.atk : effect.card.def
    if (eligible(value)) cardIds.push(effect.card.id)
  }
  if (cardIds.length === 0) {
    game.message = `${title} Tiada sasaran yang layak.`
    return
  }
  game.pendingBoardChoice = { chooser, target, purpose: 'DESTROY_ELIGIBLE', title, cardIds }
  game.message = `${title} Pilih kad terus pada skrin.`
}

function modifySta(game: GameState, source: PlayerIndex, target: PlayerIndex, delta: number) {
  const vs = game.players[target].vs
  if (!vs) return
  vs.staDelta += delta
  const stats = getVSStats(game, target)
  if (stats && stats.sta <= 0) {
    captureStaZero(game, target)
    return
  }
  enforceStaCapacity(game, source, target)
  if (!game.pendingBoardChoice) game.message = `${playerLabel(target)} STA VS berubah sebanyak ${delta}.`
}

function setStaZero(game: GameState, source: PlayerIndex, target: PlayerIndex) {
  const vs = game.players[target].vs
  if (!vs) return
  vs.staDelta = -vs.card.sta
  captureStaZero(game, target)
  game.message = `ULAR PELARI menjadikan STA VS lawan 0.`
}

function enforceStaCapacity(game: GameState, chooser: PlayerIndex, target: PlayerIndex) {
  const capacity = getEffectCapacity(game, target)
  if (game.players[target].effects.length <= capacity) return
  game.pendingBoardChoice = {
    chooser, target, purpose: 'STA_CAPACITY',
    title: `${playerLabel(chooser)}: STA berkurang — pilih kad Effect ${playerLabel(target)} untuk dibuang.`,
    cardIds: game.players[target].effects.map((e) => e.card.id),
  }
}

function captureStaZero(game: GameState, target: PlayerIndex) {
  const winner = other(target)
  const vs = game.players[target].vs
  if (!vs) return
  game.players[winner].x.push(vs.card)
  game.players[target].vs = null
  finishRoundWithExistingResult(game, winner, target, `${vs.card.name} mencapai STA 0 dan diambil ke Zon X ${playerLabel(winner)}.`)
}

function enforceGergasiEffectLimit(game: GameState, owner: PlayerIndex, target: PlayerIndex) {
  if (game.players[target].effects.length <= 2) return
  game.pendingBoardChoice = {
    chooser: owner, target, purpose: 'GERGASI_EFFECT',
    title: `${playerLabel(owner)}: GERGASI PEDANG BESI — pilih kad Effect lawan untuk dimusnahkan sehingga tinggal 2.`,
    cardIds: game.players[target].effects.map((e) => e.card.id),
  }
}

function returnOneOpponentEffectToDeck(game: GameState, target: PlayerIndex) {
  if (game.players[target].effects.length === 0) {
    game.message = 'MANUSIA ASID: lawan tiada kad Effect untuk dikembalikan.'
    return
  }
  game.pendingBoardChoice = {
    chooser: other(target), target, purpose: 'RETURN_EFFECT',
    title: 'MANUSIA ASID: pilih kad Effect lawan untuk dikembalikan ke Master Deck.',
    cardIds: game.players[target].effects.map((e) => e.card.id),
  }
}

function resolveGravitian(game: GameState, owner: PlayerIndex, target: PlayerIndex) {
  const returned: Card[] = []
  if (game.players[target].vs) returned.push(game.players[target].vs!.card)
  returned.push(...game.players[target].effects.map((e) => e.card))
  returned.push(...game.players[target].hand)

  game.players[target].vs = null
  game.players[target].effects = []
  game.players[target].hand = []
  game.deck.push(...returned)
  game.deck = shuffleDeck(game.deck)

  // Tetapan semula pusingan GRAVITIAN. Effect pemilik kekal; hanya medan lawan dikembalikan.
  drawCards(game, target, 5, target)

  game.round += 1
  game.effectActionTaken = [false, false]
  game.firstPlayer = target
  game.phase = 'SET_VS'
  game.effectTurn = null
  game.attackTurn = null
  game.needsVS = [false, false]
  game.needsVS[target] = true
  if (game.players[owner].vs) game.players[owner].vs!.positionChangedThisRound = false
  game.message = `GRAVITIAN mereset ${playerLabel(target)}. VS, Effect dan kad tangan mereka dikembalikan ke Master Deck dan dikocok; mereka mengambil kad untuk pusingan baharu, kemudian set VS dan bermula.`
  finishMatchIfDeckExpired(game)
}

function resolveBlackHole(game: GameState, activator: PlayerIndex) {
  for (const p of [0, 1] as PlayerIndex[]) {
    if (game.players[p].vs) game.players[p].discard.push(game.players[p].vs!.card)
    game.players[p].vs = null
    game.players[p].discard.push(...game.players[p].effects.map((e) => e.card))
    game.players[p].effects = []
  }
  refillToFive(game, activator)
  refillToFive(game, other(activator))
  game.round += 1
  game.effectActionTaken = [false, false]
  game.firstPlayer = activator
  game.phase = 'SET_VS'
  game.effectTurn = null
  game.attackTurn = null
  game.needsVS = [true, true]
  game.message = `BLACK HOLE memusnahkan kedua-dua medan. ${playerLabel(activator)} memulakan pusingan seterusnya.`
  finishMatchIfDeckExpired(game)
}

function captureVSAndFinishRound(game: GameState, winner: PlayerIndex, loser: PlayerIndex, message: string) {
  const losingVS = game.players[loser].vs
  if (!losingVS) return
  game.players[winner].x.push(losingVS.card)
  game.players[loser].vs = null
  finishRoundWithExistingResult(game, winner, loser, `${message} ${losingVS.card.name} diambil ke Zon X.`)
}

function finishRoundWithExistingResult(game: GameState, winner: PlayerIndex, loser: PlayerIndex, message: string) {
  clearEffectZones(game)
  refillToFive(game, winner)
  refillToFive(game, loser)
  game.round += 1
  game.effectActionTaken = [false, false]
  game.firstPlayer = loser
  game.phase = 'SET_VS'
  game.effectTurn = null
  game.attackTurn = null
  game.needsVS = [false, false]
  game.needsVS[loser] = true
  if (game.players[winner].vs) game.players[winner].vs!.positionChangedThisRound = false
  game.message = `${message} Pemenang isi semula dahulu; pihak kalah isi semula kedua, set VS baharu dan memulakan pusingan.`
  finishMatchIfDeckExpired(game)
}

function destroyBothVSNoWinner(game: GameState, message: string) {
  for (const p of [0, 1] as PlayerIndex[]) {
    if (game.players[p].vs) game.players[p].discard.push(game.players[p].vs!.card)
    game.players[p].vs = null
  }
  clearEffectZones(game)

  // A tied ATK clash destroys both VS cards. Both players must be able to
  // choose a replacement VS, so refill both hands before SET_VS. Without
  // this, a player who spent their last hand card on the destroyed VS can
  // be trapped in SET_VS with an empty hand and no legal action.
  refillToFive(game, game.firstPlayer)
  refillToFive(game, other(game.firstPlayer))

  game.round += 1
  game.effectActionTaken = [false, false]
  game.phase = 'SET_VS'
  game.effectTurn = null
  game.attackTurn = null
  game.needsVS = [true, true]
  game.message = `${message} Tiada pemenang. Kedua-dua X Fighter isi semula tangan, kemudian set kad VS baharu.`
  finishMatchIfDeckExpired(game)
}

function finishRoundNoWinner(game: GameState, message: string) {
  // No winner means there is no winner/loser refill sequence.
  // Both VS and surviving Effect cards remain on the field.
  game.round += 1
  game.effectActionTaken = [false, false]
  game.phase = 'EFFECT'
  game.effectTurn = game.firstPlayer
  game.attackTurn = null
  game.needsVS = [false, false]
  if (game.players[0].vs) game.players[0].vs!.positionChangedThisRound = false
  if (game.players[1].vs) game.players[1].vs!.positionChangedThisRound = false
  game.message = `${message} Tiada pemenang: tiada isi semula. Kedua-dua VS dan kad Effect yang masih ada kekal; pusingan seterusnya bermula.`
  finishMatchIfDeckExpired(game)
}

function clearEffectZones(game: GameState) {
  for (const p of [0, 1] as PlayerIndex[]) {
    game.players[p].discard.push(...game.players[p].effects.map((e) => e.card))
    game.players[p].effects = []
  }
}

function refillToFive(game: GameState, player: PlayerIndex) {
  const needed = Math.max(0, 5 - game.players[player].hand.length)
  if (needed > 0) drawCards(game, player, needed, player)
}

function beginAttackDecision(game: GameState, player: PlayerIndex, prefix = '') {
  const vs = game.players[player].vs
  if (!vs) {
    if (player === game.firstPlayer) beginAttackDecision(game, other(player), prefix)
    else finishRoundNoWinner(game, `${prefix} Tiada VS untuk menyerang.`)
    return
  }

  if (game.players[player].attackBlocks > 0) {
    game.players[player].attackBlocks -= 1
    if (player === game.firstPlayer) {
      beginAttackDecision(game, other(player), `${prefix} peluang serangan ${playerLabel(player)} disekat.`)
    } else {
      finishRoundNoWinner(game, `${prefix} peluang serangan ${playerLabel(player)} disekat.`)
    }
    return
  }

  game.phase = 'ATTACK'
  game.attackTurn = player
  game.message = `${prefix} ${playerLabel(player)}: Serang atau PASS.`.trim()
}

function finishMatchIfDeckExpired(game: GameState) {
  if (!game.deckExhausted) return
  const x1 = game.players[0].x.length
  const x2 = game.players[1].x.length
  game.phase = 'GAME_OVER'
  game.effectTurn = null
  game.attackTurn = null
  if (x1 > x2) {
    game.winner = 0
    game.message = `Master Deck habis. X Fighter 1 menang ${x1}-${x2} di Zon X.`
  } else if (x2 > x1) {
    game.winner = 1
    game.message = `Master Deck habis. X Fighter 2 menang ${x2}-${x1} di Zon X.`
  } else {
    resolveTieBreaker(game)
  }
}

function resolveTieBreaker(game: GameState) {
  const rebuilt = shuffleDeck(masterDeck)
  game.phase = 'TIE_BREAKER'
  game.effectTurn = null
  game.attackTurn = null
  game.winner = null
  game.tieBreaker = {
    deck: rebuilt,
    index: 0,
    left: null,
    right: null,
    status: 'WAITING',
    pair: 0,
  }
  game.message = 'PENENTUAN SERI'
}

function phaseLabel(game: GameState) {
  if (game.phase === 'SET_VS') return 'SET VS'
  if (game.phase === 'EFFECT') return `${game.effectTurn === null ? '' : playerLabel(game.effectTurn)} GILIRAN EFFECT`
  if (game.phase === 'ATTACK') return `${game.attackTurn === null ? '' : playerLabel(game.attackTurn)} KEPUTUSAN SERANGAN`
  if (game.phase === 'TIE_BREAKER') return 'PENENTUAN SERI'
  return 'PERLAWANAN TAMAT'
}

function LiveStats({ stats, side }: { stats: { atk: number; def: number; sta: number } | null; side: 'left' | 'right' }) {
  return (
    <div className={`live-stats ${side}`}>
      <div className="live-stat atk"><span>ATK</span><strong key={`atk-${stats?.atk ?? 'x'}`}>{stats?.atk ?? '—'}</strong></div>
      <div className="live-stat def"><span>DEF</span><strong key={`def-${stats?.def ?? 'x'}`}>{stats?.def ?? '—'}</strong></div>
      <div className="live-stat sta"><span>STA</span><strong key={`sta-${stats?.sta ?? 'x'}`}>{stats?.sta ?? '—'}</strong></div>
      <small>NILAI SEMASA</small>
    </div>
  )
}

function PlayerHand({
  title,
  hand,
  hidden = false,
  opponent = false,
  canSetVS,
  canPlayEffect,
  onSetVS,
  onPlayEffect,
  onInspect,
  motionAnchor,
  arrivingCardIds = [],
  displayCount,
}: {
  title: string
  hand: Card[]
  hidden?: boolean
  opponent?: boolean
  canSetVS: boolean
  canPlayEffect: boolean
  onSetVS: (cardId: number, position: Position) => void
  onPlayEffect: (cardId: number) => void
  onInspect?: (card: Card) => void
  motionAnchor?: string
  arrivingCardIds?: number[]
  displayCount?: number
}) {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null)
  const count = displayCount ?? hand.length
  const selectedCard = selectedCardId === null ? null : hand.find((card) => card.id === selectedCardId) ?? null
  const showActions = !!selectedCard && !hidden && (canSetVS || canPlayEffect)

  return (
    <section data-motion-anchor={motionAnchor} className={`hand-dock ${opponent ? 'opponent-hand' : 'player-hand'} ${canPlayEffect && !hidden ? 'effect-ready' : ''} ${canSetVS && !hidden ? 'vs-ready' : ''}`}>
      <div className="hand-meta">
        <div className="hand-title">{title}</div>
        <div className="hand-count">{count}</div>
      </div>
      <div className="hand-fan">
        {hand.map((card, index) => {
          const selected = !hidden && card.id === selectedCard?.id

          return (
            <div
              key={card.id}
              data-card-id={card.id}
              className={`hand-card-wrap ${hidden ? 'is-hidden' : ''} ${selected ? 'is-selected' : ''} ${arrivingCardIds.includes(card.id) ? 'is-arrival-hidden' : ''}`}
            >
              {hidden ? (
                <div className="digital-card card-back">
                  <img src="/cards/back-game.webp" alt="Kad tersembunyi" />
                </div>
              ) : (
                <button
                  className="select-card-button"
                  onClick={() => setSelectedCardId(card.id)}
                  aria-pressed={selected}
                  aria-label={`Pilih ${card.name}`}
                >
                  <CardView card={card} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {!opponent && !hidden && selectedCard && (
        <div className={`selected-card-bar ${showActions ? 'has-actions' : ''}`}>
          <span className="selected-card-name">{selectedCard.name}</span>
          <div className="selected-card-actions">
            {showActions && canSetVS && (
              <>
                <button className="primary-action" onClick={() => onSetVS(selectedCard.id, 'ATK')}>ATK</button>
                <button onClick={() => onSetVS(selectedCard.id, 'DEF')}>DEF</button>
              </>
            )}
            {showActions && canPlayEffect && (
              <button className="primary-action" onClick={() => onPlayEffect(selectedCard.id)}>EFFECT</button>
            )}
            {onInspect && <button onClick={() => onInspect(selectedCard)}>LIHAT</button>}
            <button className="quiet-action" onClick={() => setSelectedCardId(null)}>BATAL</button>
          </div>
        </div>
      )}
    </section>
  )
}

function VSZone({
  title,
  vs,
  stats,
  hidden = false,
  compact = false,
  onInspect,
}: {
  title: string
  vs: VSState | null
  stats: { atk: number; def: number; sta: number } | null
  hidden?: boolean
  compact?: boolean
  onInspect?: (card: Card) => void
}) {
  return (
    <div className="vs-zone">
      {title && <h3>{title}</h3>}
      {hidden && vs ? (
        <div className="digital-card card-back"><img src="/cards/back-game.webp" alt="Kad VS tersembunyi" /></div>
      ) : vs && stats ? (
        <div className="vs-card-stack">
          <button data-card-id={vs.card.id} className="zone-card-button vs-inspect-button" onClick={() => onInspect?.(vs.card)} aria-label={`Lihat ${vs.card.name}`}>
            <CardView card={vs.card} compact={compact} />
          </button>
          <div key={vs.position} className={`position-badge ${vs.position === 'ATK' ? 'attack-position' : 'defend-position'}`}>
            {vs.position === 'ATK' ? <AttackIcon /> : <ShieldIcon />}
            <span>{vs.position === 'ATK' ? 'POSISI SERANGAN' : 'POSISI BERTAHAN'}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function EffectZone({ title, effects, capacity }: { title: string; effects: EffectState[]; capacity: number }) {
  return (
    <div className="player-area">
      <h3>{title} — {effects.length}/{capacity}</h3>
      <div className="hand">
        {effects.map((effect) => <CardView key={effect.card.id} card={effect.card} />)}
      </div>
    </div>
  )
}

function AttackIcon() {
  return (
    <svg className="position-icon attack-blades" viewBox="0 0 36 36" aria-hidden="true">
      <path d="M5 29L25.8 8.2 31 5l-3.2 5.2L7 31H3v-4z" fill="currentColor"/>
      <path d="M31 29L10.2 8.2 5 5l3.2 5.2L29 31h4v-4z" fill="currentColor"/>
      <path d="M9 24l3 3-4 4H3v-5l4-4 2 2zm18 0l-3 3 4 4h5v-5l-4-4-2 2z" fill="currentColor"/>
      <path d="M17 15h2l1.5 3L18 21l-2.5-3L17 15z" fill="#fff1a4"/>
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="position-icon" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3l11 4v8c0 7-4.5 11.7-11 14-6.5-2.3-11-7-11-14V7l11-4zm0 5l-6 2v5c0 4.4 2.3 7.4 6 9 3.7-1.6 6-4.6 6-9v-5l-6-2z" fill="currentColor"/>
    </svg>
  )
}

const MEGAX_PRELOADED_CARD_FACES = typeof window !== 'undefined' ? Array.from({ length: 30 }, (_, index) => {
  const image = new Image()
  image.decoding = 'async'
  image.src = `/cards/game/${String(index + 1).padStart(2, '0')}.webp`
  return image
}) : []
void MEGAX_PRELOADED_CARD_FACES

function CardView({ card, compact = false, full = false }: { card: Card; compact?: boolean; full?: boolean }) {
  const filename = `${String(card.id).padStart(2, '0')}.png`
  const src = full ? `/cards/inspect/${filename.replace('.png', '.webp')}` : `/cards/game/${filename.replace('.png', '.webp')}`
  return (
    <div className={`digital-card ${compact ? 'compact-card' : ''}`}>
      <img src={src} alt={card.name} draggable={false} decoding="sync" loading="eager" />
    </div>
  )
}

export default App
