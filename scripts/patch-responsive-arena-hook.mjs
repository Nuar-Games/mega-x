import fs from 'node:fs'

const path = 'scripts/patch-responsive-arena.mjs'
let source = fs.readFileSync(path, 'utf8')

const start = source.indexOf('function markText(text, className){')
const end = source.indexOf("\nmarkText('PILIH KAD UNTUK DIBUANG'", start)
if (start < 0 || end < 0) throw new Error('responsive arena markText block missing')

const robust = [
  'function markText(text, className){',
  '  if(app.includes(className)) return',
  "  const escaped=text.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')",
  "  const rx=new RegExp('>\\\\s*'+escaped+'\\\\s*<')",
  '  if(!rx.test(app)) return',
  "  app=app.replace(rx,'><span className=\\\"'+className+'\\\">'+text+'</span><')",
  '}',
].join('\n')

source = source.slice(0, start) + robust + source.slice(end)
fs.writeFileSync(path, source)
console.log('Hardened responsive arena title hook for recovered JSX formatting')
