import fs from 'node:fs'

const cssPath='src/V24.css'
let css=fs.readFileSync(cssPath,'utf8')
const marker='/* Phone arena geometry v2 */'
if(!css.includes(marker)) css += `
${marker}
@media(max-width:560px) and (orientation:portrait){
  .duel-shell{
    width:100vw!important;
    height:100dvh!important;
    min-height:100dvh!important;
    max-height:100dvh!important;
    overflow:hidden!important;
  }

  /* Reserve a real bottom hand tray, then give every remaining pixel to play. */
  .duel-shell .hand-area{
    position:absolute!important;
    left:0!important;
    right:0!important;
    bottom:0!important;
    height:clamp(190px,24dvh,214px)!important;
    min-height:clamp(190px,24dvh,214px)!important;
    max-height:clamp(190px,24dvh,214px)!important;
    box-sizing:border-box!important;
    overflow:hidden!important;
    padding:4px 4px max(7px,env(safe-area-inset-bottom))!important;
  }
  .duel-shell .player-hand{
    height:100%!important;
    min-height:0!important;
    max-height:100%!important;
  }
  .duel-shell .hand-scroll{
    width:100%!important;
    max-width:100%!important;
    height:100%!important;
    overflow-x:auto!important;
    overflow-y:hidden!important;
    touch-action:pan-x!important;
    -webkit-overflow-scrolling:touch!important;
  }
  .duel-shell .hand-fan{
    width:max-content!important;
    min-width:100%!important;
    height:100%!important;
    display:flex!important;
    justify-content:flex-start!important;
    align-items:flex-end!important;
    gap:0!important;
    padding:0 8px 6px!important;
    box-sizing:border-box!important;
    overflow:visible!important;
  }
  .duel-shell .player-hand .hand-card-wrap{
    flex:0 0 auto!important;
    width:auto!important;
    min-width:0!important;
    max-width:none!important;
    height:clamp(176px,21.5dvh,194px)!important;
    margin-left:-24px!important;
    transform:none!important;
    overflow:visible!important;
  }
  .duel-shell .player-hand .hand-card-wrap:first-child{margin-left:0!important}
  .duel-shell .player-hand .hand-card-wrap .digital-card{
    display:block!important;
    width:auto!important;
    max-width:none!important;
    height:100%!important;
    max-height:100%!important;
    aspect-ratio:420/595!important;
    object-fit:contain!important;
  }

  /* Battlefield ends exactly where the hand begins. No dead black strip. */
  .duel-shell .battlefield{
    top:52px!important;
    bottom:clamp(194px,24.5dvh,218px)!important;
    left:3px!important;
    right:3px!important;
    width:auto!important;
    max-width:none!important;
    height:auto!important;
    max-height:none!important;
    overflow:hidden!important;
  }
  .duel-shell .arena-wrap{
    width:100%!important;
    height:100%!important;
    min-height:0!important;
    padding:2px!important;
    box-sizing:border-box!important;
    overflow:hidden!important;
  }
  .duel-shell .arena{
    width:100%!important;
    max-width:100%!important;
    height:100%!important;
    max-height:100%!important;
    min-height:0!important;
    aspect-ratio:auto!important;
  }

  /* A VS card may use its cell, never spill into the opposing VS cell. */
  .duel-shell .v9-vs-card{
    min-width:0!important;
    max-width:100%!important;
    overflow:hidden!important;
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
  }
  .duel-shell .v9-vs-card .vs-inspect-button,
  .duel-shell .vs-inspect-button{
    box-sizing:border-box!important;
    width:min(25vw,106px)!important;
    max-width:100%!important;
    height:auto!important;
    max-height:44%!important;
    margin-inline:auto!important;
    aspect-ratio:420/595!important;
    overflow:hidden!important;
  }
  .duel-shell .vs-inspect-button .digital-card{
    width:100%!important;
    height:100%!important;
    max-width:100%!important;
    max-height:100%!important;
    object-fit:contain!important;
  }
  .duel-shell .effect-card-slot{
    min-width:0!important;
    min-height:0!important;
    overflow:hidden!important;
  }
  .duel-shell .effect-card-slot .zone-card-button{
    width:100%!important;
    max-width:100%!important;
    height:100%!important;
    max-height:100%!important;
    aspect-ratio:auto!important;
    overflow:hidden!important;
  }
  .duel-shell .effect-card-slot .digital-card{
    width:100%!important;
    height:auto!important;
    max-width:100%!important;
    max-height:100%!important;
    object-fit:contain!important;
  }

  /* HUD belongs outside card geometry. */
  .duel-shell .opponent-panel{
    top:54px!important;
    left:5px!important;
    bottom:auto!important;
    max-width:31vw!important;
    transform:scale(.84)!important;
    transform-origin:top left!important;
  }
  .duel-shell .local-panel{
    top:auto!important;
    bottom:clamp(198px,25dvh,222px)!important;
    left:5px!important;
    max-width:31vw!important;
    transform:scale(.84)!important;
    transform-origin:bottom left!important;
  }
  .duel-shell .mx-action-timer{
    top:max(4px,env(safe-area-inset-top))!important;
    right:5px!important;
    bottom:auto!important;
    left:auto!important;
    transform:none!important;
  }

  .duel-shell .action-bar button,
  .duel-shell .selected-card-actions button{
    min-height:44px!important;
    font-size:12px!important;
    touch-action:manipulation!important;
  }
}
`
fs.writeFileSync(cssPath,css)
console.log('Applied phone arena geometry v2: separated VS cells, full-height battlefield, readable hand tray')
