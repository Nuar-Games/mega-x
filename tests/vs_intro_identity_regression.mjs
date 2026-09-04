import fs from 'node:fs'

const baseCss = fs.readFileSync('src/VsIntro.css', 'utf8')
const hypeCss = fs.readFileSync('src/VsIntroHype.css', 'utf8')
const jsx = fs.readFileSync('src/VsIntro.tsx', 'utf8')
const asset = fs.readFileSync('public/ui/vs-user.svg', 'utf8')
const css = `${baseCss}\n${hypeCss}`

const required = [
  ['single-line fighter names', '.mx-vs-name{', 'white-space:nowrap'],
  ['left champagne identity', '.mx-vs-name-p1', '#ffe3a1'],
  ['right rose-gold identity', '.mx-vs-name-p2', '#f3a6a0'],
  ['left fighter pushed higher', '.mx-vs-name-p1', 'top:43%'],
  ['right fighter pushed lower', '.mx-vs-name-p2', 'top:57%'],
  ['left bright cyan edge glow', '.mx-vs-name-p1', 'rgba(104,225,255,.95)'],
  ['right bright pink edge glow', '.mx-vs-name-p2', 'rgba(255,117,175,.95)'],
  ['VS fixed to true center', '.mx-vs-mark{', 'left:50%'],
  ['VS fixed to true center vertically', '.mx-vs-mark{', 'top:50%'],
  ['supplied VS artwork used', '.mx-vs-mark::after', "url('/ui/vs-user.svg')"],
  ['old VS text hidden', '.mx-vs-mark span,.mx-vs-mark i', 'display:none!important'],
  ['bombastic VS hit animation', '.stage-versus .mx-vs-mark::after', 'mxVsArtworkHit'],
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
  if (!selectorHasToken(selector, token)) throw new Error(`VS intro regression failed: ${label}`)
}

if (!asset.includes('<svg') || !asset.includes('data:image/webp;base64,')) throw new Error('VS intro regression failed: supplied VS image asset is missing')
if (!jsx.includes("import './VsIntroHype.css'") || !jsx.includes('className="mx-vs-brand-logo"') || !jsx.includes('src="/ui/landing/logo.avif"')) throw new Error('VS intro regression failed: branded VS intro layer is missing')
if (/\.mx-vs-name\{[^}]*color:#fff/.test(baseCss)) throw new Error('VS intro regression failed: fighter names still use generic white')

console.log('PASS VS intro uses supplied fixed artwork, bombastic center hit, diagonal fighter layout, edge glow, logo branding, and hidden utility UI')
