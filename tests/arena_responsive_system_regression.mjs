import fs from 'node:fs'

const buildClean = fs.readFileSync('scripts/build-clean.mjs','utf8')
const css = fs.readFileSync('src/V24.css','utf8')
const auditPatch = fs.readFileSync('scripts/patch-arena-mobile-audit.mjs','utf8')
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(buildClean.includes('patch-arena-responsive-system.mjs'), 'unified arena system is not in build chain')
must(!buildClean.includes('patch-responsive-arena-hook.mjs'), 'legacy responsive hook is still in build chain')
must(!buildClean.includes('patch-responsive-arena.mjs'), 'legacy responsive arena patch is still in build chain')
must(!buildClean.includes('patch-mobile-arena-v2.mjs'), 'legacy phone-only arena geometry is still in build chain')
must(!auditPatch.includes('transform:scale(.72)'), 'arena interaction patch still contains phone-only HUD scaling')
must(!auditPatch.includes('.duel-shell .battlefield{top:72px'), 'arena interaction patch still owns battlefield geometry')

must(css.includes('/* MEGA-X unified arena responsive system */'), 'unified arena CSS marker missing')
must(css.includes('container-type:size'), 'arena is not a size container')
must(css.includes('--mx-card-ratio:420/595'), 'card aspect ratio token missing')
must(css.includes('grid-template-rows:var(--mx-utility-h) var(--mx-opponent-hand-h) minmax(0,1fr) var(--mx-local-hand-h)'), 'arena shell does not reserve utility, opponent hand, battlefield and local hand')
must(css.includes('@container mx-arena (max-aspect-ratio: 3/4)'), 'portrait container contract missing')
must(css.includes('@container mx-arena (min-aspect-ratio: 4/3)'), 'wide container contract missing')
must(css.includes('.duel-shell .opponent-panel,.duel-shell .local-panel{transform:none!important'), 'fighter HUDs still rely on transform scaling')
must(css.includes('.duel-shell .digital-card{aspect-ratio:var(--mx-card-ratio)!important'), 'cards do not share one authoritative aspect ratio')
must(css.includes('.duel-shell .player-hand .hand-card-wrap{') && css.includes('margin:0!important') && css.includes('transform:none!important'), 'hand still relies on fixed negative overlap or scale')
must(css.includes('.duel-shell .battlefield{') && css.includes('grid-row:3!important'), 'battlefield is not assigned to the responsive grid')
must(css.includes('.duel-shell .hand-area{') && css.includes('grid-row:4!important'), 'local hand is not assigned to its reserved grid row')
must(css.includes('.duel-shell .mx-responsive-vs-title,.duel-shell .mx-responsive-discard-title,.duel-shell .mx-responsive-effect-title{position:relative!important'), 'selection titles are not isolated from board geometry')
must(css.includes('body:has(.duel-shell) #mx-audio-controls{position:fixed!important'), 'audio control is not isolated in utility layer')

const viewports = ['360x640','390x844','412x915','768x1024','1024x768','1366x768','1920x1080']
for (const viewport of viewports) must(css.includes(`/* viewport:${viewport} */`), `viewport contract missing: ${viewport}`)

console.log('PASS unified Arena responsive system owns geometry across phone, tablet, laptop and desktop')
