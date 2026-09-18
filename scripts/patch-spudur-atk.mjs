import fs from 'node:fs'

const path='src/App.tsx'
let app=fs.readFileSync(path,'utf8')

const oldEntry="{ id: 26, name: 'SPUDUR SI PENENUN KELIRU', atk: 800, def: 600, sta: 5,"
const newEntry="{ id: 26, name: 'SPUDUR SI PENENUN KELIRU', atk: 815, def: 600, sta: 5,"

const first=app.indexOf(oldEntry)
if(first<0)throw new Error('SPUDUR ATK patch anchor missing')
if(app.indexOf(oldEntry,first+1)>=0)throw new Error('SPUDUR ATK patch anchor not unique')
app=app.slice(0,first)+newEntry+app.slice(first+oldEntry.length)
if(!app.includes(newEntry))throw new Error('SPUDUR ATK patch verification failed')

fs.writeFileSync(path,app)
console.log('Patched generated App SPUDUR base ATK 800 -> 815')
