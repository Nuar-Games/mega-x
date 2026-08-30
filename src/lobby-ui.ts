function closeAudioPanel(event?: Event) {
  const root = document.getElementById('mx-audio-controls')
  const panel = root?.querySelector<HTMLElement>('[data-audio-panel]')
  if (!root || !panel || panel.hidden) return
  if (event?.target instanceof Node && root.contains(event.target)) return
  panel.hidden = true
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

function enhanceLobby() {
  enhanceLeaderboard()
  enhanceRoster()
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const boot = () => {
    enhanceLobby()
    document.addEventListener('pointerdown', closeAudioPanel, true)
    const observer = new MutationObserver(enhanceLobby)
    observer.observe(document.documentElement, { childList: true, subtree: true })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
}
