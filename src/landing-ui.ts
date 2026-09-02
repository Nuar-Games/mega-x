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
      <img class="mx-main-art" src="/ui/landing-main-hq.webp" alt="" draggable="false" />
      <button class="mx-main-cta" type="button" aria-label="MAIN SEKARANG!"><span aria-hidden="true"></span></button>
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

const landingStyle = document.createElement('style')
landingStyle.textContent = `
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
    image-rendering: auto;
  }

  #${LANDING_ID} .mx-main-cta {
    position: absolute;
    left: 4%;
    top: 49.2%;
    width: 92%;
    height: 14.8%;
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    isolation: isolate;
    filter: drop-shadow(0 0 10px rgba(255, 40, 248, .9)) drop-shadow(0 0 26px rgba(255, 112, 0, .48));
    animation: mxMainElectricPulse 1.05s cubic-bezier(.2,.7,.15,1) infinite;
  }

  #${LANDING_ID} .mx-main-cta::before,
  #${LANDING_ID} .mx-main-cta::after,
  #${LANDING_ID} .mx-main-cta > span::before,
  #${LANDING_ID} .mx-main-cta > span::after {
    content: '';
    position: absolute;
    pointer-events: none;
  }

  #${LANDING_ID} .mx-main-cta::before {
    inset: 4% 1.8%;
    border: 4px solid rgba(255, 72, 244, .95);
    clip-path: polygon(5% 0, 95% 0, 100% 50%, 95% 100%, 5% 100%, 0 50%);
    box-shadow: 0 0 8px #fff, 0 0 18px #ff3df2, 0 0 34px rgba(255, 32, 238, .95), inset 0 0 16px rgba(255, 90, 247, .65);
    opacity: .95;
    animation: mxMainBorderSurge .72s ease-in-out infinite alternate;
  }

  #${LANDING_ID} .mx-main-cta::after {
    inset: -14% -4%;
    background:
      linear-gradient(105deg, transparent 0 15%, rgba(255,255,255,.96) 16% 17%, transparent 18% 42%, rgba(255,192,0,.9) 43% 44%, transparent 45% 68%, rgba(255,50,246,.95) 69% 70%, transparent 71% 100%),
      linear-gradient(255deg, transparent 0 25%, rgba(86,180,255,.85) 26% 27%, transparent 28% 58%, rgba(255,255,255,.95) 59% 60%, transparent 61% 100%);
    clip-path: polygon(0 44%, 13% 40%, 18% 22%, 23% 45%, 41% 37%, 49% 10%, 54% 42%, 72% 32%, 80% 8%, 84% 41%, 100% 46%, 84% 54%, 78% 86%, 72% 58%, 54% 64%, 48% 92%, 42% 61%, 23% 68%, 17% 91%, 13% 60%, 0 56%);
    mix-blend-mode: screen;
    opacity: .72;
    filter: blur(.2px) drop-shadow(0 0 7px #fff) drop-shadow(0 0 14px #ff30e6);
    animation: mxMainArcFlicker .19s steps(2,end) infinite;
  }

  #${LANDING_ID} .mx-main-cta > span {
    position: absolute;
    inset: 0;
    overflow: visible;
    pointer-events: none;
  }

  #${LANDING_ID} .mx-main-cta > span::before {
    left: 9%;
    right: 9%;
    top: 12%;
    height: 16%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.96), #ffd12f, rgba(255,255,255,.9), transparent);
    filter: blur(5px);
    opacity: .7;
    transform: skewX(-20deg);
    animation: mxMainSweep .88s linear infinite;
  }

  #${LANDING_ID} .mx-main-cta > span::after {
    left: 5%;
    right: 5%;
    bottom: 8%;
    height: 7px;
    background: repeating-linear-gradient(90deg, transparent 0 5%, #fff 5.5% 6.5%, #ff52f1 7% 9%, transparent 10% 15%);
    filter: blur(1px) drop-shadow(0 0 8px #ff46ef) drop-shadow(0 0 14px #ff7b00);
    opacity: .78;
    animation: mxMainSparkRun .46s linear infinite;
  }

  #${LANDING_ID} .mx-main-cta:active {
    transform: scale(.975);
    filter: brightness(1.25) drop-shadow(0 0 22px rgba(255, 255, 255, .9)) drop-shadow(0 0 38px rgba(255, 53, 240, 1));
  }

  #${LANDING_ID} .mx-main-cta:focus-visible {
    outline: 3px solid rgba(255,255,255,.95);
    outline-offset: -8px;
  }

  @keyframes mxMainElectricPulse {
    0%, 100% { transform: scale(1); filter: brightness(1) saturate(1.05) drop-shadow(0 0 9px rgba(255, 48, 244, .78)) drop-shadow(0 0 21px rgba(255, 93, 0, .38)); }
    38% { transform: scale(1.018); filter: brightness(1.23) saturate(1.25) drop-shadow(0 0 15px rgba(255, 255, 255, .88)) drop-shadow(0 0 32px rgba(255, 37, 239, 1)) drop-shadow(0 0 42px rgba(255, 119, 0, .7)); }
    48% { transform: scale(1.007); }
    60% { transform: scale(1.022); filter: brightness(1.3) saturate(1.3) drop-shadow(0 0 18px #fff) drop-shadow(0 0 36px #ff35ef) drop-shadow(0 0 48px rgba(255, 104, 0, .8)); }
  }

  @keyframes mxMainBorderSurge {
    from { opacity: .62; transform: scale(.992); filter: brightness(.9); }
    to { opacity: 1; transform: scale(1.018); filter: brightness(1.6); }
  }

  @keyframes mxMainArcFlicker {
    0% { opacity: .18; transform: translate(-1px, 0) scaleX(.99); }
    20% { opacity: .98; transform: translate(2px, -1px) scaleX(1.01); }
    40% { opacity: .45; transform: translate(-2px, 1px); }
    60% { opacity: .9; transform: translate(1px, 0) scaleX(1.02); }
    80% { opacity: .3; transform: translate(-1px, -1px); }
    100% { opacity: .88; transform: translate(2px, 1px); }
  }

  @keyframes mxMainSweep {
    0% { transform: translateX(-120%) skewX(-20deg); opacity: 0; }
    15% { opacity: .85; }
    70% { opacity: .7; }
    100% { transform: translateX(120%) skewX(-20deg); opacity: 0; }
  }

  @keyframes mxMainSparkRun {
    from { background-position: 0 0; }
    to { background-position: 86px 0; }
  }

  html.mx-main-active,
  html.mx-main-active body { overflow: hidden !important; }

  html.mx-main-active #mx-audio-controls {
    display: none !important;
  }

  @media (prefers-reduced-motion: reduce) {
    #${LANDING_ID} .mx-main-cta,
    #${LANDING_ID} .mx-main-cta::before,
    #${LANDING_ID} .mx-main-cta::after,
    #${LANDING_ID} .mx-main-cta > span::before,
    #${LANDING_ID} .mx-main-cta > span::after {
      animation: none !important;
    }
  }

  @media (min-width: 900px) and (orientation: landscape) {
    #${LANDING_ID} .mx-main-portrait {
      height: 100dvh;
      width: calc(100dvh * 9 / 16);
    }
  }
`
document.head.appendChild(landingStyle)

const landingObserver = new MutationObserver(syncLanding)
landingObserver.observe(document.documentElement, { childList: true, subtree: true, characterData: true })

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncLanding, { once: true })
} else {
  syncLanding()
}
