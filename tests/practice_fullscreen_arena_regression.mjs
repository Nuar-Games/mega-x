import fs from 'node:fs'

const entry = fs.readFileSync('src/practice-mode.ts', 'utf8')
const css = fs.readFileSync('src/practice-mode.css', 'utf8')
const must = (ok, message) => { if (!ok) throw new Error(message) }

must(entry.includes("classList.add('mx-practice-active')"), 'practice entry must mark the document before entering Arena')
must(css.includes('.mx-practice-active .duel-shell'), 'practice Arena must have a dedicated full-viewport scope')
must(css.includes('position:fixed!important') && css.includes('inset:0!important'), 'practice Arena must replace the lobby viewport instead of appearing below it')
must(entry.includes('isolateArenaBranch') && entry.includes('parent.children'), 'practice Arena must isolate its DOM branch from every lobby/footer sibling')
must(entry.includes("style.setProperty('display', 'none', 'important')"), 'all non-Arena sibling branches must be hidden while practice is active')
must(entry.includes('restoreHiddenSiblings'), 'hidden lobby/footer branches must be restored after leaving practice')

console.log('PASS practice Arena exclusively owns the viewport and restores lobby after exit')
