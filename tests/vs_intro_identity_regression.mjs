import fs from 'node:fs'

const baseCss = fs.readFileSync('src/VsIntro.css', 'utf8')
const hypeCss = fs.existsSync('src/VsIntroHype.css') ? fs.readFileSync('src/VsIntroHype.css', 'utf8') : ''
const css = `${baseCss}\n${hypeCss}`
const jsx = fs.readFileSync('src/VsIntro.tsx', 'utf8')

const required = [
  ['single-line fighter names', '.mx-vs-name{', 'white-space:nowrap'],
  ['left champagne identity', '.mx-vs-name-p1', '#ffe3a1'],
  ['right rose-gold identity', '.mx-vs-name-p2', '#f3a6a0'],
  ['strong VS condensed face', '.mx-vs-mark span', 'font-family:"Arial Narrow",Impact,"Barlow Condensed",sans-serif'],
  ['strong VS angular treatment', '.mx-vs-mark span', 'scaleX(.82)'],
  ['left fighter pushed higher', '.mx-vs-name-p1', 'top:43%'],
  ['right fighter pushed lower', '.mx-vs-name-p2', 'top:57%'],
  ['left bright cyan edge glow', '.mx-vs-name-p1', 'rgba(104,225,255,.95)'],
  ['right bright pink edge glow', '.mx-vs-name-p2', 'rgba(255,117,175,.95)'],
  ['VS fixed to true center', '.mx-vs-mark{', 'left:50%'],
  ['VS fixed to true center vertically', '.mx-vs-mark{', 'top:50%'],
  ['audio control hidden during VS intro', 'body:has(.mx-vs-intro-root) #mx-audio-controls', 'display:none!important'],
]

function selectorHasToken(selector, token) {
  let offset = 0
  while (offset < css.length) {
    const start = css.indexOf(selector, offset)
    if (start < 0) return false
    if (css.slice(start, start + 1800).includes(token)) return true
    offset = start + selector.length
  }
  return false
}

for (const [label, selector, token] of required) {
  if (!selectorHasToken(selector, token)) {
    throw new Error(`VS intro regression failed: ${label}`)
  }
}

if (!jsx.includes("import './VsIntroHype.css'") || !jsx.includes('className="mx-vs-brand-logo"') || !jsx.includes('src="/ui/landing/logo.avif"')) {
  throw new Error('VS intro regression failed: branded VS intro layer is missing')
}

if (/\.mx-vs-name\{[^}]*color:#fff/.test(baseCss)) {
  throw new Error('VS intro regression failed: fighter names still use generic white')
}

const mobileStart = baseCss.indexOf('@media(max-width:760px)')
const mobileEnd = baseCss.indexOf('@media(prefers-reduced-motion:reduce)', mobileStart)
const mobile = mobileStart >= 0 ? baseCss.slice(mobileStart, mobileEnd >= 0 ? mobileEnd : baseCss.length) : ''
if (/\.mx-vs-name\{[^}]*font-size:/.test(mobile)) {
  throw new Error('VS intro regression failed: mobile breakpoint changes fighter-name size abruptly')
}
if (/\.mx-vs-mark span\{[^}]*font-size:/.test(mobile)) {
  throw new Error('VS intro regression failed: mobile breakpoint changes VS size abruptly')
}
if (/\.mx-vs-mark i\{[^}]*height:/.test(mobile)) {
  throw new Error('VS intro regression failed: mobile breakpoint changes VS slash height abruptly')
}

console.log('PASS VS intro branding, diagonal fighter layout, edge glow, centered VS, hidden utility UI, and continuous sizing')
