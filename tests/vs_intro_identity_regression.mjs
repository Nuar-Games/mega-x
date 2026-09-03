import fs from 'node:fs'

const css = fs.readFileSync('src/VsIntro.css', 'utf8')

const required = [
  ['single-line fighter names', '.mx-vs-name{', 'white-space:nowrap'],
  ['left champagne identity', '.mx-vs-name-p1', '#ffe3a1'],
  ['right rose-gold identity', '.mx-vs-name-p2', '#f3a6a0'],
  ['strong VS condensed face', '.mx-vs-mark span', 'font-family:"Arial Narrow",Impact,"Barlow Condensed",sans-serif'],
  ['strong VS angular treatment', '.mx-vs-mark span', 'scaleX(.82)'],
]

for (const [label, selector, token] of required) {
  const start = css.indexOf(selector)
  if (start < 0 || css.slice(start, start + 1400).indexOf(token) < 0) {
    throw new Error(`VS intro regression failed: ${label}`)
  }
}

if (/\.mx-vs-name\{[^}]*color:#fff/.test(css)) {
  throw new Error('VS intro regression failed: fighter names still use generic white')
}

const mobileStart = css.indexOf('@media(max-width:760px)')
const mobileEnd = css.indexOf('@media(prefers-reduced-motion:reduce)', mobileStart)
const mobile = mobileStart >= 0 ? css.slice(mobileStart, mobileEnd >= 0 ? mobileEnd : css.length) : ''
if (/\.mx-vs-name\{[^}]*font-size:/.test(mobile)) {
  throw new Error('VS intro regression failed: mobile breakpoint changes fighter-name size abruptly')
}
if (/\.mx-vs-mark span\{[^}]*font-size:/.test(mobile)) {
  throw new Error('VS intro regression failed: mobile breakpoint changes VS size abruptly')
}
if (/\.mx-vs-mark i\{[^}]*height:/.test(mobile)) {
  throw new Error('VS intro regression failed: mobile breakpoint changes VS slash height abruptly')
}

console.log('PASS VS intro fighter identity colors, single-line fit, strong VS mark, and continuous sizing across breakpoints')
