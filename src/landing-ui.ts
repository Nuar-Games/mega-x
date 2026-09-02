export {}

const LANDING_ID = 'mx-main-landing'

function textOf(node: Element | null) {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase()
}

function findPlayNowButton() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
    .find((button) => !button.closest(`#${LANDING_ID}`) && textOf(button).includes('PLAY NOW')) ?? null
}

function mountLanding() {
  const existing = document.getElementById(LANDING_ID)
  if (existing) return existing

  const root = document.createElement('div')
  root.id = LANDING_ID
  root.hidden = true
  root.innerHTML = `
    <div class="mx-main-portrait">
      <img class="mx-main-art" src="/ui/landing-main.webp" alt="" draggable="false" />
      <button class="mx-main-cta" type="button" aria-label="MAIN SEKARANG!"></button>
    </div>
  `
  document.body.appendChild(root)

  root.querySelector<HTMLButtonElement>('.mx-main-cta')?.addEventListener('click', () => {
    findPlayNowButton()?.click()
  })

  return root
}

function syncLanding() {
  const root = mountLanding()
  const isLanding = Boolean(findPlayNowButton())
  root.hidden = !isLanding
  document.documentElement.classList.toggle('mx-main-active', isLanding)
}

const style = document.createElement('style')
style.textContent = `
  #${LANDING_ID} {
    position: fixed;
    inset: 0;
    z-index: 1400;
    background: #02030a;
    overflow: hidden;
  }

  #${LANDING_ID}[hidden] { display: none !important; }

  #${LANDING_ID} .mx-main-portrait {
    position: absolute;
    inset: 0;
    margin: auto;
    width: min(100vw, calc(100dvh * 9 / 16));
    height: min(100dvh, calc(100vw * 16 / 9));
    aspect-ratio: 9 / 16;
    background: #02030a;
    overflow: hidden;
    box-shadow: 0 0 80px rgba(89, 19, 171, .38);
  }

  #${LANDING_ID} .mx-main-art {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: fill;
    user-select: none;
    -webkit-user-drag: none;
    pointer-events: none;
  }

  #${LANDING_ID} .mx-main-cta {
    position: absolute;
    left: 4%;
    top: 49.5%;
    width: 92%;
    height: 14%;
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  #${LANDING_ID} .mx-main-cta:focus-visible {
    outline: 3px solid rgba(255,255,255,.95);
    outline-offset: -8px;
  }

  html.mx-main-active,
  html.mx-main-active body { overflow: hidden !important; }

  html.mx-main-active #mx-audio-controls {
    top: max(12px, env(safe-area-inset-top)) !important;
    right: max(12px, env(safe-area-inset-right)) !important;
    z-index: 1501 !important;
  }

  html.mx-main-active #mx-audio-controls [data-audio-toggle] {
    width: 48px !important;
    height: 48px !important;
    border-radius: 13px !important;
    border: 1px solid rgba(229, 74, 255, .85) !important;
    background: rgba(18, 5, 31, .78) !important;
    color: #fff !important;
    font-size: 21px !important;
    box-shadow: 0 0 12px rgba(215, 44, 255, .55), inset 0 0 12px rgba(128, 36, 255, .16) !important;
    backdrop-filter: blur(6px);
  }

  @media (min-width: 900px) and (orientation: landscape) {
    #${LANDING_ID} .mx-main-portrait {
      height: 100dvh;
      width: calc(100dvh * 9 / 16);
    }
  }
`
document.head.appendChild(style)

const landingObserver = new MutationObserver(syncLanding)
landingObserver.observe(document.documentElement, { childList: true, subtree: true, characterData: true })

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncLanding, { once: true })
} else {
  syncLanding()
}
