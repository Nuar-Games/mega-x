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

function enforceMobileDiscardVisibility() {
  if (window.innerWidth > 560) return
  const panel = document.querySelector<HTMLElement>('.choice-overlay .discard-panel')
  if (!panel) return
  const grid = panel.querySelector<HTMLElement>('.discard-card-grid')
  if (!grid) return

  grid.style.setProperty('display', 'grid', 'important')
  grid.style.setProperty('grid-template-columns', 'repeat(3,minmax(0,1fr))', 'important')
  grid.style.setProperty('gap', '8px', 'important')
  grid.style.setProperty('width', '100%', 'important')
  grid.style.setProperty('min-height', '0', 'important')
  grid.style.setProperty('overflow-x', 'hidden', 'important')
  grid.style.setProperty('overflow-y', 'auto', 'important')
  grid.style.setProperty('align-content', 'start', 'important')
  grid.style.setProperty('align-items', 'start', 'important')

  grid.querySelectorAll<HTMLElement>('.discard-card-choice').forEach((button) => {
    button.style.setProperty('position', 'relative', 'important')
    button.style.setProperty('display', 'block', 'important')
    button.style.setProperty('width', '100%', 'important')
    button.style.setProperty('min-width', '0', 'important')
    button.style.setProperty('max-width', 'none', 'important')
    button.style.setProperty('height', 'auto', 'important')
    button.style.setProperty('min-height', '0', 'important')
    button.style.setProperty('aspect-ratio', '420 / 595', 'important')
    button.style.setProperty('padding', '0', 'important')
    button.style.setProperty('margin', '0', 'important')
    button.style.setProperty('overflow', 'hidden', 'important')
    button.style.setProperty('opacity', '1', 'important')
    button.style.setProperty('visibility', 'visible', 'important')
    button.style.setProperty('transform', button.classList.contains('is-selected') ? 'translateY(-2px)' : 'none', 'important')
  })

  grid.querySelectorAll<HTMLImageElement>('.discard-card-choice img').forEach((image) => {
    image.style.setProperty('position', 'absolute', 'important')
    image.style.setProperty('inset', '0', 'important')
    image.style.setProperty('display', 'block', 'important')
    image.style.setProperty('width', '100%', 'important')
    image.style.setProperty('height', '100%', 'important')
    image.style.setProperty('min-width', '0', 'important')
    image.style.setProperty('min-height', '0', 'important')
    image.style.setProperty('max-width', 'none', 'important')
    image.style.setProperty('max-height', 'none', 'important')
    image.style.setProperty('object-fit', 'contain', 'important')
    image.style.setProperty('opacity', '1', 'important')
    image.style.setProperty('visibility', 'visible', 'important')
    image.style.setProperty('filter', 'none', 'important')
    image.style.setProperty('transform', 'none', 'important')
    image.style.setProperty('clip-path', 'none', 'important')
    image.style.setProperty('z-index', '2', 'important')
  })

  grid.querySelectorAll<HTMLElement>('.discard-check').forEach((check) => {
    check.style.setProperty('position', 'absolute', 'important')
    check.style.setProperty('left', '4px', 'important')
    check.style.setProperty('right', '4px', 'important')
    check.style.setProperty('bottom', '4px', 'important')
    check.style.setProperty('z-index', '3', 'important')
    check.style.setProperty('visibility', 'visible', 'important')
    check.style.setProperty('opacity', '1', 'important')
  })
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
  enforceMobileDiscardVisibility()
  syncDesktopPresentation(shell)
  refreshFeedback(shell)
  syncResultOutcome(shell)
}

const observer = new MutationObserver(() => mountArena())
observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
window.addEventListener('resize', mountArena, { passive: true })
window.addEventListener('orientationchange', mountArena)
mountArena()