import fs from 'node:fs'

const appPath = 'src/App.tsx'
const cssPath = 'src/V24.css'
let app = fs.readFileSync(appPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')

const oldDurations = `    const duration =
      motionFx.kind === 'ENTER_VS' ? 920 :
      motionFx.kind === 'SUPPORT' ? 1120 :
      motionFx.kind === 'CAPTURE' ? 900 :
      motionFx.kind === 'DRAW' ? 720 :
      motionFx.kind === 'DESTROY' ? 1320 : 780`
const newDurations = `    const duration =
      motionFx.kind === 'ENTER_VS' ? 520 :
      motionFx.kind === 'SUPPORT' ? 500 :
      motionFx.kind === 'CAPTURE' ? 560 :
      motionFx.kind === 'DRAW' ? 150 :
      motionFx.kind === 'DESTROY' ? 260 :
      motionFx.kind === 'DISCARD' ? 220 :
      motionFx.kind === 'RETURN' ? 240 : 360`
if (!app.includes(oldDurations)) throw new Error('motion duration block missing')
app = app.replace(oldDurations, newDurations)

const marker = '/* Production smooth-play polish */'
if (!css.includes(marker)) {
  css += `\n${marker}\n/* Keep cards physically card-shaped through every travel frame. */\n.duel-shell .motion-card-fx{background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important;will-change:translate,transform,opacity!important}\n.duel-shell .motion-card-fx>.digital-card{width:100%!important;height:auto!important;aspect-ratio:420/595!important;object-fit:contain!important;background:transparent!important}\n.duel-shell .motion-card-fx.enter_vs{animation-duration:.50s!important}\n.duel-shell .motion-card-fx.support{animation-duration:.48s!important}\n.duel-shell .motion-card-fx.support::after{animation-delay:.30s!important;animation-duration:.18s!important}\n.duel-shell .motion-card-fx.destroy{animation-duration:.25s!important}\n.duel-shell .motion-card-fx.destroy .digital-card{animation-duration:.24s!important}\n.duel-shell .motion-card-fx strong{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;text-shadow:0 2px 3px #000,0 0 10px currentColor!important}\n/* The timer must not sit on top of PUSINGAN or the effect callout. */\n.duel-shell .mx-action-timer{left:auto!important;right:10px!important;top:8px!important;transform:none!important;z-index:70!important;padding:3px 8px!important}\n.duel-shell .mx-action-timer.is-danger{animation:mxTimerDangerCorner .55s ease-in-out infinite alternate!important}\n@keyframes mxTimerDangerCorner{from{transform:scale(1)}to{transform:scale(1.06)}}\n/* Never introduce a rectangular black backing around an effect-card travel/activation. */\n.duel-shell .motion-card-fx.support,.duel-shell .motion-card-fx.support::before,.duel-shell .motion-card-fx.support::after{box-shadow:none!important}\n.duel-shell .zone-card-button,.duel-shell .hand-card-wrap,.duel-shell .digital-card{backface-visibility:hidden!important;transform-style:preserve-3d!important}\n@media (max-width:520px) and (orientation:portrait){.duel-shell .mx-action-timer{top:4px!important;right:5px!important}.duel-shell .mx-action-timer span{font-size:7px!important}.duel-shell .mx-action-timer strong{font-size:15px!important}}\n`
}

fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
console.log('Applied smooth-play motion pacing and arena overlay polish')
