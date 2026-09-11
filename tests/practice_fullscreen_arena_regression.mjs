import fs from 'node:fs'

const entry = fs.readFileSync('src/practice-mode.ts', 'utf8')
const css = fs.readFileSync('src/practice-mode.css', 'utf8')
const must = (ok, message) => { if (!ok) throw new Error(message) }

must(entry.includes("classList.add('mx-practice-active')"), 'practice entry must mark the document before entering Arena')
must(css.includes('.mx-practice-active .duel-shell'), 'practice Arena must have a dedicated full-viewport scope')
must(css.includes('position:fixed!important') && css.includes('inset:0!important'), 'practice Arena must replace the lobby viewport instead of appearing below it')
must(css.includes('.mx-practice-active .mx-lobby-shell'), 'lobby must be hidden while the practice Arena is active')

console.log('PASS practice Arena replaces the lobby viewport instead of rendering below it')
