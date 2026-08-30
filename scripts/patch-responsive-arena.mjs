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

fs.writeFileSync(appPath,app)
fs.writeFileSync(cssPath,css)
console.log('Bound arena, hand, discard chooser, VS chooser and surrender control to responsive viewport')

const mobileMarker='/* Mobile-first arena usability override */'
if(!css.includes(mobileMarker)) css += `
${mobileMarker}
@media(max-width:560px){
 .duel-shell .battlefield{top:58px!important;bottom:188px!important;left:4px!important;right:4px!important}
 .duel-shell .hand-area{height:184px!important;max-height:184px!important;padding:5px 4px max(5px,env(safe-area-inset-bottom))!important}
 .duel-shell .hand-scroll{height:100%!important;align-items:flex-end!important;gap:4px!important}
 .duel-shell .hand-card-wrap{flex:0 0 clamp(92px,23vw,118px)!important;width:clamp(92px,23vw,118px)!important;max-width:118px!important}
 .duel-shell .opponent-panel{top:60px!important;left:5px!important;transform:scale(.92)!important;transform-origin:top left!important}
 .duel-shell .local-panel{bottom:192px!important;left:5px!important;transform:scale(.92)!important;transform-origin:bottom left!important}
 .duel-shell .battlefield .zone-card-button,.duel-shell .battlefield .motion-card-fx{min-width:clamp(72px,19vw,102px)!important;width:clamp(72px,19vw,102px)!important}
 .duel-shell .battlefield .zone-card-button .digital-card,.duel-shell .battlefield .motion-card-fx .digital-card{width:100%!important;height:auto!important}
}
`
fs.writeFileSync(cssPath,css)

const phoneReflow='/* Mobile phone arena reflow v2 */'
if(!css.includes(phoneReflow)) css += `
${phoneReflow}
@media(max-width:560px){
 .duel-shell{height:100dvh!important;min-height:100dvh!important}
 .duel-shell .battlefield{top:52px!important;bottom:210px!important;left:2px!important;right:2px!important}
 .duel-shell .hand-area{height:206px!important;max-height:206px!important;min-height:206px!important}
 .duel-shell .hand-scroll{justify-content:flex-start!important;overflow-x:auto!important}
 .duel-shell .hand-card-wrap{flex:0 0 min(27vw,124px)!important;width:min(27vw,124px)!important;max-width:124px!important}
 .duel-shell .battlefield .zone-card-button,.duel-shell .battlefield .motion-card-fx{width:min(22vw,108px)!important;min-width:min(22vw,108px)!important;max-width:108px!important}
 .duel-shell .opponent-panel{top:54px!important;max-width:30vw!important}
 .duel-shell .local-panel{bottom:212px!important;max-width:30vw!important}
}
`
fs.writeFileSync(cssPath,css)
