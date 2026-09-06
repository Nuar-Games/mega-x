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

  const viewportWidth = Math.max(1, window.innerWidth)
  const viewportHeight = Math.max(1, window.innerHeight)
  const scale = Math.min(viewportWidth / WIDTH, viewportHeight / HEIGHT)
  const renderedHeight = HEIGHT * scale
  const availableY = Math.max(0, viewportHeight - renderedHeight)
  const verticalBias = viewportWidth <= 560 ? 0.16 : viewportWidth < 900 ? 0.3 : 0.5
  const top = availableY * verticalBias

  canvas.style.transform = `translateX(-50%) scale(${scale})`
  canvas.style.top = `${top}px`
  shell.style.setProperty('--mx3-fit-scale', `${scale}`)
  shell.style.setProperty('--mx3-free-y', `${availableY}px`)
  shell.dataset.arenaAspect = viewportWidth < viewportHeight ? 'portrait' : 'landscape'
}

function syncDesktopPresentation(shell: HTMLElement) {
  if (window.innerWidth <= 560) return

  const rail = shell.querySelector<HTMLElement>('.mx3-premium-rail')
  if (rail) rail.style.setProperty('display', 'none', 'important')

  const controls = document.getElementById('mx-audio-controls')
  const audioButton = shell.querySelector<HTMLElement>('.mx3-audio')
  if (!controls || !audioButton) return

  const toggle = controls.querySelector<HTMLElement>('[data-audio-toggle]')
  const panel = controls.querySelector<HTMLElement>('[data-audio-panel]')
  const rect = audioButton.getBoundingClientRect()
  const panelWidth = 220
  const panelHeight = 150
  const left = Math.max(8, Math.min(window.innerWidth - panelWidth - 8, rect.right - panelWidth))
  const top = Math.max(8, Math.min(window.innerHeight - panelHeight - 8, rect.bottom + 6))

  controls.style.setProperty('display', 'block', 'important')
  controls.style.setProperty('position', 'fixed', 'important')
  controls.style.setProperty('left', `${left}px`, 'important')
  controls.style.setProperty('right', 'auto', 'important')
  controls.style.setProperty('top', `${top}px`, 'important')
  controls.style.setProperty('z-index', '1500', 'important')
  if (toggle) toggle.style.setProperty('display', 'none', 'important')
  if (panel) panel.style.setProperty('margin-top', '0', 'important')
}

function resetDesktopAudioControls() {
  if (window.innerWidth <= 560) return
  const controls = document.getElementById('mx-audio-controls')
  if (!controls) return
  const toggle = controls.querySelector<HTMLElement>('[data-audio-toggle]')
  const panel = controls.querySelector<HTMLElement>('[data-audio-panel]')

  controls.style.removeProperty('display')
  controls.style.removeProperty('left')
  controls.style.setProperty('right', '10px')
  controls.style.setProperty('top', '10px')
  if (toggle) toggle.style.removeProperty('display')
  if (panel) panel.style.setProperty('margin-top', '6px')
}

function syncResultOutcome(shell: HTMLElement) {
  const localName = shell.querySelector<HTMLElement>('.mx3-fighter.is-local strong')?.textContent?.trim()
  if (!localName) return
  const fighterNames = Array.from(shell.querySelectorAll<HTMLElement>('.mx3-fighter strong')).map((node) => node.textContent?.trim()).filter((value): value is string => Boolean(value))
  const outcomeNodes: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter((node) => node.children.length === 0 && ['MENANG!','KALAH'].includes(node.textContent?.trim().toUpperCase() ?? ''))
  for (const outcome of outcomeNodes) {
    let panel: HTMLElement | null = outcome.parentElement
    while (panel && panel !== document.body && !/PERLAWANAN\s+TAMAT/i.test(panel.textContent ?? '')) panel = panel.parentElement
    if (!panel || panel === document.body) continue

    const storedWinner = panel.dataset.mx3WinnerName?.trim()
    const panelText = panel.textContent ?? ''
    const winnerName = storedWinner || fighterNames.find((name) => panelText.includes(name))
    if (!winnerName) continue
    if (!storedWinner) panel.dataset.mx3WinnerName = winnerName

    const isLoss = winnerName !== localName
    const nextOutcome = isLoss ? 'KALAH' : 'MENANG!'
    if (outcome.textContent !== nextOutcome) outcome.textContent = nextOutcome

    if (isLoss) {
      const identityNodes: HTMLElement[] = Array.from(panel.querySelectorAll<HTMLElement>('*')).filter((node) => node.children.length === 0 && node.textContent?.trim() === winnerName)
      for (const identity of identityNodes) if (identity.textContent !== localName) identity.textContent = localName
    }

    for (const button of Array.from(panel.querySelectorAll<HTMLButtonElement>('button'))) {
      if ((button.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase() === 'RETURN TO LOBBY') button.classList.add('mx3-result-return')
    }

    if (panel.classList.contains('mx3-result-loss') !== isLoss) panel.classList.toggle('mx3-result-loss', isLoss)
    if (panel.classList.contains('mx3-result-win') === isLoss) panel.classList.toggle('mx3-result-win', !isLoss)
  }
}

function mountArena() {
  const shell = document.querySelector<HTMLElement>(SHELL)
  document.body.classList.toggle('mx3-arena-present', Boolean(shell))
  if (!shell) {
    resetDesktopAudioControls()
    return
  }
  shell.classList.remove('mx2-stage')
  shell.classList.add('mx3-stage')
  fitCanvas(shell)
  syncDesktopPresentation(shell)
  refreshFeedback(shell)
  syncResultOutcome(shell)
}

const observer = new MutationObserver(() => mountArena())
observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
window.addEventListener('resize', mountArena, { passive: true })
window.addEventListener('orientationchange', mountArena)
mountArena()