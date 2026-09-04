import fs from 'node:fs'

const baseCss = fs.readFileSync('src/VsIntro.css', 'utf8')
const hypeCss = fs.readFileSync('src/VsIntroHype.css', 'utf8')
const jsx = fs.readFileSync('src/VsIntro.tsx', 'utf8')
const css = `${baseCss}\n${hypeCss}`

const required = [
  ['player one uses supplied red upper-left background', '.mx-vs-half-p1', "url('/ui/vs-red.webp')"],
  ['player two uses supplied blue lower-right background', '.mx-vs-half-p2', "url('/ui/vs-blue.webp')"],
  ['balanced player one diagonal split', '.mx-vs-half-p1', '62% 0,38% 100%'],
  ['balanced player two diagonal split', '.mx-vs-half-p2', '62% 0,100% 0,100% 100%,38% 100%'],
  ['seam matches background split geometry', '.mx-vs-seam{', 'mxVsBalancedSeam'],
  ['fighter nameplate shell', '.mx-vs-card{', 'mxVsCardPulse'],
  ['player one impact entry', '.mx-vs-card-p1', 'mxVsCardFlyTop'],
  ['player two impact entry', '.mx-vs-card-p2', 'mxVsCardFlyBottom'],
  ['fast running light on nameplate edges', '.mx-vs-card::after', 'mxVsEdgeRun'],
  ['name text stays centered', '.mx-vs-name{', 'text-align:center'],
  ['short name normal size', '.mx-vs-name-size-normal', 'font-size:clamp'],
  ['long name reduced size', '.mx-vs-name-size-long', 'font-size:clamp'],
  ['extra-long name reduced further', '.mx-vs-name-size-xlong', 'font-size:clamp'],
  ['ranking centered under handle', '.mx-vs-ranking{', 'text-align:center'],
  ['supplied VS WebP artwork used', '.mx-vs-mark::after', "url('/ui/vs-user.webp')"],
  ['VS stomp impact', '.stage-versus .mx-vs-mark::after', 'mxVsArtworkStomp'],
  ['fast VS lens flare', '.stage-versus .mx-vs-lens-flare', 'mxVsLensFlare'],
  ['diagonal reveal split', '.stage-reveal .mx-vs-half-p1', 'mxVsTearLeft'],
  ['audio control hidden during VS intro', 'body:has(.mx-vs-intro-root) #mx-audio-controls', 'display:none!important'],
]

function selectorHasToken(selector, token) {
  let offset = 0
  while (offset < css.length) {
    const start = css.indexOf(selector, offset)
    if (start < 0) return false
    if (css.slice(start, start + 2600).includes(token)) return true
    offset = start + selector.length
  }
  return false
}

for (const [label, selector, token] of required) {
  if (!selectorHasToken(selector, token)) throw new Error(`VS intro regression failed: ${label}`)
}

for (const mediaPath of ['public/ui/vs-red.webp','public/ui/vs-blue.webp','public/ui/vs-user.webp']) {
  if (!fs.existsSync(mediaPath) || fs.statSync(mediaPath).size < 1024) throw new Error(`VS intro regression failed: manual media missing: ${mediaPath}`)
}
if (!jsx.includes("import './VsIntroHype.css'") || !jsx.includes('className="mx-vs-card mx-vs-card-p1"') || !jsx.includes('className="mx-vs-card mx-vs-card-p2"')) throw new Error('VS intro regression failed: fighter nameplate markup is missing')
if (!jsx.includes('className="mx-vs-lens-flare"')) throw new Error('VS intro regression failed: VS lens flare layer is missing')
if (jsx.includes('mx-vs-fight') || jsx.includes('FIGHT!')) throw new Error('VS intro regression failed: FIGHT word must not exist in the intro markup')
if (jsx.includes("setStage('FIGHT')") || jsx.includes("'FIGHT' |")) throw new Error('VS intro regression failed: FIGHT stage must be removed')
if (!jsx.includes("const VS_INTRO_AUDIO_SRC = '/audio/coin-toss/mega-x-coin-toss-v1.opus'")) throw new Error('VS intro regression failed: intro music source changed')

console.log('PASS redesigned VS intro uses balanced seam geometry, fast animated nameplate edge lights, all three manual WebP assets, adaptive centered names, VS stomp/lens flare, unchanged music, and no FIGHT word')
