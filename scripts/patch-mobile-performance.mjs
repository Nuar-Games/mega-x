import fs from 'node:fs'

const cssPath='src/V24.css'
let css=fs.readFileSync(cssPath,'utf8')
const marker='/* Mobile animation performance contract */'
if(!css.includes(marker)) css += `
${marker}
@media(max-width:560px){
 .start-screen:before,.start-screen:after{display:none!important}
 .mega-coin,.mega-coin>div{backface-visibility:hidden!important;-webkit-backface-visibility:hidden!important}
 .mega-coin.flipping{animation:coinFlipMobile .9s linear infinite!important;will-change:transform!important}
 .mega-coin.flipping>div{box-shadow:inset 0 0 0 3px #f2c960,0 5px 10px #000!important}
 .fight-splash span{filter:none!important;box-shadow:none!important}
}
@keyframes coinFlipMobile{to{transform:translateZ(0) rotateY(1080deg)}}
`
fs.writeFileSync(cssPath,css)
console.log('Applied low-paint coin toss animation for mobile')
