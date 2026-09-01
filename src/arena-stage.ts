const SHELL = '.duel-shell'
const previousScores = new WeakMap<Element, string>()
const previousDeckCounts = new WeakMap<Element, string>()

function pulse(target: Element, className: string, duration = 560) {
  target.classList.remove(className)
  void (target as HTMLElement).offsetWidth
  target.classList.add(className)
  window.setTimeout(() => target.classList.remove(className), duration)
}

function refreshFeedback(shell: HTMLElement) {
  shell.querySelectorAll<HTMLElement>('.mx2-x-zone').forEach((zone) => {
    const score = zone.querySelector<HTMLElement>('.mx2-score-core')?.textContent?.trim() ?? ''
    if (!score) return
    const previous = previousScores.get(zone)
    if (previous !== undefined && previous !== score) pulse(zone, 'mx2-score-changed', 620)
    previousScores.set(zone, score)
  })

  const deck = shell.querySelector<HTMLElement>('[data-motion-anchor="master"]')
  if (deck) {
    const count = deck.querySelector<HTMLElement>('.mx2-deck-core strong')?.textContent?.trim() ?? ''
    if (count) {
      const previous = previousDeckCounts.get(deck)
      if (previous !== undefined && previous !== count) pulse(deck, 'mx2-deck-changed', 480)
      previousDeckCounts.set(deck, count)
    }
  }
}

function mountArena() {
  const shell = document.querySelector<HTMLElement>(SHELL)
  document.body.classList.toggle('mx2-arena-present', Boolean(shell))
  if (!shell) return
  shell.classList.add('mx2-stage')
  refreshFeedback(shell)
}

const observer = new MutationObserver(() => mountArena())
observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
mountArena()
