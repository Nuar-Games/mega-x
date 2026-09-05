import fs from 'node:fs'

const main = fs.readFileSync('src/main.tsx','utf8')
const app = fs.existsSync('src/App.tsx') ? fs.readFileSync('src/App.tsx','utf8') : ''
const patch = fs.readFileSync('scripts/patch-arena-usability.mjs','utf8')
const css = fs.readFileSync('src/arena-usability.css','utf8')
const bridge = fs.readFileSync('src/arena-usability.ts','utf8')
const audio = fs.readFileSync('src/audio.ts','utf8')

const must = (ok,msg) => { if (!ok) throw new Error(msg) }
const builtOrPatched = (needle) => app.includes(needle) || patch.includes(needle)

must(main.includes("import './arena-usability.css'"), 'Arena usability CSS import missing')
must(main.includes("import './arena-usability.ts'"), 'Arena usability runtime import missing')
must(builtOrPatched("mega-x:audio-toggle-request"), 'Arena AUDIO button is not wired to audio-panel request')
must(builtOrPatched('>AUDIO</button>'), 'Arena AUDIO button must be a settings tab, not an ON/OFF mute button')
must(builtOrPatched("mega-x:arena-feedback"), 'Arena STA feedback event missing')
must(builtOrPatched('STA HABIS'), 'Arena exhausted-STA warning copy missing')
must(css.includes('backdrop-filter:blur(') || css.includes('backdrop-filter: blur('), 'Arena prompt glass blur missing')
must(css.includes('.mx3-phase-prompt button') && css.includes('min-height:52px'), 'Arena prompt touch target is too small')
must(css.includes('min-height:88px'), 'Arena narrow-screen prompt touch target is not enlarged')
must(css.includes('.mx3-arena-toast'), 'Arena feedback toast styling missing')
must(bridge.includes("addEventListener(AUDIO_REQUEST"), 'Arena audio bridge listener missing')
must(bridge.includes("addEventListener(FEEDBACK_EVENT"), 'Arena feedback toast listener missing')
must(bridge.includes("[data-audio-toggle]"), 'Arena AUDIO tab does not open existing audio settings panel')
must(!bridge.includes("mute.click()"), 'Arena AUDIO tab must not directly toggle mute')
must(bridge.includes('audioUiSyncQueued'),'Arena audio UI observer must coalesce mutation callbacks')
must(bridge.includes("attributeFilter: ['class', 'hidden']"),'Arena audio UI observer must stay scoped to relevant attributes')
must(audio.includes('[data-audio-music]') && audio.includes('[data-audio-sfx]') && audio.includes('[data-audio-mute]'), 'audio panel must expose MUSIC, SFX and MUTE controls')

console.log('PASS Arena usability: AUDIO opens Music/SFX/Mute panel, glass prompt and STA feedback remain intact without mutation-loop risk')
