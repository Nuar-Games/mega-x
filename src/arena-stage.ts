import { CARD_INFO } from './arena-card-info'

const SHELL = '.duel-shell'
const CARD_SRC = /\/cards\/(?:game|inspect)\/(\d{2})\.webp(?:$|[?#])/
const previousScores = new WeakMap<Element, number>()
const previousDeckCounts = new WeakMap<Element, number>()
let inspectedHandAction: HTMLElement | null = null
let inspectedHandWrap: HTMLElement | null = null
let bypassHandIntercept = false

function cardIdFrom(target: Element): number | null {
  const img = target.matches('img') ? target as HTMLImageElement : target.querySelector('img')
  const src = img?.getAttribute('src') ?? ''
  const match = src.match(CARD_SRC)
  return match ? Number(match[1]) : null
}

function phaseText(shell: HTMLElement): string {
  return Array.from(shell.querySelectorAll<HTMLElement>('h1,h2,h3,h4,[role="status"],.prompt,.callout,.mx-discard-confirm-head'))
    .map(node => node.textContent?.trim() ?? '')
    .join(' | ')
    .toUpperCase()
}

function currentPlayLabel(shell: HTMLElement): string | null {
  const text = phaseText(shell)
  if (text.includes('PILIH KAD VS')) return 'PLAY AS VS'
  if (text.includes('PILIH KAD EFFECT')) return 'PLAY EFFECT'
  if (text.includes('PILIH KAD UNTUK DIBUANG')) return 'SELECT'
  return null
}

function clearHandSelection() {
  inspectedHandWrap?.classList.remove('is-selected')
  inspectedHandAction = null
  inspectedHandWrap = null
}

function closeInspector(panel: HTMLElement) {
  panel.classList.remove('is-open')
  clearHandSelection()
}

function ensureInspector(shell: HTMLElement): HTMLElement {
  let panel = shell.querySelector<HTMLElement>('#mx-card-inspector')
  if (panel) return panel
  panel = document.createElement('aside')
  panel.id = 'mx-card-inspector'
  panel.className = 'mx-card-inspector'
  panel.setAttribute('aria-live', 'polite')
  panel.innerHTML = `<button type="button" class="mx-card-inspector__close" aria-label="Tutup">×</button><div class="mx-card-inspector__name"></div><div class="mx-card-inspector__stats"></div><div class="mx-card-inspector__effect"></div><div class="mx-card-inspector__actions"><button type="button" data-mx-play hidden>PLAY</button><button type="button" data-mx-cancel>CANCEL</button></div>`
  panel.querySelector<HTMLButtonElement>('.mx-card-inspector__close')?.addEventListener('click', () => closeInspector(panel!))
  panel.querySelector<HTMLButtonElement>('[data-mx-cancel]')?.addEventListener('click', () => closeInspector(panel!))
  panel.querySelector<HTMLButtonElement>('[data-mx-play]')?.addEventListener('click', () => {
    if (!inspectedHandAction) return
    const action = inspectedHandAction
    shell.classList.remove('mx-play-confirm')
    void shell.offsetWidth
    shell.classList.add('mx-play-confirm')
    window.setTimeout(() => shell.classList.remove('mx-play-confirm'), 360)
    closeInspector(panel!)
    bypassHandIntercept = true
    try { action.click() } finally { bypassHandIntercept = false }
  })
  shell.appendChild(panel)
  return panel
}

function positionInspector(shell: HTMLElement, panel: HTMLElement, target: Element) {
  const shellRect = shell.getBoundingClientRect()
  const cardRect = target.getBoundingClientRect()
  const centerX = cardRect.left + cardRect.width / 2 - shellRect.left
  const isHand = !!target.closest('.hand-area,.player-hand,.hand-scroll,.hand-fan')
  const panelWidth = Math.min(280, shellRect.width * .44)
  const left = Math.min(Math.max(shellRect.width * .02, shellRect.width - panelWidth - shellRect.width * .02), Math.max(shellRect.width * .02, centerX - panelWidth / 2))
  panel.style.left = `${left}px`
  panel.style.right = 'auto'
  if (isHand) {
    panel.style.top = 'auto'
    panel.style.bottom = '18.5%'
    return
  }
  const below = cardRect.bottom - shellRect.top + 8
  if (shellRect.height - below > shellRect.height * .18) {
    panel.style.top = `${below}px`
    panel.style.bottom = 'auto'
  } else {
    panel.style.top = 'auto'
    panel.style.bottom = '18.5%'
  }
}

function openCardInspector(shell: HTMLElement, target: Element) {
  const id = cardIdFrom(target)
  if (!id || !CARD_INFO[id]) return
  const card = CARD_INFO[id]
  const panel = ensureInspector(shell)
  panel.querySelector<HTMLElement>('.mx-card-inspector__name')!.textContent = card.name
  panel.querySelector<HTMLElement>('.mx-card-inspector__stats')!.textContent = `★${card.stars}   ATK ${card.atk}   DEF ${card.def}   STA ${card.sta}`
  panel.querySelector<HTMLElement>('.mx-card-inspector__effect')!.textContent = card.effect

  const handWrap = target.closest<HTMLElement>('.hand-card-wrap')
  const play = panel.querySelector<HTMLButtonElement>('[data-mx-play]')!
  clearHandSelection()
  if (handWrap && !target.closest('.mx-discard-confirm-sheet')) {
    const clickable = handWrap.matches('button') ? handWrap : handWrap.querySelector<HTMLElement>('button') ?? handWrap
    const label = currentPlayLabel(shell)
    inspectedHandWrap = handWrap
    inspectedHandAction = clickable
    handWrap.classList.add('is-selected')
    play.hidden = !label
    play.textContent = label ?? 'PLAY'
  } else {
    play.hidden = true
  }

  positionInspector(shell, panel, target)
  panel.classList.add('is-open')
}

function markFieldSides(shell: HTMLElement) {
  const fields = Array.from(shell.querySelectorAll<HTMLElement>('.fighter-field'))
  fields.forEach((field, index) => {
    field.classList.toggle('mx-field-left', index === 0)
    field.classList.toggle('mx-field-right', index === fields.length - 1 && fields.length > 1)
  })
}

function pulseClass(target: Element, className: string, duration = 520) {
  target.classList.remove(className)
  void (target as HTMLElement).offsetWidth
  target.classList.add(className)
  window.setTimeout(() => target.classList.remove(className), duration)
}

function refreshZoneCounters(shell: HTMLElement) {
  shell.querySelectorAll<HTMLElement>('.p1-x,.p2-x').forEach(zone => {
    let badge = zone.querySelector<HTMLElement>('.mx-zone-x-count')
    if (!badge) {
      badge = document.createElement('strong')
      badge.className = 'mx-zone-x-count'
      badge.setAttribute('aria-label', 'Skor Zon X')
      zone.appendChild(badge)
    }
    const faceCards = zone.querySelectorAll('.digital-card').length
    const existingText = Array.from(zone.querySelectorAll<HTMLElement>('span,b,strong')).map(node => node === badge ? '' : node.textContent ?? '').join(' ')
    const numeric = existingText.match(/\b(\d+)\b/)
    const score = Number(numeric?.[1] ?? faceCards)
    const previous = previousScores.get(zone)
    badge.textContent = String(score)
    if (previous !== undefined && previous !== score) pulseClass(zone, 'mx-score-changed', 620)
    previousScores.set(zone, score)
  })
}

function refreshDeckFeedback(shell: HTMLElement) {
  const deck = shell.querySelector<HTMLElement>('[data-motion-anchor="master"]')
  if (!deck) return
  const numbers = (deck.textContent ?? '').match(/\d+/g)
  const count = numbers?.length ? Number(numbers[numbers.length - 1]) : NaN
  if (!Number.isFinite(count)) return
  const previous = previousDeckCounts.get(deck)
  if (previous !== undefined && previous !== count) pulseClass(deck, 'mx-deck-changed', 480)
  previousDeckCounts.set(deck, count)
}

function markPhase(shell: HTMLElement) {
  const text = phaseText(shell)
  const isVs = text.includes('PILIH KAD VS')
  const isEffect = text.includes('PILIH KAD EFFECT')
  const isTarget = text.includes('PILIH SASARAN') || text.includes('PILIH TARGET') || text.includes('SASARAN YANG SAH')
  const isSelect = text.includes('PILIH KAD UNTUK DIBUANG') || isTarget
  const isAttack = text.includes('ATK ATAU PASS') || text.includes('SERANG ATAU PASS')
  const isOpponent = text.includes('OPPONENT TURN') || text.includes('GILIRAN LAWAN')
  shell.classList.toggle('mx-phase-vs', isVs)
  shell.classList.toggle('mx-phase-effect', isEffect)
  shell.classList.toggle('mx-phase-target', isTarget)
  shell.classList.toggle('mx-phase-select', isSelect)
  shell.classList.toggle('mx-phase-attack', isAttack)
  shell.classList.toggle('mx-phase-opponent', isOpponent)
}

function mountArena() {
  const shell = document.querySelector<HTMLElement>(SHELL)
  document.body.classList.toggle('mx-arena-present', !!shell)
  if (!shell) return
  shell.classList.add('mx-portrait-stage')
  markFieldSides(shell)
  refreshZoneCounters(shell)
  refreshDeckFeedback(shell)
  markPhase(shell)
  ensureInspector(shell)
}

// Hand tap means inspect/select first. PLAY in the overlay invokes the original React handler.
document.addEventListener('click', event => {
  if (bypassHandIntercept) return
  const raw = event.target
  if (!(raw instanceof Element)) return
  const shell = raw.closest<HTMLElement>(SHELL)
  if (!shell || raw.closest('#mx-card-inspector') || raw.closest('.mx-discard-confirm-sheet')) return
  const handCard = raw.closest<HTMLElement>('.hand-card-wrap')
  if (!handCard) return
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  openCardInspector(shell, handCard)
}, true)

// Field cards remain directly actionable for target selection, but also readable when no handler consumes them.
document.addEventListener('click', event => {
  const raw = event.target
  if (!(raw instanceof Element)) return
  const shell = raw.closest<HTMLElement>(SHELL)
  if (!shell || raw.closest('#mx-card-inspector') || raw.closest('.hand-card-wrap')) return
  const card = raw.closest('.digital-card,.zone-card-button,.vs-inspect-button')
  if (card) openCardInspector(shell, card)
})

const observer = new MutationObserver(() => mountArena())
observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
mountArena()
