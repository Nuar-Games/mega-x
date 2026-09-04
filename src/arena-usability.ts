const AUDIO_REQUEST = 'mega-x:audio-toggle-request'
const FEEDBACK_EVENT = 'mega-x:arena-feedback'

let toastTimer: number | null = null

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

function syncArenaAudioButton(announce = false) {
  const mute = document.querySelector<HTMLButtonElement>('#mx-audio-controls [data-audio-mute]')
  const arena = document.querySelector<HTMLButtonElement>('.mx3-audio')
  if (!mute || !arena) return false
  const muted = (mute.textContent ?? '').trim().toUpperCase() === 'UNMUTE'
  arena.textContent = muted ? 'AUDIO OFF' : 'AUDIO ON'
  arena.classList.toggle('is-muted', muted)
  arena.setAttribute('aria-pressed', muted ? 'true' : 'false')
  arena.setAttribute('aria-label', muted ? 'Hidupkan audio' : 'Matikan audio')
  if (announce) showArenaFeedback(muted ? 'AUDIO DIMATIKAN' : 'AUDIO DIHIDUPKAN')
  return true
}

function toggleArenaAudio() {
  const mute = document.querySelector<HTMLButtonElement>('#mx-audio-controls [data-audio-mute]')
  if (!mute) {
    showArenaFeedback('KAWALAN AUDIO BELUM SEDIA')
    return
  }
  mute.click()
  window.setTimeout(() => syncArenaAudioButton(true), 0)
}

window.addEventListener(AUDIO_REQUEST, toggleArenaAudio)
window.addEventListener(FEEDBACK_EVENT, (event) => {
  const message = (event as CustomEvent<{ message?: string }>).detail?.message ?? ''
  showArenaFeedback(message)
})

const observer = new MutationObserver(() => { if (arenaVisible()) syncArenaAudioButton(false) })
observer.observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('DOMContentLoaded', () => syncArenaAudioButton(false), { once: true })
