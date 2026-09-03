export {}

const LANDING_ID = 'mx-main-landing'
const ACTIVE_CLASS = 'mx-main-active'

function textOf(element: HTMLElement) {
  const inputValue = element instanceof HTMLInputElement ? element.value : ''
  return `${element.textContent ?? ''} ${element.getAttribute('aria-label') ?? ''} ${inputValue}`
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function isVisible(element: HTMLElement) {
  if (element.hidden) return false
  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

function findOriginalLandingAction(): HTMLElement | null {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>('button, a, [role="button"], input[type="button"], input[type="submit"]'),
  )

  return elements.find((element) => {
    if (element.closest(`#${LANDING_ID}`)) return false
    if (!isVisible(element)) return false
    const text = textOf(element)
    return text.includes('PLAY NOW') || text.includes('MAIN SEKARANG')
  }) ?? null
}

function syncLandingActivation() {
  const landing = document.getElementById(LANDING_ID)
  if (!landing) return

  const originalAction = findOriginalLandingAction()
  const shouldShowLanding = Boolean(originalAction)

  landing.hidden = !shouldShowLanding
  document.documentElement.classList.toggle(ACTIVE_CLASS, shouldShowLanding)
}

function forwardLandingCta(event: Event) {
  const target = event.target
  if (!(target instanceof Element)) return
  if (!target.closest(`#${LANDING_ID} .mx-main-cta`)) return

  const originalAction = findOriginalLandingAction()
  if (!originalAction) return

  event.preventDefault()
  event.stopImmediatePropagation()
  originalAction.click()

  queueMicrotask(syncLandingActivation)
  window.setTimeout(syncLandingActivation, 0)
  window.setTimeout(syncLandingActivation, 150)
}

document.addEventListener('click', forwardLandingCta, true)

const observer = new MutationObserver(syncLandingActivation)
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['hidden', 'style', 'class', 'aria-hidden'],
})

queueMicrotask(syncLandingActivation)
window.addEventListener('load', syncLandingActivation)
window.addEventListener('pageshow', syncLandingActivation)
