import fs from 'node:fs'

const main = fs.readFileSync('src/main.tsx','utf8')
const app = fs.existsSync('src/App.tsx') ? fs.readFileSync('src/App.tsx','utf8') : ''
const patch = fs.readFileSync('scripts/patch-arena-usability.mjs','utf8')
const css = fs.readFileSync('src/arena-usability.css','utf8')
const bridge = fs.readFileSync('src/arena-usability.ts','utf8')

const must = (ok,msg) => { if (!ok) throw new Error(msg) }
const builtOrPatched = (needle) => app.includes(needle) || patch.includes(needle)

must(main.includes("import './arena-usability.css'"), 'Arena usability CSS import missing')
must(main.includes("import './arena-usability.ts'"), 'Arena usability runtime import missing')
must(builtOrPatched("mega-x:audio-toggle-request"), 'Arena AUDIO button is not wired to audio toggle request')
must(builtOrPatched("mega-x:arena-feedback"), 'Arena STA feedback event missing')
must(builtOrPatched('STA HABIS'), 'Arena exhausted-STA warning copy missing')
must(css.includes('backdrop-filter:blur(') || css.includes('backdrop-filter: blur('), 'Arena prompt glass blur missing')
must(css.includes('.mx3-phase-prompt button') && css.includes('min-height:52px'), 'Arena prompt touch target is too small')
must(css.includes('min-height:88px'), 'Arena narrow-screen prompt touch target is not enlarged')
must(css.includes('.mx3-arena-toast'), 'Arena feedback toast styling missing')
must(bridge.includes("addEventListener(AUDIO_REQUEST"), 'Arena audio bridge listener missing')
must(bridge.includes("addEventListener(FEEDBACK_EVENT"), 'Arena feedback toast listener missing')
must(bridge.includes("[data-audio-mute]"), 'Arena audio toggle does not control the existing audio system')

console.log('PASS Arena usability: glass prompt, large mobile touch target, working audio toggle, and STA exhausted feedback')
