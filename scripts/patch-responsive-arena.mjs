import fs from 'node:fs'

const appPath='src/App.tsx'
const cssPath='src/V24.css'
let app=fs.readFileSync(appPath,'utf8')
let css=fs.readFileSync(cssPath,'utf8')

function markText(text, className){
  if(app.includes(className)) return
  const needle=`>${text}<`
  if(!app.includes(needle)) throw new Error(`responsive arena hook target missing: ${text}`)
  app=app.replace(needle,`><span className="${className}">${text}</span><`)
}
markText('PILIH KAD UNTUK DIBUANG','mx-responsive-discard-title')
markText('PILIH KAD VS','mx-responsive-vs-title')

const marker='/* Responsive arena viewport contract */'
if(!css.includes(marker)) css += `
${marker}
.duel-shell{width:100%!important;max-width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-height:100dvh!important;overflow:hidden!important;overscroll-behavior:none!important}
.duel-shell .duel-arena{width:100%!important;max-width:100vw!important;height:100%!important;min-height:0!important;max-height:100dvh!important;overflow:hidden!important}
.duel-shell .battlefield{max-width:100%!important;max-height:calc(100dvh - 178px)!important;overflow:hidden!important}
.duel-shell .battlefield .zone-card-button,.duel-shell .battlefield .motion-card-fx{max-width:100%!important;max-height:100%!important;min-width:0!important;min-height:0!important}
.duel-shell .battlefield .zone-card-button .digital-card,.duel-shell .battlefield .motion-card-fx .digital-card{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:100%!important;object-fit:contain!important}
.duel-shell .hand-area{box-sizing:border-box!important;max-width:100vw!important;max-height:clamp(118px,22dvh,190px)!important;overflow:hidden!important;padding-bottom:max(8px,env(safe-area-inset-bottom))!important}
.duel-shell .hand-scroll{max-width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;overscroll-behavior-x:contain!important;touch-action:pan-x!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:thin!important}
.duel-shell .hand-card-wrap{min-width:0!important;max-width:150px!important;overflow:hidden!important}
.duel-shell .hand-card-wrap .digital-card{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:100%!important;object-fit:contain!important}
.duel-shell .mx-quit-match{position:fixed!important;left:max(8px,env(safe-area-inset-left))!important;right:auto!important;top:max(8px,env(safe-area-inset-top))!important;z-index:1200!important;display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
.duel-shell [class]:has(> .mx-responsive-discard-title),.duel-shell [class]:has(> * > .mx-responsive-discard-title){box-sizing:border-box!important;width:min(760px,calc(100vw - 24px))!important;max-width:calc(100vw - 24px)!important;max-height:calc(100dvh - 24px)!important;overflow:hidden!important;margin:auto!important;padding:clamp(14px,2.4vw,28px)!important}
.duel-shell [class]:has(> .mx-responsive-discard-title) .digital-card,.duel-shell [class]:has(> * > .mx-responsive-discard-title) .digital-card{display:block!important;width:auto!important;max-width:min(280px,70vw)!important;height:auto!important;max-height:min(42dvh,390px)!important;object-fit:contain!important;margin-inline:auto!important}
.duel-shell [class]:has(> .mx-responsive-discard-title)>div,.duel-shell [class]:has(> * > .mx-responsive-discard-title)>div{max-height:calc(100dvh - 150px)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important}
.duel-shell .mx-responsive-discard-title{display:block!important;line-height:1.05!important}
.duel-shell [class]:has(> .mx-responsive-vs-title),.duel-shell [class]:has(> * > .mx-responsive-vs-title){box-sizing:border-box!important;width:min(760px,calc(100vw - 24px))!important;max-width:calc(100vw - 24px)!important;max-height:calc(100dvh - 24px)!important;overflow:hidden!important;margin:auto!important;padding:clamp(12px,2vw,24px)!important}
.duel-shell [class]:has(> .mx-responsive-vs-title)>div,.duel-shell [class]:has(> * > .mx-responsive-vs-title)>div{max-height:calc(100dvh - 132px)!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important}
.duel-shell [class]:has(> .mx-responsive-vs-title) .digital-card,.duel-shell [class]:has(> * > .mx-responsive-vs-title) .digital-card{display:block!important;width:auto!important;max-width:min(250px,62vw)!important;height:auto!important;max-height:min(38dvh,350px)!important;object-fit:contain!important;margin-inline:auto!important}
.duel-shell .mx-responsive-vs-title{display:block!important;white-space:nowrap!important;font-size:clamp(20px,4vw,38px)!important;line-height:1!important}
@media(max-width:900px){
 .duel-shell .battlefield{top:clamp(68px,9dvh,92px)!important;bottom:clamp(120px,20dvh,166px)!important;left:8px!important;right:8px!important;max-height:none!important}
 .duel-shell .opponent-panel{top:clamp(72px,9.5dvh,96px)!important;left:8px!important}
 .duel-shell .local-panel{bottom:clamp(126px,20dvh,172px)!important;left:8px!important}
 .duel-shell .hand-area{padding:7px 7px max(7px,env(safe-area-inset-bottom))!important;max-height:clamp(112px,20dvh,166px)!important}
 .duel-shell .hand-card-wrap{flex:0 0 clamp(76px,15vw,122px)!important;width:clamp(76px,15vw,122px)!important;max-width:122px!important}
 .duel-shell [class]:has(> .mx-responsive-discard-title),.duel-shell [class]:has(> * > .mx-responsive-discard-title),.duel-shell [class]:has(> .mx-responsive-vs-title),.duel-shell [class]:has(> * > .mx-responsive-vs-title){width:calc(100vw - 20px)!important;max-width:calc(100vw - 20px)!important;max-height:calc(100dvh - 20px)!important;padding:14px 10px!important}
 .duel-shell [class]:has(> .mx-responsive-discard-title) .digital-card,.duel-shell [class]:has(> * > .mx-responsive-discard-title) .digital-card,.duel-shell [class]:has(> .mx-responsive-vs-title) .digital-card,.duel-shell [class]:has(> * > .mx-responsive-vs-title) .digital-card{max-width:min(205px,58vw)!important;max-height:34dvh!important}
 .duel-shell [class]:has(> .mx-responsive-discard-title)>div,.duel-shell [class]:has(> * > .mx-responsive-discard-title)>div,.duel-shell [class]:has(> .mx-responsive-vs-title)>div,.duel-shell [class]:has(> * > .mx-responsive-vs-title)>div{max-height:calc(100dvh - 132px)!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important}
 .duel-shell .mx-responsive-discard-title{font-size:clamp(24px,7vw,38px)!important}
 .duel-shell .mx-responsive-vs-title{font-size:clamp(22px,6.5vw,34px)!important}
 .duel-shell .mx-quit-match{font-size:10px!important;padding:7px 9px!important;min-height:34px!important}
}
@media(min-width:901px){
 .duel-shell .hand-card-wrap{flex:0 0 clamp(100px,8vw,150px)!important;width:clamp(100px,8vw,150px)!important}
}
`

const phoneContract='/* Authoritative phone-first arena contract */'
if(!css.includes(phoneContract)) css += `
${phoneContract}
@media(max-width:560px){
 .duel-shell{height:100dvh!important;min-height:100dvh!important;max-height:100dvh!important;overflow:hidden!important}
 .duel-shell .battlefield{top:56px!important;bottom:214px!important;left:3px!important;right:3px!important;max-height:none!important}
 .duel-shell .arena-wrap{width:100%!important;height:100%!important;padding:2px!important;overflow:hidden!important}
 .duel-shell .arena{width:100%!important;height:100%!important;max-width:100%!important;aspect-ratio:auto!important}
 .duel-shell .vs-inspect-button{width:100%!important;max-width:100%!important;height:auto!important;aspect-ratio:.68!important}
 .duel-shell .v9-vs-card{min-width:0!important;overflow:hidden!important}
 .duel-shell .battlefield .zone-card-button,.duel-shell .battlefield .motion-card-fx{min-width:0!important;width:auto!important;max-width:100%!important}
 .duel-shell .effect-card-slot .zone-card-button{width:100%!important;height:auto!important;max-height:92%!important;aspect-ratio:.68!important}
 .duel-shell .opponent-panel{top:58px!important;left:5px!important;max-width:34vw!important;transform:scale(.9)!important;transform-origin:top left!important}
 .duel-shell .local-panel{bottom:218px!important;left:5px!important;max-width:34vw!important;transform:scale(.9)!important;transform-origin:bottom left!important}
 .duel-shell .hand-area{height:210px!important;min-height:210px!important;max-height:210px!important;padding:5px 4px max(7px,env(safe-area-inset-bottom))!important;overflow:hidden!important}
 .duel-shell .hand-scroll,.duel-shell .hand-fan{height:100%!important;max-width:100%!important;justify-content:flex-start!important;align-items:flex-end!important;gap:0!important;overflow-x:auto!important;overflow-y:hidden!important;touch-action:pan-x!important;-webkit-overflow-scrolling:touch!important;padding:0 6px 8px!important}
 .duel-shell .player-hand .hand-card-wrap{height:176px!important;width:auto!important;max-width:none!important;min-width:0!important;flex:0 0 auto!important;margin-left:-26px!important;overflow:visible!important}
 .duel-shell .player-hand .hand-card-wrap:first-child{margin-left:0!important}
 .duel-shell .player-hand .hand-card-wrap .digital-card{height:100%!important;width:auto!important;max-width:none!important;aspect-ratio:.68!important}
 .duel-shell .action-bar button,.duel-shell .selected-card-actions button{min-height:42px!important;font-size:12px!important}
 .duel-shell .mx-action-timer{bottom:218px!important}
 .mega-coin{will-change:transform!important;contain:layout paint style!important;transform:translateZ(0)}
 .mega-coin.flipping>div{box-shadow:inset 0 0 0 4px #f2c960,0 8px 16px #000!important}
 .fight-splash span{text-shadow:5px 5px 0 #d51923,-3px -3px 0 #168dff!important}
}
`

fs.writeFileSync(appPath,app)
fs.writeFileSync(cssPath,css)
console.log('Bound arena and phone-first layout to responsive viewport')
