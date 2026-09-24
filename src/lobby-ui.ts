import './practice-mode.css'

const SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://mmtorfzxnidsczcdygbp.supabase.co') as string
const SUPABASE_KEY = ((import.meta as any).env?.VITE_SUPABASE_KEY || 'sb_publishable_fXF7LXgKXeH4p5_Bwai0nQ_d-NWdOk_') as string

type LobbyMetrics = {
  fights_played: number
  registered_fighters: number
  online_now: number
  lobby_visits: number
}

let metricsBusy = false
let lastMetricsAt = 0
let lastVisitAttemptAt = 0
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

function markSignOut() {
  const controls = Array.from(document.querySelectorAll<HTMLElement>('button, a, [role="button"]'))
  for (const control of controls) {
    const text = (control.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase()
    if (text === 'SIGN OUT' || text === 'LOG OUT' || text === 'LOGOUT') {
      control.classList.add('mx-signout-stable')
    }
  }
}

function enhanceLeaderboard() {
  const board = document.querySelector<HTMLElement>('.mx-leaderboard')
  const stack = board?.querySelector<HTMLElement>('.mx-rank-stack')
  if (!board || !stack) return

  board.classList.add('mx-ranks-collapsible-clean')
  stack.removeAttribute('aria-hidden')

  board.querySelectorAll<HTMLElement>('[data-mx-rank-toggle], [data-mx-rank-toggle-v2]').forEach((node) => node.remove())
  board.querySelectorAll<HTMLElement>('[data-mx-rank-scroll-v2]').forEach((node) => node.remove())

  let toggle = board.querySelector<HTMLButtonElement>('[data-mx-rank-toggle-clean]')

  if (!toggle) {
    stack.hidden = true
    board.classList.remove('mx-ranks-expanded-clean')

    toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'mx-rank-toggle mx-rank-toggle-clean'
    toggle.dataset.mxRankToggleClean = 'true'
    toggle.textContent = 'VIEW #4–#20'
    toggle.setAttribute('aria-expanded', 'false')

    toggle.addEventListener('click', () => {
      const expanded = toggle!.getAttribute('aria-expanded') !== 'true'
      stack.hidden = !expanded
      board.classList.toggle('mx-ranks-expanded-clean', expanded)
      toggle!.setAttribute('aria-expanded', String(expanded))
      toggle!.textContent = expanded ? 'HIDE #4–#20' : 'VIEW #4–#20'
      if (expanded) stack.scrollTop = 0
    })

    board.insertBefore(toggle, stack)
  } else {
    const expanded = toggle.getAttribute('aria-expanded') === 'true'
    board.classList.toggle('mx-ranks-expanded-clean', expanded)
    stack.hidden = !expanded
  }
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
    const childAlsoMatches = Array.from(element.children).some((child) =>
      /^X FIGHTER [12] IS CHA/.test((child.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase()),
    )
    if (!childAlsoMatches) element.classList.add('mx-challenge-headline-fit')
  }
}

function getActualLobbyScreen() {
  const board = document.querySelector<HTMLElement>('.mx-leaderboard')
  const chat = document.querySelector<HTMLElement>('.mx-lobby-right .mx-global-chat-feed')
  if (!board || !chat) return null
  return board.closest<HTMLElement>('.mx-online-screen.mx-lobby-shell, .mx-lobby-shell')
}

function directChildFor(screen: HTMLElement, element: HTMLElement | null) {
  if (!element || !screen.contains(element)) return null
  let current: HTMLElement = element
  while (current.parentElement && current.parentElement !== screen) current = current.parentElement
  return current.parentElement === screen ? current : null
}

function metricCard(key: keyof LobbyMetrics, label: string) {
  return `
    <div class="mx-metric-card" data-mx-metric="${key}">
      <span>${label}</span>
      <strong>—</strong>
    </div>
  `
}

function ensurePracticeButton(screen: HTMLElement, banner: HTMLElement | null) {
  if (!banner || screen.querySelector('[data-practice-entry]')) return
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'mx-practice-entry'
  button.dataset.practiceEntry = 'true'
  button.innerHTML = '<b>PRACTICE</b><span>BEGINNER BOT</span>'
  button.addEventListener('click', async () => {
    button.disabled = true
    try {
      const { startPractice } = await import('./practice-mode.ts')
      startPractice()
    } finally {
      button.disabled = false
    }
  })
  banner.style.setProperty('position', 'relative', 'important')
  banner.style.setProperty('margin-bottom', '58px', 'important')
  button.style.setProperty('position', 'absolute', 'important')
  button.style.setProperty('left', '0', 'important')
  button.style.setProperty('top', 'calc(100% + 10px)', 'important')
  button.style.setProperty('width', '100%', 'important')
  button.style.setProperty('margin', '0', 'important')
  button.style.setProperty('min-height', '46px', 'important')
  banner.appendChild(button)
}

function ensureCommercialPanels(screen: HTMLElement) {
  screen.classList.add('mx-commercial-lobby')
  const player = directChildFor(screen, screen.querySelector<HTMLElement>('.mx-lobby-player'))
  const fighters = directChildFor(screen, screen.querySelector<HTMLElement>('.mx-lobby-left'))
  const leaderboard = directChildFor(screen, screen.querySelector<HTMLElement>('.mx-leaderboard'))
  const chat = directChildFor(screen, screen.querySelector<HTMLElement>('.mx-lobby-right'))
  player?.classList.add('mx-area-player')
  fighters?.classList.add('mx-area-fighters')
  leaderboard?.classList.add('mx-area-leaderboard')
  chat?.classList.add('mx-area-chat')
  document.querySelectorAll<HTMLElement>('[data-mx-fights-played]').forEach((node) => node.remove())

  if (!screen.querySelector('[data-mx-metrics]')) {
    const metrics = document.createElement('section')
    metrics.className = 'mx-lobby-metrics'
    metrics.dataset.mxMetrics = 'true'
    metrics.setAttribute('aria-label', 'MEGA-X live activity')
    metrics.innerHTML = [
      metricCard('fights_played', 'FIGHTS PLAYED'),
      metricCard('registered_fighters', 'REGISTERED FIGHTERS'),
      metricCard('online_now', 'ONLINE NOW'),
      metricCard('lobby_visits', 'LOBBY VISITS'),
    ].join('')
    screen.appendChild(metrics)
  }

  if (!screen.querySelector('[data-mx-banner-slot]')) {
    const banner = document.createElement('section')
    banner.className = 'mx-commercial-banner'
    banner.dataset.mxBannerSlot = 'true'
    banner.innerHTML = `
      <span>PARTNER SPACE</span>
      <strong>MEGA-X FEATURED PARTNER</strong>
      <small>Advertisement / sponsor banner reserved</small>
    `
    screen.appendChild(banner)
  }

  ensurePracticeButton(screen, screen.querySelector<HTMLElement>('[data-mx-banner-slot]'))

  if (!screen.querySelector('[data-mx-news]')) {
    const news = document.createElement('section')
    news.className = 'mx-news-panel'
    news.dataset.mxNews = 'true'
    news.innerHTML = `
      <div class="mx-panel-heading">
        <span>MEGA-X</span>
        <strong>NEWS & ANNOUNCEMENTS</strong>
      </div>
      <article class="mx-news-feature">
        <span class="mx-news-kicker">LATEST</span>
        <strong>MEGA X 1.0 — OFFICIALLY LAUNCHED</strong>
        <p>Arena kini dibuka. Selamat datang, X Fighter.</p>
      </article>
    `
    screen.appendChild(news)
  }

  if (!screen.querySelector('[data-mx-sponsor]')) {
    const sponsor = document.createElement('section')
    sponsor.className = 'mx-sponsor-panel'
    sponsor.dataset.mxSponsor = 'true'
    sponsor.innerHTML = `
      <div class="mx-panel-heading">
        <span>FEATURED</span>
        <strong>SPONSOR / PRODUCT</strong>
      </div>
      <div class="mx-sponsor-media" aria-hidden="true">PARTNER SHOWCASE</div>
      <p>Reserved for sponsor campaigns, product placement and event partners.</p>
    `
    screen.appendChild(sponsor)
  }
}

function getVisitorKey() {
  const storageKey = 'mega-x-lobby-visitor-v1'
  try {
    const existing = localStorage.getItem(storageKey)
    if (existing) return existing
    const generated = typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : `mx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(storageKey, generated)
    return generated
  } catch {
    return `mx-session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  }
}

async function recordLobbyVisit() {
  if (!getActualLobbyScreen()) return
  const now = Date.now()
  if (now - lastVisitAttemptAt < 60_000) return
  lastVisitAttemptAt = now
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_lobby_visit`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_visitor_key: getVisitorKey() }),
    })
  } catch {}
}

function setMetricValue(key: keyof LobbyMetrics, value: number) {
  const target = document.querySelector<HTMLElement>(`[data-mx-metric="${key}"] strong`)
  if (target && Number.isFinite(value)) target.textContent = value.toLocaleString()
}

async function refreshLobbyMetrics(force = false) {
  const screen = getActualLobbyScreen()
  if (!screen || metricsBusy) return
  ensureCommercialPanels(screen)
  const now = Date.now()
  if (!force && now - lastMetricsAt < 30_000) return
  metricsBusy = true
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_lobby_metrics`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (!response.ok) return
    const payload = await response.json()
    const row = (Array.isArray(payload) ? payload[0] : payload) as Partial<LobbyMetrics> | undefined
    if (!row) return
    const metrics: LobbyMetrics = {
      fights_played: Number(row.fights_played),
      registered_fighters: Number(row.registered_fighters),
      online_now: Number(row.online_now),
      lobby_visits: Number(row.lobby_visits),
    }
    setMetricValue('fights_played', metrics.fights_played)
    setMetricValue('registered_fighters', metrics.registered_fighters)
    setMetricValue('online_now', metrics.online_now)
    setMetricValue('lobby_visits', metrics.lobby_visits)
    lastMetricsAt = now
  } catch {} finally { metricsBusy = false }
}

function enhanceLobby() {
  removeGoogleSignIn()
  markSignOut()
  enhanceLeaderboard()
  enhanceGlobalChat()
  fitChallengeHeadline()
  const screen = getActualLobbyScreen()
  if (!screen) return
  ensureCommercialPanels(screen)
  void recordLobbyVisit()
  void refreshLobbyMetrics()
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const boot = () => {
    enhanceLobby()
    document.addEventListener('pointerdown', closeAudioPanel, true)
    window.addEventListener('focus', () => { void recordLobbyVisit(); void refreshLobbyMetrics(true) })
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) { void recordLobbyVisit(); void refreshLobbyMetrics(true) }
    })
    window.setInterval(() => { void recordLobbyVisit(); void refreshLobbyMetrics() }, 60_000)
    const observer = new MutationObserver(enhanceLobby)
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
}

function mxEnsureTop20RankSlots() {
  const stack = document.querySelector<HTMLElement>('.mx-leaderboard .mx-rank-stack')
  if (!stack) return
  const existing = new Set<number>()
  Array.from(stack.children).forEach((node) => {
    const match = (node.textContent ?? '').match(/#\s*(\d+)/)
    if (match) existing.add(Number(match[1]))
  })
  for (let place = 4; place <= 20; place += 1) {
    if (existing.has(place)) continue
    const row = document.createElement('div')
    row.className = 'mx-rank-card mx-rank-empty-slot'
    row.dataset.mxRankSlot = String(place)
    row.innerHTML = `<b>#${place}</b><strong>—</strong><span>NO RANKED FIGHTER</span>`
    stack.appendChild(row)
  }
  const rows = Array.from(stack.children) as HTMLElement[]
  const rankOf = (el: HTMLElement) => {
    const match = (el.textContent ?? '').match(/#\s*(\d+)/)
    return match ? Number(match[1]) : 999
  }
  const sortedRows = [...rows].sort((a, b) => rankOf(a) - rankOf(b))
  const alreadySorted = rows.length === sortedRows.length && rows.every((row, index) => row === sortedRows[index])
  if (!alreadySorted) sortedRows.forEach((row) => stack.appendChild(row))
}

function mxBootTop20RankSlots() {
  mxEnsureTop20RankSlots()
  const observer = new MutationObserver(() => mxEnsureTop20RankSlots())
  observer.observe(document.body, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mxBootTop20RankSlots, { once: true })
} else {
  mxBootTop20RankSlots()
}
