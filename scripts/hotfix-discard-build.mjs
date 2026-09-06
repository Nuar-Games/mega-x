import fs from 'node:fs'

const target = 'scripts/patch-arena-ownership-choice.mjs'
let source = fs.readFileSync(target, 'utf8')

const counterStart = source.indexOf('// Add one live counter to the authoritative discard panel. Do not duplicate the discard UI.')
const counterEnd = source.indexOf('// Remove the older V24 tray authority if it ever exists.', counterStart)
if (counterStart < 0 || counterEnd < 0) throw new Error('Discard build hotfix target block missing')
source = source.slice(0, counterStart)
  + '// Discard counter intentionally omitted: authoritative recovered markup already shows selected count.\n\n'
  + source.slice(counterEnd)
source = source.replace("if (!app.includes('mx-discard-remaining')) throw new Error('Android discard remaining counter missing')\n", '')

source = source
  .replaceAll('height:min(84dvh,720px)!important', 'height:min(76dvh,560px)!important')
  .replaceAll('max-height:84dvh!important', 'max-height:76dvh!important')
  .replaceAll('grid-template-columns:repeat(2,minmax(0,1fr))!important', 'grid-template-columns:repeat(3,minmax(0,1fr))!important')
  .replaceAll('body.mx3-arena-present .choice-overlay .discard-panel :is(div,section):has(>button){', 'body.mx3-arena-present .choice-overlay .discard-panel .discard-card-grid{')
  .replaceAll('body.mx3-arena-present .choice-overlay .discard-panel :is(div,section):has(>button)>button{', 'body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice{')
  .replaceAll('body.mx3-arena-present .choice-overlay .discard-panel :is(div,section):has(>button)>button .digital-card{', 'body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice .digital-card{')
  .replaceAll('body.mx3-arena-present .choice-overlay .discard-panel :is(div,section):has(>button)>button :is(span,strong,b,em){', 'body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice .discard-check{')
  .replaceAll('body.mx3-arena-present .choice-overlay .discard-panel>button:last-child{', 'body.mx3-arena-present .choice-overlay .discard-panel .discard-confirm{')

const imageNeedle = 'body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice .digital-card{position:relative!important;inset:auto!important;display:block!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:100%!important;max-height:100%!important;aspect-ratio:420/595!important;transform:none!important;object-fit:contain!important;overflow:hidden!important}\\n'
if (!source.includes(imageNeedle)) throw new Error('Discard digital-card rule missing before image fix')
source = source.replace(imageNeedle, imageNeedle + '  body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice .digital-card>img{display:block!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;opacity:1!important;visibility:visible!important;transform:none!important}\\n')

source = source.replace("if (!mobileDiscardV2.includes('grid-template-columns:repeat(2,minmax(0,1fr))') || !mobileDiscardV2.includes('overflow-y:auto') || !mobileDiscardV2.includes('aspect-ratio:420/595')) throw new Error('Android discard readable two-column scroll authority missing')", "if (!mobileDiscardV2.includes('grid-template-columns:repeat(3,minmax(0,1fr))') || !mobileDiscardV2.includes('.discard-card-choice .digital-card>img') || !mobileDiscardV2.includes('width:100%!important;height:100%!important') || !mobileDiscardV2.includes('aspect-ratio:420/595')) throw new Error('Android discard visible three-column card authority missing')")

if (source.includes('Authoritative discard panel opening tag missing')) throw new Error('Brittle discard panel opening-tag assertion survived hotfix')
if (!source.includes('.discard-card-choice .digital-card>img')) throw new Error('Discard image dimensions were not installed')
if (!source.includes('repeat(3,minmax(0,1fr))')) throw new Error('Discard three-column grid was not installed')

fs.writeFileSync(target, source)
console.log('Prepared Android discard fix: exact grid selectors, visible image dimensions, three columns, bounded phone height')
