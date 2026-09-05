import fs from 'node:fs'

const baseCss = fs.readFileSync('src/VsIntro.css', 'utf8')
const hypeCss = fs.readFileSync('src/VsIntroHype.css', 'utf8')
const jsx = fs.readFileSync('src/VsIntro.tsx', 'utf8')
const patch = fs.readFileSync('scripts/patch-vs-intro-flow.mjs', 'utf8')
const css = `${baseCss}\n${hypeCss}`

const required = [
  ['side image backgrounds are removed', '.mx-vs-half-p1', 'url(\'/ui/vs-red.webp\')', false],
  ['side image backgrounds are removed', '.mx-vs-half-p2', 'url(\'/ui/vs-blue.webp\')', false],
  ['animated energy backdrop exists', '.mx-vs-half-p1', 'mxVsFieldSurge', true],
  ['animated energy backdrop exists on p2', '.mx-vs-half-p2', 'mxVsFieldSurge', true],
  ['energy seam exists', '.mx-vs-seam{', 'mxVsSeamEnergyRise', true],
  ['seam exits on reveal', '.stage-reveal .mx-vs-seam', 'mxVsSeamExit', true],
  ['fighter nameplate shell', '.mx-vs-card{', 'clip-path', true],
  ['fighter plate entrance stays fixed after impact', '.mx-vs-card-p1', 'mxVsPlateInLeft', true],
  ['fighter plate entrance stays fixed after impact', '.mx-vs-card-p2', 'mxVsPlateInRight', true],
  ['fighting game font stack', '.mx-vs-name{', 'Impact', true],
  ['name text stays centered', '.mx-vs-name{', 'text-align:center', true],
  ['ranking centered under handle', '.mx-vs-ranking{', 'text-align:center', true],
  ['MEGA-X logo styling exists', '.mx-vs-logo{', 'MEGA', false],
  ['supplied VS WebP artwork retained', '.mx-vs-mark::after', "url('/ui/vs-user.webp')", true],
  ['VS stomp impact retained', '.stage-versus .mx-vs-mark::after', 'mxVsArtworkStomp', true],
  ['fast VS lens flare retained', '.stage-versus .mx-vs-lens-flare', 'mxVsLensFlare', true],
  ['diagonal reveal split retained', '.stage-reveal .mx-vs-half-p1', 'mxVsTearLeft', true],
  ['audio control hidden during VS intro', 'body:has(.mx-vs-intro-root) #mx-audio-controls', 'display:none!important', true],
]

function selectorHasToken(selector, token) {
  let offset = 0
  while (offset < css.length) {
    const start = css.indexOf(selector, offset)
    if (start < 0) return false
    if (css.slice(start, start + 3600).includes(token)) return true
    offset = start + selector.length
  }
  return false
}

for (const [label, selector, token, expected] of required) {
  const found = selectorHasToken(selector, token)
  if (found !== expected) throw new Error(`VS intro regression failed: ${label}`)
}

if (!fs.existsSync('public/ui/vs-user.webp') || fs.statSync('public/ui/vs-user.webp').size < 1024) throw new Error('VS intro regression failed: VS hero artwork missing')
if (!jsx.includes("import './VsIntroHype.css'") || !jsx.includes('className="mx-vs-card mx-vs-card-p1"') || !jsx.includes('className="mx-vs-card mx-vs-card-p2"')) throw new Error('VS intro regression failed: fighter nameplate markup is missing')
if (!jsx.includes('className="mx-vs-logo"')) throw new Error('VS intro regression failed: MEGA-X logo missing')
if (!jsx.includes('match.player1_start_place') || !jsx.includes('match.player2_start_place')) throw new Error('VS intro regression failed: real match-start ranks are not rendered')
if (jsx.includes('#RANKING')) throw new Error('VS intro regression failed: fake ranking label survived')
if (!patch.includes('player1_start_place') || !patch.includes('player2_start_place')) throw new Error('VS intro regression failed: ActiveOnlineMatch rank fields are not patched into client type')
if (!jsx.includes('className="mx-vs-lens-flare"')) throw new Error('VS intro regression failed: VS lens flare layer is missing')
if (jsx.includes('mx-vs-fight') || jsx.includes('FIGHT!')) throw new Error('VS intro regression failed: FIGHT word must not exist in the intro markup')
if (jsx.includes("setStage('FIGHT')") || jsx.includes("'FIGHT' |")) throw new Error('VS intro regression failed: FIGHT stage must be removed')
if (!jsx.includes("const VS_INTRO_AUDIO_SRC = '/audio/coin-toss/mega-x-coin-toss-v1.opus'")) throw new Error('VS intro regression failed: intro music source changed')

console.log('PASS premium VS intro: real ranks, MEGA-X branding, fighting-game type, animated energy field/seam, seam exit, stable fighter plates, preserved VS stomp/lens flare')
