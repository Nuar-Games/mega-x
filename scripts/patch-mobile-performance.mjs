import fs from 'node:fs'

const cssPath='src/V24.css'
let css=fs.readFileSync(cssPath,'utf8')
const marker='/* Mobile animation performance contract */'
if(!css.includes(marker)) css += `
${marker}
@media(max-width:560px){
 .start-screen:before,.start-screen:after{pointer-events:none!important}
 .mega-coin{
   contain:none!important;
   transform-style:preserve-3d!important;
   perspective:900px!important;
   backface-visibility:visible!important;
   -webkit-backface-visibility:visible!important;
 }
 .mega-coin>div{
   transform-style:preserve-3d!important;
   backface-visibility:hidden!important;
   -webkit-backface-visibility:hidden!important;
 }
 .mega-coin.flipping{
   animation:coinFlipMobile 1.05s linear infinite!important;
   will-change:transform!important;
 }
 .mega-coin.flipping>div{box-shadow:inset 0 0 0 3px #f2c960,0 5px 10px #000!important}
 .start-screen .digital-card,.start-screen img{
   backface-visibility:hidden!important;
   -webkit-backface-visibility:hidden!important;
   will-change:transform,opacity!important;
 }
 .fight-splash span{filter:none!important;box-shadow:none!important}
}
@keyframes coinFlipMobile{
  0%{transform:translate3d(0,0,0) rotateY(0deg)}
  25%{transform:translate3d(0,-3px,0) rotateY(270deg)}
  50%{transform:translate3d(0,0,0) rotateY(540deg)}
  75%{transform:translate3d(0,-3px,0) rotateY(810deg)}
  100%{transform:translate3d(0,0,0) rotateY(1080deg)}
}
`
fs.writeFileSync(cssPath,css)
console.log('Applied smooth GPU-composited coin and start-screen card motion on mobile')
