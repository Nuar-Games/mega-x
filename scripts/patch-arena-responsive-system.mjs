import fs from 'node:fs'

const appPath = 'src/App.tsx'
const cssPath = 'src/V24.css'
let app = fs.readFileSync(appPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')

function markText(text, className, required = true) {
  if (app.includes(className)) return
  const idx = app.indexOf(text)
  if (idx < 0) {
    if (required) throw new Error(`responsive arena title text missing: ${text}`)
    return
  }
  const beforeStart = Math.max(0, idx - 900)
  const before = app.slice(beforeStart, idx)
  const tags = [...before.matchAll(/<([A-Za-z][\w.]*)\b[^<>]*>/g)]
  const last = tags.at(-1)
  if (!last) {
    if (required) throw new Error(`responsive arena title element missing: ${text}`)
    return
  }
  const tag = last[0]
  const absolute = beforeStart + (last.index ?? 0)
  let tagged = tag
  if (/className="[^"]*"/.test(tag)) tagged = tag.replace(/className="([^"]*)"/, (_m, c) => `className="${c} ${className}"`)
  else if (/className='[^']*'/.test(tag)) tagged = tag.replace(/className='([^']*)'/, (_m, c) => `className='${c} ${className}'`)
  else tagged = tag.replace(/>$/, ` className="${className}">`)
  app = app.slice(0, absolute) + tagged + app.slice(absolute + tag.length)
}

markText('PILIH KAD UNTUK DIBUANG', 'mx-responsive-discard-title')
markText('PILIH KAD VS', 'mx-responsive-vs-title')
markText('PILIH KAD EFFECT', 'mx-responsive-effect-title', false)

const marker = '/* MEGA-X unified arena responsive system */'
if (!css.includes(marker)) css += `
${marker}
/* viewport:360x640 */
/* viewport:390x844 */
/* viewport:412x915 */
/* viewport:768x1024 */
/* viewport:1024x768 */
/* viewport:1366x768 */
/* viewport:1920x1080 */

.duel-shell{
  container-type:size!important;
  container-name:mx-arena;
  --mx-card-ratio:420/595;
  --mx-edge:clamp(4px,.8cqw,12px);
  --mx-gap:clamp(3px,.7cqw,10px);
  --mx-utility-h:clamp(34px,5.2cqh,48px);
  --mx-opponent-hand-h:clamp(58px,10.5cqh,108px);
  --mx-local-hand-h:clamp(150px,24cqh,238px);
  --mx-callout-h:clamp(28px,4.6cqh,40px);
  --mx-hud-w:clamp(112px,24cqw,220px);
  --mx-vs-card-w:clamp(72px,min(22cqw,15cqh),168px);
  --mx-effect-card-w:clamp(42px,min(13cqw,10cqh),92px);
  position:relative!important;
  display:grid!important;
  grid-template-columns:minmax(0,1fr)!important;
  grid-template-rows:var(--mx-utility-h) var(--mx-opponent-hand-h) minmax(0,1fr) var(--mx-local-hand-h)!important;
  width:100vw!important;
  max-width:100vw!important;
  height:100dvh!important;
  min-height:100dvh!important;
  max-height:100dvh!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
  overscroll-behavior:none!important;
}

.duel-shell .duel-arena{
  grid-column:1!important;
  grid-row:1 / -1!important;
  position:relative!important;
  display:grid!important;
  grid-template-columns:minmax(0,1fr)!important;
  grid-template-rows:var(--mx-utility-h) var(--mx-opponent-hand-h) minmax(0,1fr) var(--mx-local-hand-h)!important;
  width:100%!important;
  max-width:100%!important;
  height:100%!important;
  min-height:0!important;
  max-height:none!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
}

.duel-shell .battlefield{
  grid-column:1!important;
  grid-row:3!important;
  position:relative!important;
  inset:auto!important;
  top:auto!important;
  right:auto!important;
  bottom:auto!important;
  left:auto!important;
  width:auto!important;
  max-width:none!important;
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  margin:0 var(--mx-edge)!important;
  padding:var(--mx-callout-h) var(--mx-gap) var(--mx-gap)!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
}
.duel-shell .arena-wrap,.duel-shell .arena{
  width:100%!important;
  max-width:100%!important;
  height:100%!important;
  max-height:100%!important;
  min-width:0!important;
  min-height:0!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
}
.duel-shell .arena{aspect-ratio:auto!important}

.duel-shell .hand-area{
  grid-column:1!important;
  grid-row:4!important;
  position:relative!important;
  inset:auto!important;
  top:auto!important;
  right:auto!important;
  bottom:auto!important;
  left:auto!important;
  width:100%!important;
  max-width:100%!important;
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  padding:var(--mx-gap) var(--mx-edge) max(var(--mx-gap),env(safe-area-inset-bottom))!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
}
.duel-shell .player-hand,.duel-shell .hand-scroll,.duel-shell .hand-fan{height:100%!important;min-height:0!important;max-height:100%!important;box-sizing:border-box!important}
.duel-shell .hand-scroll{width:100%!important;max-width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;overscroll-behavior-x:contain!important;touch-action:pan-x!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:thin!important}
.duel-shell .hand-fan{display:flex!important;justify-content:flex-start!important;align-items:flex-end!important;gap:var(--mx-gap)!important;width:max-content!important;min-width:100%!important;padding:0!important;overflow:visible!important}
.duel-shell .player-hand .hand-card-wrap{
  flex:0 0 auto!important;
  width:auto!important;
  min-width:0!important;
  max-width:none!important;
  height:calc(100% - var(--mx-gap))!important;
  margin:0!important;
  transform:none!important;
  overflow:visible!important;
}
.duel-shell .digital-card{aspect-ratio:var(--mx-card-ratio)!important;object-fit:contain!important}
.duel-shell .player-hand .hand-card-wrap .digital-card{display:block!important;width:auto!important;max-width:none!important;height:100%!important;max-height:100%!important}

.duel-shell .fighter-field,.duel-shell .vs-battle-row,.duel-shell .effect-rack{min-width:0!important;min-height:0!important;box-sizing:border-box!important}
.duel-shell .fighter-field{overflow:hidden!important}
.duel-shell .vs-battle-row{gap:var(--mx-gap)!important}
.duel-shell .v9-vs-card{min-width:0!important;max-width:100%!important;display:grid!important;place-items:center!important;overflow:hidden!important}
.duel-shell .v9-vs-card .vs-inspect-button,.duel-shell .vs-inspect-button{
  display:block!important;
  box-sizing:border-box!important;
  width:min(var(--mx-vs-card-w),100%)!important;
  max-width:100%!important;
  height:auto!important;
  max-height:100%!important;
  margin-inline:auto!important;
  aspect-ratio:var(--mx-card-ratio)!important;
  overflow:hidden!important;
}
.duel-shell .vs-inspect-button .digital-card{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important}
.duel-shell .effect-rack{gap:var(--mx-gap)!important;padding-inline:var(--mx-gap)!important;overflow:hidden!important}
.duel-shell .effect-card-slot{min-width:0!important;max-width:var(--mx-effect-card-w)!important;min-height:0!important;overflow:hidden!important}
.duel-shell .effect-card-slot .zone-card-button{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:100%!important;aspect-ratio:var(--mx-card-ratio)!important;overflow:hidden!important}
.duel-shell .effect-card-slot .digital-card{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important}
.duel-shell .effect-card-slot>span{font-size:clamp(7px,1.1cqw,11px)!important;line-height:1.05!important}
.duel-shell .center-clash{transform:none!important;max-width:min(18cqw,140px)!important;max-height:min(16cqh,120px)!important}
.duel-shell [data-motion-anchor="master"],.duel-shell [data-motion-anchor$="-discard"]{transform:none!important;transform-origin:center!important}

.duel-shell .opponent-panel,.duel-shell .local-panel{transform:none!important;width:var(--mx-hud-w)!important;max-width:var(--mx-hud-w)!important;box-sizing:border-box!important;z-index:80!important}
.duel-shell .opponent-panel{position:absolute!important;top:calc(var(--mx-utility-h) + var(--mx-opponent-hand-h) + var(--mx-gap))!important;left:var(--mx-edge)!important;right:auto!important;bottom:auto!important;transform-origin:top left!important}
.duel-shell .local-panel{position:absolute!important;top:auto!important;left:var(--mx-edge)!important;right:auto!important;bottom:calc(var(--mx-local-hand-h) + var(--mx-gap))!important;transform-origin:bottom left!important}

.duel-shell .mx-quit-match{position:fixed!important;top:max(var(--mx-gap),env(safe-area-inset-top))!important;left:max(var(--mx-edge),env(safe-area-inset-left))!important;right:auto!important;bottom:auto!important;z-index:1300!important;margin:0!important}
.duel-shell .mx-action-timer{position:fixed!important;top:max(var(--mx-gap),env(safe-area-inset-top))!important;left:50%!important;right:auto!important;bottom:auto!important;transform:translateX(-50%)!important;z-index:1300!important;margin:0!important;min-width:clamp(132px,28cqw,190px)!important;height:calc(var(--mx-utility-h) - var(--mx-gap) - var(--mx-gap))!important;min-height:0!important;padding:4px 9px!important}
.duel-shell .mx-action-timer strong{font-size:clamp(22px,4.2cqh,34px)!important}
body:has(.duel-shell) #mx-audio-controls{position:fixed!important;top:max(var(--mx-gap),env(safe-area-inset-top))!important;right:max(var(--mx-edge),env(safe-area-inset-right))!important;left:auto!important;bottom:auto!important;z-index:1400!important;margin:0!important}
body:has(.duel-shell) #mx-audio-controls [data-audio-toggle]{width:calc(var(--mx-utility-h) - var(--mx-gap) - var(--mx-gap))!important;height:calc(var(--mx-utility-h) - var(--mx-gap) - var(--mx-gap))!important;min-width:30px!important;min-height:30px!important}
body:has(.duel-shell) #mx-audio-controls [data-audio-panel]{position:absolute!important;top:calc(100% + 6px)!important;right:0!important;left:auto!important;width:min(240px,72vw)!important;max-width:min(240px,72vw)!important;max-height:min(46dvh,320px)!important;overflow:auto!important}

.duel-shell .mx-responsive-vs-title,.duel-shell .mx-responsive-discard-title,.duel-shell .mx-responsive-effect-title{position:relative!important;display:block!important;z-index:1150!important;box-sizing:border-box!important;max-width:100%!important;margin:0 auto!important;text-align:center!important;white-space:normal!important;line-height:1.05!important}
.duel-shell .mx-responsive-effect-title{position:absolute!important;top:calc(var(--mx-utility-h) + var(--mx-opponent-hand-h) + var(--mx-gap))!important;left:50%!important;transform:translateX(-50%)!important;max-width:min(76cqw,560px)!important;padding:5px 12px!important;pointer-events:none!important}
.duel-shell [class]:has(> .mx-responsive-vs-title),.duel-shell [class]:has(> * > .mx-responsive-vs-title),.duel-shell [class]:has(> .mx-responsive-discard-title),.duel-shell [class]:has(> * > .mx-responsive-discard-title){box-sizing:border-box!important;width:min(760px,calc(100vw - var(--mx-edge) - var(--mx-edge)))!important;max-width:calc(100vw - var(--mx-edge) - var(--mx-edge))!important;max-height:calc(100dvh - var(--mx-edge) - var(--mx-edge))!important;overflow:hidden!important;margin:auto!important;padding:clamp(10px,2cqw,24px)!important}
.duel-shell [class]:has(> .mx-responsive-vs-title)>div,.duel-shell [class]:has(> * > .mx-responsive-vs-title)>div,.duel-shell [class]:has(> .mx-responsive-discard-title)>div,.duel-shell [class]:has(> * > .mx-responsive-discard-title)>div{max-height:calc(100dvh - 126px)!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important}

@container mx-arena (max-aspect-ratio: 3/4){
  .duel-shell{--mx-utility-h:clamp(36px,5.1cqh,44px);--mx-opponent-hand-h:clamp(62px,10.5cqh,92px);--mx-local-hand-h:clamp(158px,24.5cqh,226px);--mx-callout-h:clamp(30px,4.5cqh,38px);--mx-hud-w:clamp(106px,27cqw,150px);--mx-vs-card-w:clamp(70px,min(22cqw,14cqh),112px);--mx-effect-card-w:clamp(40px,min(14cqw,9.5cqh),70px)}
  .duel-shell .opponent-panel,.duel-shell .local-panel{font-size:clamp(8px,2.4cqw,12px)!important}
  .duel-shell .effect-rack{gap:2px!important;padding-inline:2px!important}
  .duel-shell .center-clash{max-width:16cqw!important;max-height:10cqh!important}
  .duel-shell .mx-responsive-effect-title{font-size:clamp(13px,4cqw,19px)!important}
}

@container mx-arena (min-aspect-ratio: 4/3){
  .duel-shell{--mx-utility-h:clamp(38px,6.2cqh,54px);--mx-opponent-hand-h:clamp(56px,11cqh,98px);--mx-local-hand-h:clamp(132px,22cqh,210px);--mx-callout-h:clamp(28px,4.8cqh,42px);--mx-hud-w:clamp(138px,16cqw,240px);--mx-vs-card-w:clamp(88px,min(11cqw,21cqh),168px);--mx-effect-card-w:clamp(52px,min(7cqw,13cqh),96px)}
  .duel-shell .player-hand .hand-card-wrap{height:calc(100% - var(--mx-gap) - var(--mx-gap))!important}
  .duel-shell .center-clash{max-width:min(11cqw,150px)!important;max-height:min(17cqh,130px)!important}
  .duel-shell .mx-responsive-effect-title{font-size:clamp(14px,1.5cqw,22px)!important}
}
`

fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
console.log('Applied one unified responsive Arena system across portrait, tablet, landscape and desktop')
