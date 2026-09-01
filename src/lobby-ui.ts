import { getSavedSession } from './onlineAuth.ts'

const SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://mmtorfzxnidsczcdygbp.supabase.co') as string
const SUPABASE_KEY = ((import.meta as any).env?.VITE_SUPABASE_KEY || 'sb_publishable_EMVTyrv3gGmmouCiVix4dg__W3zuzMc') as string
let fightCountBusy = false
let lastFightCountAt = 0

function closeAudioPanel(event?: Event) {
  const root = document.getElementById('mx-audio-controls')
  const panel = root?.querySelector<HTMLElement>('[data-audio-panel]')
  if (!root || !panel || panel.hidden) return
  if (event?.target instanceof Node && root.contains(event.target)) return
  panel.hidden = true
}

function removeDeferredLobbyButtons() {
  const blocked = new Set(['FIND MATCH', 'INBOX', 'MAIL'])
  document.querySelectorAll<HTMLButtonElement>('.mx-online-screen button, .mx-lobby-shell button').forEach((button) => {
    const label = (button.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase()
    if (blocked.has(label)) button.remove()
  })
}

function renameLeaderboard() {
  document.querySelectorAll<HTMLElement>('.mx-leaderboard h1,.mx-leaderboard h2,.mx-leaderboard h3,.mx-leaderboard [class*="title" i]').forEach((node) => {
    const label = (node.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase()
    if (/^TOP\s+(?:10|20)\s+X\s+FIGHTERS$/.test(label)) node.textContent = 'TOP X FIGHTERS'
  })
}

function enhanceLeaderboard() {
  const board = document.querySelector<HTMLElement>('.mx-leaderboard')
  const stack = board?.querySelector<HTMLElement>('.mx-rank-stack')
  if (!board || !stack) return

  board.classList.add('mx-ranks-collapsible')
  if (board.querySelector('[data-mx-rank-toggle]')) return

  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.dataset.mxRankToggle = 'true'
  toggle.className = 'mx-rank-toggle'
  toggle.textContent = 'VIEW #4–#20'
  toggle.setAttribute('aria-expanded', 'false')
  toggle.addEventListener('click', () => {
    const expanded = board.classList.toggle('mx-ranks-expanded')
    toggle.textContent = expanded ? 'HIDE #4–#20' : 'VIEW #4–#20'
    toggle.setAttribute('aria-expanded', String(expanded))
  })
  board.insertBefore(toggle, stack)
}

function enhanceRoster() {
  const roster = document.querySelector<HTMLElement>('.mx-online-roster')
  if (roster) roster.classList.add('mx-online-roster-scroll')
}

function enhanceGlobalChat() {
  const screen = document.querySelector<HTMLElement>('.mx-online-screen, .mx-lobby-shell')
  if (!screen) return
  const heading = Array.from(screen.querySelectorAll<HTMLElement>('h1,h2,h3,h4,[class*="title" i]')).find((node) =>
    (node.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase() === 'GLOBAL CHAT')
  if (!heading) return

  let panel: HTMLElement | null = heading.parentElement
  for (let depth = 0; panel && panel !== screen && depth < 4; depth += 1) {
    if (panel.querySelector('input,textarea,form')) break
    panel = panel.parentElement
  }
  if (!panel || panel === screen) panel = heading.parentElement
  if (!panel) return
  panel.classList.add('mx-global-chat-fixed')

  const candidates = Array.from(panel.querySelectorAll<HTMLElement>('div,section,ul,ol')).filter((node) => {
    if (node === panel || node.contains(heading) || node.querySelector('input,textarea,form')) return false
    return node.children.length >= 3
  })
  const list = candidates.sort((a, b) => b.children.length - a.children.length)[0]
  if (list) list.classList.add('mx-global-chat-scroll')
}

function fitChallengeHeadline() {
  const screen = document.querySelector<HTMLElement>('.mx-online-screen')
  if (!screen) return
  const candidates = Array.from(screen.querySelectorAll<HTMLElement>('*'))
  for (const element of candidates) {
    const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase()
    if (!/^X FIGHTER [12] IS CHA/.test(text)) continue
    const childAlsoMatches = Array.from(element.children).some((child) => /^X FIGHTER [12] IS CHA/.test((child.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase()))
    if (!childAlsoMatches) element.classList.add('mx-challenge-headline-fit')
  }
}

function ensureFightCounter() {
  const screen = document.querySelector<HTMLElement>('.mx-online-screen.mx-lobby-shell, .mx-lobby-shell')
  if (!screen || screen.querySelector('[data-mx-fights-played]')) return
  const counter = document.createElement('div')
  counter.className = 'mx-fights-played'
  counter.dataset.mxFightsPlayed = 'true'
  counter.setAttribute('aria-label', 'Fights played')
  counter.innerHTML = '<span>FIGHTS PLAYED</span><strong>—</strong>'
  screen.appendChild(counter)
}

async function refreshFightCounter(force = false) {
  ensureFightCounter()
  const counter = document.querySelector<HTMLElement>('[data-mx-fights-played] strong')
  const session = getSavedSession()
  if (!counter || !session || fightCountBusy) return
  const now = Date.now()
  if (!force && now - lastFightCountAt < 30_000) return
  fightCountBusy = true
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_completed_fight_count`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    if (!response.ok) return
    const value = Number(await response.json())
    if (Number.isFinite(value)) {
      counter.textContent = String(value)
      lastFightCountAt = now
    }
  } catch {
    // Counter is informational; lobby remains usable if the request is unavailable.
  } finally {
    fightCountBusy = false
  }
}

function enhanceLobby() {
  removeDeferredLobbyButtons()
  renameLeaderboard()
  enhanceLeaderboard()
  enhanceRoster()
  enhanceGlobalChat()
  fitChallengeHeadline()
  ensureFightCounter()
  void refreshFightCounter()
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const boot = () => {
    enhanceLobby()
    document.addEventListener('pointerdown', closeAudioPanel, true)
    window.addEventListener('focus', () => void refreshFightCounter(true))
    document.addEventListener('visibilitychange', () => { if (!document.hidden) void refreshFightCounter(true) })
    window.setInterval(() => void refreshFightCounter(), 60_000)
    const observer = new MutationObserver(enhanceLobby)
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
}
