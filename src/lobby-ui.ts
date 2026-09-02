const SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://mmtorfzxnidsczcdygbp.supabase.co') as string
const SUPABASE_KEY = ((import.meta as any).env?.VITE_SUPABASE_KEY || 'sb_publishable_EMVTyrv3gGmmouCiVix4dg__W3zuzMc') as string
let fightCountBusy = false
let lastFightCountAt = 0
const chatMessageCounts = new WeakMap<HTMLElement, number>()
const wiredChatLists = new WeakSet<HTMLElement>()

function closeAudioPanel(event?: Event) {
  const root = document.getElementById('mx-audio-controls')
  const panel = root?.querySelector<HTMLElement>('[data-audio-panel]')
  if (!root || !panel || panel.hidden) return
  if (event?.target instanceof Node && root.contains(event.target)) return
  panel.hidden = true
}

function removeGoogleSignIn() {
  const controls = Array.from(document.querySelectorAll<HTMLElement>('button, a, [role="button"]'))
  for (const control of controls) {
    const text = (control.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase()
    const aria = (control.getAttribute('aria-label') ?? '').trim().toUpperCase()
    if (text.includes('GOOGLE') || aria.includes('GOOGLE')) control.remove()
  }
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

function chatIsNearBottom(list: HTMLElement) {
  return list.scrollHeight - list.scrollTop - list.clientHeight <= 32
}

function scrollChatToBottom(list: HTMLElement) {
  list.scrollTop = Math.max(0, list.scrollHeight - list.clientHeight)
}

function wireChatAutoscroll(list: HTMLElement) {
  const messageCount = list.children.length
  const previousCount = chatMessageCounts.get(list)

  if (!wiredChatLists.has(list)) {
    wiredChatLists.add(list)
    list.dataset.mxChatPinned = 'true'
    list.addEventListener('scroll', () => {
      list.dataset.mxChatPinned = String(chatIsNearBottom(list))
    }, { passive: true })
    chatMessageCounts.set(list, messageCount)
    requestAnimationFrame(() => scrollChatToBottom(list))
    return
  }

  chatMessageCounts.set(list, messageCount)
  if (previousCount !== undefined && messageCount > previousCount && list.dataset.mxChatPinned !== 'false') {
    requestAnimationFrame(() => scrollChatToBottom(list))
  }
}

function enhanceGlobalChat() {
  const list = document.querySelector<HTMLElement>('.mx-lobby-right .mx-global-chat-feed')
  if (list) wireChatAutoscroll(list)
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
  if (!counter || fightCountBusy) return
  const now = Date.now()
  if (!force && now - lastFightCountAt < 30_000) return
  fightCountBusy = true
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_completed_fight_count`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
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
  removeGoogleSignIn()
  enhanceLeaderboard()
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
