import fs from 'node:fs'

const main = fs.readFileSync('src/main.tsx','utf8')
const fragment = fs.readFileSync('src/arena-blueprint.fragment','utf8')
const css = fs.existsSync('src/arena-usability.css') ? fs.readFileSync('src/arena-usability.css','utf8') : ''
const bridge = fs.existsSync('src/arena-usability.ts') ? fs.readFileSync('src/arena-usability.ts','utf8') : ''

const must = (ok,msg) => { if (!ok) throw new Error(msg) }

must(main.includes("import './arena-usability.css'"), 'Arena usability CSS import missing')
must(main.includes("import './arena-usability.ts'"), 'Arena usability runtime import missing')
must(fragment.includes("mega-x:audio-toggle-request"), 'Arena AUDIO button is not wired to audio toggle request')
must(fragment.includes("mega-x:arena-feedback"), 'Arena STA feedback event missing')
must(fragment.includes('STA HABIS'), 'Arena exhausted-STA warning copy missing')
must(css.includes('backdrop-filter:blur(') || css.includes('backdrop-filter: blur('), 'Arena prompt glass blur missing')
must(css.includes('.mx3-phase-prompt button') && css.includes('min-height:52px'), 'Arena prompt mobile touch target is too small')
must(css.includes('.mx3-arena-toast'), 'Arena feedback toast styling missing')
must(bridge.includes("addEventListener('mega-x:audio-toggle-request'"), 'Arena audio bridge listener missing')
must(bridge.includes("addEventListener('mega-x:arena-feedback'"), 'Arena feedback toast listener missing')
must(bridge.includes("[data-audio-mute]"), 'Arena audio toggle does not control the existing audio system')

console.log('PASS Arena usability: glass prompt, mobile touch target, working audio toggle, and STA exhausted feedback')
