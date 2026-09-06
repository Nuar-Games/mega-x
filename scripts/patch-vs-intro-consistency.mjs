import fs from 'node:fs'

const path = 'src/VsIntro.css'
const hypePath = 'src/VsIntroHype.css'
let css = fs.readFileSync(path, 'utf8')
let hype = fs.readFileSync(hypePath, 'utf8')

const replacements = [
  ['mobile fighter-name size override', '.mx-vs-name{width:39vw;max-width:39vw;font-size:clamp(1.45rem,4.8vw,2.55rem);line-height:.88;letter-spacing:-.025em}', '.mx-vs-name{width:39vw;max-width:39vw;line-height:.88;letter-spacing:-.025em}'],
  ['mobile VS letter size override', '.mx-vs-mark span{font-size:clamp(4.8rem,19vw,8.1rem)}', ''],
  ['mobile VS slash height override', '.mx-vs-mark i{height:clamp(88px,20vw,138px)}', ''],
]

for (const [label, from, to] of replacements) {
  if (!css.includes(from)) throw new Error(`VS intro consistency patch missing: ${label}`)
  css = css.replace(from, to)
}

const brightnessMarker = '/* VS seam brightness lock */'
if (!hype.includes(brightnessMarker)) {
  hype += `\n${brightnessMarker}\n.mx-vs-seam{filter:brightness(1.95) drop-shadow(0 0 11px #fff) drop-shadow(0 0 24px rgba(255,244,188,1)) drop-shadow(-13px 0 30px rgba(255,43,64,1)) drop-shadow(13px 0 30px rgba(48,183,255,1))!important}\n.mx-vs-seam::before{filter:brightness(4.8)!important;box-shadow:0 0 36px #fff,0 0 90px rgba(255,235,128,1),-17px 0 58px rgba(255,43,64,1),17px 0 58px rgba(48,183,255,1)!important}\n.mx-vs-seam::after{filter:brightness(4.2) blur(.25px)!important;box-shadow:0 0 24px #fff,0 0 58px rgba(255,229,102,1)!important}\n.mx-vs-seam span{filter:brightness(5)!important;box-shadow:0 0 42px #fff,0 0 110px rgba(255,232,112,1),-22px 0 68px rgba(255,43,64,.95),22px 0 68px rgba(48,183,255,1)!important}\n`
}

const androidStabilityMarker = '/* Android VS intro compositor stability */'
if (!hype.includes(androidStabilityMarker)) {
  hype += `\n${androidStabilityMarker}\n@media(max-width:760px){\n  .mx-vs-half{will-change:transform,background-position!important;filter:none!important}\n  .mx-vs-half::before{mix-blend-mode:normal!important;opacity:.42!important}\n  .mx-vs-flash-grid{mix-blend-mode:normal!important;opacity:.10!important;animation-duration:.28s!important}\n  .mx-vs-noise{display:none!important}\n  .mx-vs-card{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;will-change:transform,opacity!important;background:linear-gradient(110deg,rgba(7,9,15,.96),rgba(12,15,26,.90) 58%,rgba(7,8,14,.78))!important}\n  .mx-vs-seam{filter:none!important;will-change:transform,opacity!important;box-shadow:0 0 12px rgba(255,255,255,.95),-9px 0 24px rgba(255,43,64,.82),9px 0 24px rgba(48,183,255,.88)!important}\n  .mx-vs-seam::before{mix-blend-mode:normal!important;filter:none!important;box-shadow:0 0 24px #fff,0 0 54px rgba(255,224,94,.86),-10px 0 34px rgba(255,43,64,.72),10px 0 34px rgba(48,183,255,.78)!important}\n  .mx-vs-seam::after{mix-blend-mode:normal!important;filter:none!important;box-shadow:0 0 16px #fff,0 0 32px rgba(255,224,94,.72)!important}\n  .mx-vs-seam span{mix-blend-mode:normal!important;filter:none!important;box-shadow:0 0 24px #fff,0 0 58px rgba(255,226,100,.84),-14px 0 38px rgba(255,43,64,.62),14px 0 38px rgba(48,183,255,.70)!important}\n}\n`
}

fs.writeFileSync(path, css)
fs.writeFileSync(hypePath, hype)
console.log('Applied continuous VS intro sizing, bright seam energy, and Android compositor stability guard')
