const AUDIO_REQUEST = 'mega-x:audio-toggle-request'
const FEEDBACK_EVENT = 'mega-x:arena-feedback'

let toastTimer: number | null = null
let audioUiSyncQueued = false
let arenaCommunicationQueued = false

function arenaVisible() {
  return Boolean(document.querySelector('.duel-shell.mx3-stage, .mx3-canvas'))
}

function ensureToast() {
  let toast = document.querySelector<HTMLElement>('.mx3-arena-toast')
  if (toast) return toast
  toast = document.createElement('div')
  toast.className = 'mx3-arena-toast'
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')
  document.body.appendChild(toast)
  return toast
}

function showArenaFeedback(message: string) {
  if (!arenaVisible() || !message) return
  const toast = ensureToast()
  toast.textContent = message
  toast.classList.add('is-visible')
  if (toastTimer !== null) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.classList.remove('is-visible')
    toastTimer = null
  }, 2400)
}

function syncArenaAudioButton() {
  const mute = document.querySelector<HTMLButtonElement>('#mx-audio-controls [data-audio-mute]')
  const arena = document.querySelector<HTMLButtonElement>('.mx3-audio')
  if (!arena) return false
  if (arena.textContent !== 'AUDIO') arena.textContent = 'AUDIO'
  const muted = (mute?.textContent ?? '').trim().toUpperCase() === 'UNMUTE'
  if (arena.classList.contains('is-muted') !== muted) arena.classList.toggle('is-muted', muted)
  if (arena.getAttribute('aria-label') !== 'Buka tetapan audio') arena.setAttribute('aria-label', 'Buka tetapan audio')
  return true
}

function queueArenaAudioButtonSync() {
  if (audioUiSyncQueued) return
  audioUiSyncQueued = true
  window.requestAnimationFrame(() => {
    audioUiSyncQueued = false
    if (arenaVisible()) syncArenaAudioButton()
  })
}

function compactText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function canonicalAction(value: string) {
  const text = compactText(value).toUpperCase()
  if (text.includes('PILIH KAD VS')) return 'PILIH KAD VS'
  if (text.includes('PILIH SASARAN')) return 'PILIH SASARAN'
  if (text.includes('PILIH POSISI') || text.includes('ATK ATAU DEF')) return 'PILIH POSISI'
  if (text.includes('SERANG')) return 'SERANG'
  if (text.includes('EFFECT')) return 'EFFECT'
  return ''
}

function isViewportSelectionTitle(value: string) {
  const text = compactText(value).toUpperCase()
  return text === 'PILIH SASARAN' || text === 'PILIH KAD UNTUK DIBUANG'
}

function phaseAction(canvas: HTMLElement | null) {
  if (!canvas) return ''
  if (canvas.classList.contains('phase-set_vs')) return 'PILIH KAD VS'
  if (canvas.classList.contains('phase-effect')) return 'EFFECT'
  if (canvas.classList.contains('phase-attack')) return 'SERANG'
  return ''
}

function opponentAction(action: string) {
  if (action === 'PILIH KAD VS') return 'SEDANG MEMILIH KAD VS...'
  if (action === 'PILIH SASARAN') return 'SEDANG MEMILIH SASARAN...'
  if (action === 'PILIH POSISI') return 'SEDANG MEMILIH POSISI...'
  if (action === 'SERANG') return 'SEDANG MENENTUKAN SERANGAN...'
  if (action === 'EFFECT') return 'SEDANG MEMAINKAN EFFECT...'
  return 'SEDANG BERMAIN...'
}

function detectLocalTurn(shell: HTMLElement, prompt: HTMLElement | null) {
  const local = shell.querySelector<HTMLElement>('.mx3-fighter.is-local')
  const active = shell.querySelector<HTMLElement>('.mx3-fighter.is-active')
  if (local && active) return active === local

  const opponentHand = shell.querySelector<HTMLElement>('.mx3-opponent-hand')
  if (opponentHand?.classList.contains('is-live')) return false

  if (prompt) {
    const actionable = prompt.querySelector<HTMLButtonElement>('button:not(:disabled)')
    if (actionable) return true
  }
  return null
}

function ensureTurnCommunication(canvas: HTMLElement) {
  let strip = canvas.querySelector<HTMLElement>('.mx3-turn-communication')
  if (strip) return strip
  strip = document.createElement('div')
  strip.className = 'mx3-turn-communication'
  strip.setAttribute('role', 'status')
  strip.setAttribute('aria-live', 'polite')
  strip.innerHTML = '<strong></strong><span></span>'
  canvas.appendChild(strip)
  return strip
}

function discardButtonSelected(button: HTMLButtonElement) {
  const text = compactText(button.textContent ?? '').toUpperCase()
  return button.classList.contains('is-selected') ||
    button.classList.contains('selected') ||
    button.getAttribute('aria-pressed') === 'true' ||
    button.dataset.selected === 'true' ||
    text.includes('DIPILIH')
}

function tagDiscardSelection(panel: HTMLElement, title: HTMLElement) {
  panel.classList.add('mx3-discard-selection-panel')
  panel.parentElement?.classList.add('mx3-discard-selection-overlay')

  const panelText = compactText(panel.textContent ?? '')
  const requiredMatch = panelText.match(/PILIH TEPAT\s+(\d+)\s+KAD/i)
  const required = Math.max(1, Number(requiredMatch?.[1] ?? 2))
  const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>('button'))
  const pickButtons = buttons.filter((button) => /^(PILIH|DIPILIH|✓\s*DIPILIH)$/i.test(compactText(button.textContent ?? '')))
  const cardButtons = buttons.filter((button) => Boolean(button.querySelector('img')))
  const items: HTMLElement[] = []

  if (pickButtons.length) {
    for (const pickButton of pickButtons) {
      pickButton.classList.add('mx3-discard-pick-button')
      let item: HTMLElement | null = pickButton.parentElement
      while (item && item !== panel && !item.querySelector('img')) item = item.parentElement
      if (!item || item === panel) continue
      item.classList.add('mx3-discard-choice-item')
      item.classList.toggle('is-selected', discardButtonSelected(pickButton))
      items.push(item)
    }
  } else {
    for (const cardButton of cardButtons) {
      cardButton.classList.add('mx3-discard-choice-item')
      cardButton.classList.toggle('is-selected', discardButtonSelected(cardButton))
      items.push(cardButton)
    }
  }

  const uniqueItems = Array.from(new Set(items))
  const itemParents = Array.from(new Set(uniqueItems.map((item) => item.parentElement).filter((parent): parent is HTMLElement => Boolean(parent))))
  if (itemParents.length === 1 && itemParents[0] !== panel) itemParents[0].classList.add('mx3-discard-selection-grid')

  const actionButtons = buttons.filter((button) => {
    const text = compactText(button.textContent ?? '').toUpperCase()
    return text.includes('SAHKAN BUANG') || text === 'BATAL' || /^BUANG\s+\d+\s+KAD$/.test(text)
  })
  const actionParents = Array.from(new Set(actionButtons.map((button) => button.parentElement).filter((parent): parent is HTMLElement => Boolean(parent))))
  if (actionParents.length === 1 && actionParents[0] !== panel) actionParents[0].classList.add('mx3-discard-selection-footer')
  actionButtons.forEach((button) => button.classList.add('mx3-discard-action-button'))

  const selected = Math.min(required, uniqueItems.filter((item) => item.classList.contains('is-selected')).length)
  title.dataset.mx3DiscardSummary = `Pilih tepat ${required} kad · ${selected}/${required} dipilih`
  panel.dataset.mx3DiscardRequired = String(required)
  panel.dataset.mx3DiscardSelected = String(selected)
}

function tagTargetSelection() {
  const titles = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter((node) => {
    if (!isViewportSelectionTitle(node.textContent ?? '')) return false
    return !Array.from(node.children).some((child) => isViewportSelectionTitle(child.textContent ?? ''))
  })

  for (const title of titles) {
    const titleText = compactText(title.textContent ?? '').toUpperCase()
    const isDiscard = titleText === 'PILIH KAD UNTUK DIBUANG'
    title.classList.add('mx3-target-selection-title')
    let panel = title.parentElement
    while (panel && panel !== document.body) {
      const cards = panel.querySelectorAll('img').length
      const buttons = panel.querySelectorAll('button').length
      if (cards >= 2 || buttons >= 2) break
      panel = panel.parentElement
    }
    if (!panel || panel === document.body) continue
    panel.classList.add('mx3-target-selection-panel')
    panel.parentElement?.classList.add('mx3-target-selection-overlay')
    if (isDiscard) tagDiscardSelection(panel, title)
  }
}

function syncArenaCommunication() {
  const shell = document.querySelector<HTMLElement>('.duel-shell.mx3-stage')
  if (!shell) return
  const canvas = shell.querySelector<HTMLElement>('.mx3-canvas')
  if (!canvas) return

  const prompt = shell.querySelector<HTMLElement>('.mx3-phase-prompt')
  const promptStrong = prompt?.querySelector<HTMLElement>('strong') ?? null
  const visiblePrompt = compactText(promptStrong?.textContent ?? '')

  if (promptStrong && visiblePrompt && !/^(PEMAIN|LAWAN)\s*·/i.test(visiblePrompt)) {
    promptStrong.dataset.mx3RawPrompt = visiblePrompt
  }

  const rawPrompt = promptStrong?.dataset.mx3RawPrompt ?? visiblePrompt
  const action = canonicalAction(rawPrompt) || phaseAction(canvas)
  const localTurn = detectLocalTurn(shell, prompt)

  shell.classList.toggle('is-local-turn', localTurn === true)
  shell.classList.toggle('is-opponent-turn', localTurn === false)

  const localFighter = shell.querySelector<HTMLElement>('.mx3-fighter.is-local')
  const opponentFighter = Array.from(shell.querySelectorAll<HTMLElement>('.mx3-fighter')).find((fighter) => fighter !== localFighter) ?? null
  localFighter?.classList.toggle('is-local-turn', localTurn === true)
  localFighter?.classList.toggle('is-waiting-turn', localTurn === false)
  opponentFighter?.classList.toggle('is-opponent-turn', localTurn === false)
  opponentFighter?.classList.toggle('is-waiting-turn', localTurn === true)

  const strip = ensureTurnCommunication(canvas)
  const owner = strip.querySelector<HTMLElement>('strong')
  const detail = strip.querySelector<HTMLElement>('span')

  if (localTurn === true) {
    strip.dataset.owner = 'local'
    if (owner) owner.textContent = 'GILIRAN PEMAIN'
    if (detail) detail.textContent = `PEMAIN · ${action || 'BERMAIN'}`
    if (promptStrong && action) promptStrong.textContent = `PEMAIN · ${action}`
  } else if (localTurn === false) {
    strip.dataset.owner = 'opponent'
    if (owner) owner.textContent = 'GILIRAN LAWAN'
    if (detail) detail.textContent = `LAWAN · ${opponentAction(action)}`
    if (promptStrong && action) promptStrong.textContent = `LAWAN · ${opponentAction(action)}`
  } else {
    strip.dataset.owner = 'neutral'
    if (owner) owner.textContent = 'STATUS PERLAWANAN'
    if (detail) detail.textContent = action || 'MENUNGGU STATUS...'
  }

  tagTargetSelection()
}

function queueArenaCommunicationSync() {
  if (arenaCommunicationQueued) return
  arenaCommunicationQueued = true
  window.requestAnimationFrame(() => {
    arenaCommunicationQueued = false
    if (arenaVisible()) syncArenaCommunication()
  })
}

function openArenaAudioSettings() {
  const toggle = document.querySelector<HTMLButtonElement>('#mx-audio-controls [data-audio-toggle]')
  if (!toggle) {
    showArenaFeedback('KAWALAN AUDIO BELUM SEDIA')
    return
  }
  toggle.click()
  queueArenaAudioButtonSync()
}

window.addEventListener(AUDIO_REQUEST, openArenaAudioSettings)
window.addEventListener(FEEDBACK_EVENT, (event) => {
  const message = (event as CustomEvent<{ message?: string }>).detail?.message ?? ''
  showArenaFeedback(message)
})

const arenaUsabilityObserver = new MutationObserver(() => queueArenaAudioButtonSync())
arenaUsabilityObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'hidden'],
})

const arenaCommunicationObserver = new MutationObserver(() => queueArenaCommunicationSync())
arenaCommunicationObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ['class', 'hidden', 'disabled', 'aria-pressed', 'data-selected'],
})

window.addEventListener('DOMContentLoaded', () => {
  queueArenaAudioButtonSync()
  queueArenaCommunicationSync()
}, { once: true })
queueArenaAudioButtonSync()
queueArenaCommunicationSync()
