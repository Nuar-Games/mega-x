import fs from 'node:fs'

const path = 'scripts/patch-responsive-arena.mjs'
let source = fs.readFileSync(path, 'utf8')

const start = source.indexOf('function markText(text, className){')
const end = source.indexOf("\nmarkText('PILIH KAD UNTUK DIBUANG'", start)
if (start < 0 || end < 0) throw new Error('responsive arena markText block missing')

const robust = [
  'function markText(text, className){',
  '  if(app.includes(className)) return',
  '  const idx=app.indexOf(text)',
  '  if(idx<0) throw new Error(`responsive arena title text missing: ${text}`)',
  '  const before=app.slice(Math.max(0,idx-800),idx)',
  '  const tags=[...before.matchAll(/<([A-Za-z][\\w.]*)\\b[^<>]*>/g)]',
  '  const last=tags.at(-1)',
  '  if(!last) throw new Error(`responsive arena title element missing: ${text}`)',
  '  const tag=last[0]',
  '  const absolute=Math.max(0,idx-800)+(last.index ?? 0)',
  '  let tagged=tag',
  "  if(/className=\\\"[^\\\"]*\\\"/.test(tag)) tagged=tag.replace(/className=\\\"([^\\\"]*)\\\"/,(_m,c)=>`className=\\\"${c} ${className}\\\"`)",
  "  else if(/className='[^']*'/.test(tag)) tagged=tag.replace(/className='([^']*)'/,(_m,c)=>`className='${c} ${className}'`)",
  "  else tagged=tag.replace(/>$/,` className=\\\"${className}\\\">`)",
  '  app=app.slice(0,absolute)+tagged+app.slice(absolute+tag.length)',
  '}',
].join('\n')

source = source.slice(0, start) + robust + source.slice(end)
fs.writeFileSync(path, source)
console.log('Hardened responsive arena title hook against nested JSX/string titles')
