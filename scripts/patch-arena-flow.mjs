import fs from 'node:fs'

const appPath = 'src/App.tsx'
const cssPath = 'src/V24.css'
let app = fs.readFileSync(appPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')

app = app.replace(
  "  const motionEvents = useMemo(() => (motionFx ? [motionFx, ...motionQueue] : motionQueue), [motionFx, motionQueue])",
  "  const motionEvents = useMemo(() => (motionFx ? [motionFx] : []), [motionFx])",
)
app = app.replace(
  "    events.sort((a, b) => priority[a.kind] - priority[b.kind])\n    previousGameRef.current = game\n    preMutationRectsRef.current = new Map()\n    if (events.length) setMotionQueue((queue) => [...queue, ...events])",
  "    events.sort((a, b) => priority[a.kind] - priority[b.kind])\n    const visualEvents = events.filter((event, index, list) => list.findIndex((candidate) => candidate.kind === event.kind) === index)\n    previousGameRef.current = game\n    preMutationRectsRef.current = new Map()\n    if (visualEvents.length) setMotionQueue((queue) => [...queue.slice(-1), ...visualEvents])",
)
app = app.replace(
  /    const duration =\n      motionFx\.kind === 'ENTER_VS' \? 520 :\n      motionFx\.kind === 'SUPPORT' \? 500 :\n      motionFx\.kind === 'CAPTURE' \? 560 :\n      motionFx\.kind === 'DRAW' \? 150 :\n      motionFx\.kind === 'DESTROY' \? 260 :\n      motionFx\.kind === 'DISCARD' \? 220 :\n      motionFx\.kind === 'RETURN' \? 240 : 360/,
  "    const duration =\n      motionFx.kind === 'ENTER_VS' ? 400 :\n      motionFx.kind === 'SUPPORT' ? 380 :\n      motionFx.kind === 'CAPTURE' ? 430 :\n      motionFx.kind === 'DRAW' ? 100 :\n      motionFx.kind === 'DESTROY' ? 200 :\n      motionFx.kind === 'DISCARD' ? 160 :\n      motionFx.kind === 'RETURN' ? 180 : 260",
)

for (const needle of ["{ id: 14,", "case 14:", "attackBlocks += 1"]) {
  let from = 0
  while (true) {
    const at = app.indexOf(needle, from)
    if (at < 0) break
    console.log(`CARD14_CONTEXT ${needle} @ ${at}\n${app.slice(Math.max(0, at - 500), Math.min(app.length, at + 1300))}\n---`)
    from = at + needle.length
  }
}

const marker = '/* Arena flow de-jank */'
if (!css.includes(marker)) {
  css += `\n${marker}\n.duel-shell .motion-card-fx{pointer-events:none!important;contain:layout paint style!important;transform-origin:center!important;backface-visibility:hidden!important}\n.duel-shell .motion-card-fx.support,.duel-shell .motion-card-fx.enter_vs{animation-duration:.38s!important}\n.duel-shell .motion-card-fx.support::before,.duel-shell .motion-card-fx.support::after{content:none!important;background:transparent!important;border:0!important;box-shadow:none!important;filter:none!important}\n.duel-shell .motion-card-fx>.digital-card{display:block!important;width:100%!important;height:100%!important;aspect-ratio:auto!important;object-fit:contain!important;border-radius:inherit!important}\n.duel-shell .is-arrival-hidden{visibility:hidden!important}\n`
}

fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
console.log('Collapsed bulk motion queues and removed delayed destination hiding')
