import fs from 'node:fs'

const main = fs.readFileSync('src/main.tsx','utf8')
const stage = fs.readFileSync('src/arena-stage.css','utf8')
const inspector = fs.readFileSync('src/arena-stage.ts','utf8')
const cards = fs.readFileSync('src/arena-card-info.ts','utf8')
const must = (ok,msg) => { if(!ok) throw new Error(msg) }

must(main.includes("import './arena-stage.css'"), 'portrait Arena CSS is not imported')
must(main.includes("import './arena-stage.ts'"), 'portrait Arena runtime is not imported')
must(stage.includes('MEGA-X portrait Arena stage'), 'portrait Arena marker missing')
must(stage.includes('max-width:430px'), 'portrait stage width contract missing')
must(stage.includes('.mx-field-left .effect-rack'), 'left side effect rack missing')
must(stage.includes('.mx-field-right .effect-rack'), 'right side effect rack missing')
must(stage.includes('.mx-card-inspector'), 'plain-text card inspector styling missing')
must(stage.includes('.mx-zone-x-count'), 'Zon X score counter styling missing')
must(stage.includes('mxPhaseGlow'), 'phase-driven glow missing')
must(inspector.includes('CARD_INFO'), 'inspector is not backed by card data')
must(inspector.includes('refreshZoneCounters'), 'Zon X counters are not mounted')
must((cards.match(/\bid:\d+/g) || []).length === 30, 'card inspector database must contain 30 cards')

console.log('PASS portrait Arena stage: side effects, readable inspector, score counters and phase glow')
