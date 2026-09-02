export {}

const LANDING_ID = 'mx-main-landing'

function textOf(node: Element | null) {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase()
}

function findPlayNowButton() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
    .find((button) => !button.closest(`#${LANDING_ID}`) && textOf(button).includes('PLAY NOW')) ?? null
}

function featureIcon(kind: 'effect' | 'speed' | 'versus' | 'crown') {
  if (kind === 'effect') return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 10h28a5 5 0 0 1 5 5v34a5 5 0 0 1-5 5H18a5 5 0 0 1-5-5V15a5 5 0 0 1 5-5Z"/><path d="m32 18 4.3 8.7 9.7 1.4-7 6.8 1.7 9.6-8.7-4.6-8.7 4.6 1.7-9.6-7-6.8 9.7-1.4L32 18Z"/></svg>`
  if (kind === 'speed') return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m18 46 28-28M23 18l23 23M18 23l23 23"/><path d="m14 50 8-2-6-6-2 8ZM50 14l-8 2 6 6 2-8Z"/></svg>`
  if (kind === 'versus') return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M13 21h12l7 22 7-22h12"/><path d="M18 32h28"/></svg>`
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m12 42 5-22 15 12 15-12 5 22H12Z"/><path d="M16 48h32"/><path d="m32 14 4 7h-8l4-7Z"/></svg>`
}

function mountLanding() {
  const existing = document.getElementById(LANDING_ID)
  if (existing) return existing

  const root = document.createElement('div')
  root.id = LANDING_ID
  root.hidden = true
  root.innerHTML = `
    <div class="mx-main-portrait">
      <img class="mx-main-bg" src="/ui/landing/background.avif" alt="" draggable="false" />
      <div class="mx-main-vignette" aria-hidden="true"></div>
      <div class="mx-main-energy mx-main-energy-a" aria-hidden="true"></div>
      <div class="mx-main-energy mx-main-energy-b" aria-hidden="true"></div>

      <header class="mx-main-header">
        <img class="mx-main-logo" src="/ui/landing/logo.avif" alt="MEGA-X" draggable="false" />
        <div class="mx-main-subtitle">ACTION STRATEGY CARD BATTLE</div>
      </header>

      <section class="mx-main-heroes" aria-hidden="true">
        <img class="mx-main-hero mx-main-hero-left" src="/ui/landing/left.avif" alt="" draggable="false" />
        <img class="mx-main-hero mx-main-hero-right" src="/ui/landing/right.avif" alt="" draggable="false" />
      </section>

      <section class="mx-main-cards" aria-hidden="true">
        <img class="mx-main-card mx-card-1" src="/ui/landing/card.avif" alt="" draggable="false" />
        <img class="mx-main-card mx-card-2" src="/ui/landing/card.avif" alt="" draggable="false" />
        <img class="mx-main-card mx-card-3" src="/ui/landing/card.avif" alt="" draggable="false" />
        <img class="mx-main-card mx-card-4" src="/ui/landing/card.avif" alt="" draggable="false" />
      </section>

      <button class="mx-main-cta" type="button">
        <span class="mx-main-cta-arc arc-a" aria-hidden="true"></span>
        <span class="mx-main-cta-arc arc-b" aria-hidden="true"></span>
        <span class="mx-main-cta-core">MAIN SEKARANG!</span>
      </button>

      <section class="mx-main-features">
        <div class="mx-main-feature"><div class="mx-feature-badge">${featureIcon('effect')}</div><div>EFFECT KAD UNIK</div></div>
        <div class="mx-main-feature"><div class="mx-feature-badge">${featureIcon('speed')}</div><div>PERTARUNGAN PANTAS</div></div>
        <div class="mx-main-feature"><div class="mx-feature-badge">${featureIcon('versus')}</div><div>1V1</div></div>
        <div class="mx-main-feature"><div class="mx-feature-badge">${featureIcon('crown')}</div><div>BE THE TOP X FIGHTER</div></div>
      </section>

      <footer class="mx-main-footer">
        <div>© 2025 MEGA-X. ALL RIGHTS RESERVED.</div>
        <div>Published by Sector Seven Studio</div>
      </footer>
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
#${LANDING_ID}{position:fixed;inset:0;z-index:1400;background:#02030a;overflow:hidden;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#${LANDING_ID}[hidden]{display:none!important}
#${LANDING_ID} .mx-main-portrait{position:absolute;inset:0;margin:auto;width:min(100vw,calc(100dvh * 9 / 16));height:min(100dvh,calc(100vw * 16 / 9));aspect-ratio:9/16;overflow:hidden;background:#030512;box-shadow:0 0 90px rgba(72,18,154,.55)}
#${LANDING_ID} img{user-select:none;-webkit-user-drag:none;pointer-events:none}
#${LANDING_ID} .mx-main-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;filter:saturate(1.17) contrast(1.08) brightness(.72);transform:scale(1.04)}
#${LANDING_ID} .mx-main-vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 37%,transparent 0 25%,rgba(2,3,15,.15) 46%,rgba(1,2,10,.64) 86%,rgba(1,2,8,.86) 100%),linear-gradient(180deg,rgba(3,4,20,.08),rgba(3,2,18,.12) 58%,rgba(2,2,12,.68) 100%)}
#${LANDING_ID} .mx-main-energy{position:absolute;border-radius:50%;filter:blur(42px);mix-blend-mode:screen;opacity:.38;animation:mxEnergyBreath 4.4s ease-in-out infinite}
#${LANDING_ID} .mx-main-energy-a{width:55%;height:38%;left:-12%;top:22%;background:rgba(64,76,255,.7)}
#${LANDING_ID} .mx-main-energy-b{width:52%;height:37%;right:-15%;top:24%;background:rgba(255,48,174,.54);animation-delay:-2.1s}
#${LANDING_ID} .mx-main-header{position:absolute;z-index:8;top:2.7%;left:7%;width:86%;display:flex;flex-direction:column;align-items:center;gap:.25rem}
#${LANDING_ID} .mx-main-logo{width:77%;height:auto;filter:drop-shadow(0 0 15px rgba(255,181,22,.35)) drop-shadow(0 0 24px rgba(97,76,255,.28))}
#${LANDING_ID} .mx-main-subtitle{margin-top:-.35rem;color:#f6f4ff;font-size:clamp(.68rem,2.25vw,1rem);font-weight:900;letter-spacing:.17em;text-align:center;text-shadow:0 2px 5px #000,0 0 12px rgba(173,138,255,.65)}
#${LANDING_ID} .mx-main-heroes{position:absolute;z-index:4;left:0;right:0;top:13%;height:43%}
#${LANDING_ID} .mx-main-hero{position:absolute;width:64%;max-width:none;bottom:-1%;filter:drop-shadow(0 14px 24px rgba(0,0,0,.68)) drop-shadow(0 0 17px rgba(144,74,255,.25));will-change:transform}
#${LANDING_ID} .mx-main-hero-left{left:-18%;animation:mxHeroBobLeft 5.6s ease-in-out infinite}
#${LANDING_ID} .mx-main-hero-right{right:-17%;animation:mxHeroBobRight 6.1s ease-in-out infinite -1.6s}
#${LANDING_ID} .mx-main-cards{position:absolute;z-index:5;left:0;right:0;top:43.2%;height:18%;pointer-events:none}
#${LANDING_ID} .mx-main-card{position:absolute;width:15.7%;border-radius:5.5%;filter:drop-shadow(0 0 3px #fff) drop-shadow(0 0 8px #f35aff) drop-shadow(0 0 16px rgba(105,72,255,.9));animation:mxCardGlow 2.2s ease-in-out infinite,mxCardFloat 4s ease-in-out infinite;will-change:transform,filter}
#${LANDING_ID} .mx-card-1{left:5%;top:8%;transform:rotate(-9deg);animation-delay:-.5s,-.2s}
#${LANDING_ID} .mx-card-2{left:24%;top:1%;transform:rotate(-3deg);animation-delay:-1.2s,-1.1s}
#${LANDING_ID} .mx-card-3{right:24%;top:1%;transform:rotate(3deg);animation-delay:-.2s,-2.2s}
#${LANDING_ID} .mx-card-4{right:5%;top:8%;transform:rotate(9deg);animation-delay:-1.6s,-3.1s}
#${LANDING_ID} .mx-main-cta{position:absolute;z-index:10;left:6%;top:59%;width:88%;height:10.4%;border:0;padding:0;color:white;background:linear-gradient(180deg,rgba(31,9,63,.97),rgba(14,5,39,.98));clip-path:polygon(5% 0,95% 0,100% 50%,95% 100%,5% 100%,0 50%);cursor:pointer;isolation:isolate;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:inset 0 0 0 3px #ff45ee,inset 0 0 16px rgba(119,62,255,.9),0 0 12px #ff45ee,0 0 28px rgba(130,72,255,.95),0 0 48px rgba(80,164,255,.58);animation:mxCtaPulse 1.15s cubic-bezier(.3,.7,.15,1) infinite}
#${LANDING_ID} .mx-main-cta::before{content:"";position:absolute;inset:4px;clip-path:inherit;background:linear-gradient(110deg,transparent 0 23%,rgba(255,255,255,.95) 31%,rgba(255,218,63,.82) 34%,transparent 44% 100%);transform:translateX(-120%);animation:mxCtaSweep 1.35s ease-in-out infinite;mix-blend-mode:screen}
#${LANDING_ID} .mx-main-cta::after{content:"";position:absolute;inset:-16%;z-index:-1;background:radial-gradient(circle at 50% 50%,rgba(245,68,255,.75),transparent 56%);filter:blur(22px);animation:mxCtaHalo 1.15s ease-in-out infinite}
#${LANDING_ID} .mx-main-cta-core{position:absolute;inset:0;display:grid;place-items:center;font-size:clamp(1.55rem,6.3vw,3rem);font-weight:1000;letter-spacing:.025em;color:#fff5e6;text-shadow:0 2px 0 #783e00,0 0 6px white,0 0 16px #ffb21c,0 0 28px #ff4ff1;z-index:3}
#${LANDING_ID} .mx-main-cta-arc{position:absolute;z-index:4;inset:-10%;pointer-events:none;opacity:.9;background:linear-gradient(110deg,transparent 0 8%,#fff 9% 9.6%,transparent 10.2% 34%,#73d4ff 35% 35.6%,transparent 36.2% 61%,#fff 62% 62.7%,transparent 63.3% 83%,#ffdd58 84% 84.6%,transparent 85.2%);clip-path:polygon(0 45%,11% 41%,17% 20%,23% 44%,38% 36%,47% 8%,53% 43%,69% 31%,78% 5%,84% 42%,100% 46%,84% 55%,78% 91%,70% 59%,53% 67%,47% 94%,40% 61%,23% 69%,16% 94%,11% 59%,0 55%);mix-blend-mode:screen;filter:drop-shadow(0 0 4px #fff) drop-shadow(0 0 9px #5cd1ff) drop-shadow(0 0 13px #ff48ee);animation:mxArcFlicker .22s steps(2,end) infinite}
#${LANDING_ID} .arc-b{transform:scaleX(-1);animation-delay:-.1s;opacity:.68}
#${LANDING_ID} .mx-main-cta:active{transform:scale(.97);filter:brightness(1.3)}
#${LANDING_ID} .mx-main-features{position:absolute;z-index:8;left:7%;right:7%;top:72%;display:grid;grid-template-columns:repeat(4,1fr);gap:2.2%;align-items:start}
#${LANDING_ID} .mx-main-feature{min-width:0;color:#f9f7ff;text-align:center;font-size:clamp(.48rem,1.75vw,.79rem);font-weight:900;line-height:1.08;letter-spacing:.02em;text-shadow:0 2px 5px #000,0 0 9px rgba(169,103,255,.7)}
#${LANDING_ID} .mx-feature-badge{position:relative;width:72%;aspect-ratio:1;margin:0 auto 8%;display:grid;place-items:center;clip-path:polygon(25% 5%,75% 5%,95% 25%,95% 75%,75% 95%,25% 95%,5% 75%,5% 25%);background:linear-gradient(145deg,rgba(247,97,255,.96),rgba(75,175,255,.92));filter:drop-shadow(0 0 7px rgba(255,76,239,.95)) drop-shadow(0 0 13px rgba(70,153,255,.7));animation:mxIconGlow 2.8s ease-in-out infinite}
#${LANDING_ID} .mx-feature-badge::before{content:"";position:absolute;inset:3px;clip-path:inherit;background:linear-gradient(145deg,rgba(21,10,51,.98),rgba(5,14,40,.97));box-shadow:inset 0 0 14px rgba(104,58,255,.75)}
#${LANDING_ID} .mx-feature-badge svg{position:relative;z-index:2;width:58%;height:58%;fill:none;stroke:#ffe664;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 4px rgba(255,226,71,.8))}
#${LANDING_ID} .mx-main-feature:nth-child(2) svg{stroke:#ff67e9}#${LANDING_ID} .mx-main-feature:nth-child(3) svg{stroke:#b4e8ff}#${LANDING_ID} .mx-main-feature:nth-child(4) svg{stroke:#ffd34a}
#${LANDING_ID} .mx-main-footer{position:absolute;z-index:8;left:4%;right:4%;bottom:2.3%;display:flex;flex-direction:column;gap:.24rem;color:rgba(255,255,255,.9);text-align:center;font-size:clamp(.46rem,1.55vw,.72rem);font-weight:650;text-shadow:0 2px 5px #000}
html.mx-main-active,html.mx-main-active body{overflow:hidden!important}
html.mx-main-active #mx-audio-controls{display:none!important}
@keyframes mxHeroBobLeft{0%,100%{transform:translate3d(0,0,0) rotate(-1deg)}50%{transform:translate3d(0,-2.1%,0) rotate(.6deg)}}
@keyframes mxHeroBobRight{0%,100%{transform:translate3d(0,-.7%,0) rotate(.8deg)}50%{transform:translate3d(0,1.7%,0) rotate(-.5deg)}}
@keyframes mxCardFloat{0%,100%{translate:0 0}50%{translate:0 -8%}}
@keyframes mxCardGlow{0%,100%{filter:drop-shadow(0 0 3px #fff) drop-shadow(0 0 8px #f35aff) drop-shadow(0 0 16px rgba(105,72,255,.85))}50%{filter:drop-shadow(0 0 5px #fff) drop-shadow(0 0 13px #ff63ef) drop-shadow(0 0 25px rgba(82,183,255,1))}}
@keyframes mxCtaPulse{0%,100%{transform:scale(1);filter:brightness(1)}42%{transform:scale(1.025);filter:brightness(1.18)}52%{transform:scale(1.011);filter:brightness(1.36)}65%{transform:scale(1.028);filter:brightness(1.2)}}
@keyframes mxCtaSweep{0%,18%{transform:translateX(-130%);opacity:0}34%{opacity:1}72%,100%{transform:translateX(130%);opacity:0}}
@keyframes mxCtaHalo{0%,100%{opacity:.45;transform:scale(.93)}50%{opacity:.92;transform:scale(1.08)}}
@keyframes mxArcFlicker{0%{opacity:.2;transform:translate(-1px,0)}20%{opacity:1;transform:translate(2px,-1px)}40%{opacity:.35;transform:translate(-2px,1px)}60%{opacity:.9;transform:translate(1px,0)}80%{opacity:.25;transform:translate(-1px,-1px)}100%{opacity:.82;transform:translate(2px,1px)}}
@keyframes mxIconGlow{0%,100%{filter:drop-shadow(0 0 6px rgba(255,76,239,.82)) drop-shadow(0 0 11px rgba(70,153,255,.58))}50%{filter:drop-shadow(0 0 10px rgba(255,113,246,1)) drop-shadow(0 0 18px rgba(80,190,255,.9))}}
@keyframes mxEnergyBreath{0%,100%{opacity:.24;transform:scale(.94)}50%{opacity:.48;transform:scale(1.08)}}
@media (prefers-reduced-motion:reduce){#${LANDING_ID} *{animation-duration:.001ms!important;animation-iteration-count:1!important}}
@media (min-width:900px) and (orientation:landscape){#${LANDING_ID} .mx-main-portrait{height:100dvh;width:calc(100dvh * 9 / 16)}}
`
document.head.appendChild(landingStyle)

const landingObserver = new MutationObserver(syncLanding)
landingObserver.observe(document.documentElement,{childList:true,subtree:true,characterData:true})

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncLanding,{once:true})
else syncLanding()
