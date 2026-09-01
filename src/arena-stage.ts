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

function syncResultOutcome(shell: HTMLElement) {
  const localName = shell.querySelector<HTMLElement>('.mx3-fighter.is-local strong')?.textContent?.trim()
  if (!localName) return
  const fighterNames = Array.from(shell.querySelectorAll<HTMLElement>('.mx3-fighter strong')).map((node) => node.textContent?.trim()).filter((value): value is string => Boolean(value))
  const outcomeNodes = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter((node) => node.children.length === 0 && ['MENANG!','KALAH'].includes(node.textContent?.trim().toUpperCase() ?? ''))
  for (const outcome of outcomeNodes) {
    let panel: HTMLElement | null = outcome.parentElement
    while (panel && panel !== document.body && !/PERLAWANAN\s+TAMAT/i.test(panel.textContent ?? '')) panel = panel.parentElement
    if (!panel || panel === document.body) continue
    const panelText = panel.textContent ?? ''
    const winnerName = fighterNames.find((name) => panelText.includes(name))
    if (!winnerName) continue
    const nextOutcome = winnerName === localName ? 'MENANG!' : 'KALAH'
    if (outcome.textContent !== nextOutcome) outcome.textContent = nextOutcome
    const isLoss = winnerName !== localName
    if (panel.classList.contains('mx3-result-loss') !== isLoss) panel.classList.toggle('mx3-result-loss', isLoss)
    if (panel.classList.contains('mx3-result-win') === isLoss) panel.classList.toggle('mx3-result-win', !isLoss)
  }
}

function mountArena() {
  const shell = document.querySelector<HTMLElement>(SHELL)
  document.body.classList.toggle('mx3-arena-present', Boolean(shell))
  if (!shell) return
  shell.classList.remove('mx2-stage')
  shell.classList.add('mx3-stage')
  fitCanvas(shell)
  refreshFeedback(shell)
  syncResultOutcome(shell)
}

const observer = new MutationObserver(() => mountArena())
observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
window.addEventListener('resize', mountArena, { passive: true })
window.addEventListener('orientationchange', mountArena)
mountArena()
