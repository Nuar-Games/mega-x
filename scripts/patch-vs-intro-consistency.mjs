import fs from 'node:fs'

const path = 'src/VsIntro.css'
let css = fs.readFileSync(path, 'utf8')

const replacements = [
  ['mobile fighter-name size override', '.mx-vs-name{width:39vw;max-width:39vw;font-size:clamp(1.45rem,4.8vw,2.55rem);line-height:.88;letter-spacing:-.025em}', '.mx-vs-name{width:39vw;max-width:39vw;line-height:.88;letter-spacing:-.025em}'],
  ['mobile VS letter size override', '.mx-vs-mark span{font-size:clamp(4.8rem,19vw,8.1rem)}', ''],
  ['mobile VS slash height override', '.mx-vs-mark i{height:clamp(88px,20vw,138px)}', ''],
]

for (const [label, from, to] of replacements) {
  if (!css.includes(from)) throw new Error(`VS intro consistency patch missing: ${label}`)
  css = css.replace(from, to)
}

fs.writeFileSync(path, css)
console.log('Applied continuous VS intro sizing across the 760px breakpoint')
