import { CARD_INFO } from './arena-card-info'

const SHELL = '.duel-shell'
const CARD_SRC = /\/cards\/(?:game|inspect)\/(\d{2})\.webp(?:$|[?#])/

function cardIdFrom(target: Element): number | null {
  const img = target.matches('img') ? target as HTMLImageElement : target.querySelector('img')
  const src = img?.getAttribute('src') ?? ''
  const match = src.match(CARD_SRC)
  return match ? Number(match[1]) : null
}

function ensureInspector(shell: HTMLElement): HTMLElement {
  let panel = shell.querySelector<HTMLElement>('#mx-card-inspector')
  if (panel) return panel
  panel = document.createElement('aside')
  panel.id = 'mx-card-inspector'
  panel.className = 'mx-card-inspector'
  panel.setAttribute('aria-live', 'polite')
  panel.innerHTML = `<button type="button" class="mx-card-inspector__close" aria-label="Tutup">×</button><div class="mx-card-inspector__name"></div><div class="mx-card-inspector__stats"></div><div class="mx-card-inspector__effect"></div>`
  panel.querySelector<HTMLButtonElement>('.mx-card-inspector__close')?.addEventListener('click', () => panel?.classList.remove('is-open'))
  shell.appendChild(panel)
  return panel
}

function positionInspector(shell: HTMLElement, panel: HTMLElement, target: Element) {
  const shellRect = shell.getBoundingClientRect()
  const cardRect = target.getBoundingClientRect()
  const centerX = cardRect.left + cardRect.width / 2 - shellRect.left
  const isHand = !!target.closest('.hand-area,.player-hand,.hand-scroll,.hand-fan')
  const left = Math.min(Math.max(12, shellRect.width - 276), Math.max(12, centerX - 132))
  panel.style.left = `${left}px`
  panel.style.right = 'auto'
  if (isHand) {
    panel.style.top = 'auto'
    panel.style.bottom = 'calc(var(--mx-stage-hand-h) + 10px)'
    return
  }
  const below = cardRect.bottom - shellRect.top + 8
  if (shellRect.height - below > 180) {
    panel.style.top = `${below}px`
    panel.style.bottom = 'auto'
  } else {
    panel.style.top = 'auto'
    panel.style.bottom = 'calc(var(--mx-stage-hand-h) + 10px)'
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
  positionInspector(shell, panel, target)
  panel.classList.add('is-open')
}

function markFieldSides(shell: HTMLElement) {
  const fields = [...shell.querySelectorAll<HTMLElement>('.fighter-field')]
  fields.forEach((field, index) => {
    field.classList.toggle('mx-field-left', index === 0)
    field.classList.toggle('mx-field-right', index === fields.length - 1 && fields.length > 1)
  })
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
    const existingText = [...zone.querySelectorAll<HTMLElement>('span,b,strong')].map(node => node === badge ? '' : node.textContent ?? '').join(' ')
    const numeric = existingText.match(/\b(\d+)\b/)
    badge.textContent = numeric?.[1] ?? String(faceCards)
  })
}

function markPhase(shell: HTMLElement) {
  const text = [...shell.querySelectorAll<HTMLElement>('h1,h2,h3,h4,[role="status"],.prompt,.callout')].map(node => node.textContent?.trim() ?? '').join(' | ').toUpperCase()
  shell.classList.toggle('mx-phase-vs', text.includes('PILIH KAD VS'))
  shell.classList.toggle('mx-phase-effect', text.includes('PILIH KAD EFFECT'))
  shell.classList.toggle('mx-phase-select', text.includes('PILIH KAD UNTUK DIBUANG') || text.includes('PILIH SASARAN'))
  shell.classList.toggle('mx-phase-attack', text.includes('ATK ATAU PASS') || text.includes('SERANG ATAU PASS'))
}

function mountArena() {
  const shell = document.querySelector<HTMLElement>(SHELL)
  document.body.classList.toggle('mx-arena-present', !!shell)
  if (!shell) return
  shell.classList.add('mx-portrait-stage')
  markFieldSides(shell)
  refreshZoneCounters(shell)
  markPhase(shell)
  ensureInspector(shell)
}

document.addEventListener('click', event => {
  const raw = event.target
  if (!(raw instanceof Element)) return
  const shell = raw.closest<HTMLElement>(SHELL)
  if (!shell || raw.closest('#mx-card-inspector')) return
  const card = raw.closest('.digital-card,.zone-card-button,.vs-inspect-button,.hand-card-wrap')
  if (card) openCardInspector(shell, card)
})

const observer = new MutationObserver(() => mountArena())
observer.observe(document.documentElement, { childList: true, subtree: true })
mountArena()
