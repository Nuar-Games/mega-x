const SHELL = '.duel-shell'
const WIDTH = 780
const HEIGHT = 1110
const previousScores = new WeakMap<Element, string>()
const previousDeckCounts = new WeakMap<Element, string>()

function pulse(target: Element, className: string, duration = 560) {
  target.classList.remove(className)
  void (target as HTMLElement).offsetWidth
  target.classList.add(className)
  window.setTimeout(() => target.classList.remove(className), duration)
}

function refreshFeedback(shell: HTMLElement) {
  shell.querySelectorAll<HTMLElement>('.mx3-big-counter').forEach((counter) => {
    const score = counter.textContent?.trim() ?? ''
    if (!score) return
    const previous = previousScores.get(counter)
    if (previous !== undefined && previous !== score) pulse(counter, 'mx3-score-changed', 620)
    previousScores.set(counter, score)
  })
  const deck = shell.querySelector<HTMLElement>('.mx3-master-counter')
  if (deck) {
    const count = deck.textContent?.trim() ?? ''
    if (count) {
      const previous = previousDeckCounts.get(deck)
      if (previous !== undefined && previous !== count) pulse(deck, 'mx3-deck-changed', 480)
      previousDeckCounts.set(deck, count)
    }
  }
}

function fitCanvas(shell: HTMLElement) {
  const canvas = shell.querySelector<HTMLElement>('.mx3-canvas')
  if (!canvas) return
  const scale = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT)
  canvas.style.transform = `translateX(-50%) scale(${scale})`
}

function mountArena() {
  const shell = document.querySelector<HTMLElement>(SHELL)
  document.body.classList.toggle('mx3-arena-present', Boolean(shell))
  if (!shell) return
  shell.classList.remove('mx2-stage')
  shell.classList.add('mx3-stage')
  fitCanvas(shell)
  refreshFeedback(shell)
}

const observer = new MutationObserver(() => mountArena())
observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
window.addEventListener('resize', mountArena, { passive: true })
window.addEventListener('orientationchange', mountArena)
mountArena()
