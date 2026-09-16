import fs from 'node:fs'

const loader=fs.readFileSync('src/arena-loader.ts','utf8')
const must=(ok,msg)=>{if(!ok)throw new Error(msg)}

must(loader.includes("new URLSearchParams(window.location.search).get('arena')==='clean'"),'clean arena must require explicit ?arena=clean opt-in')
must(loader.includes('if(!cleanArenaOptIn)'),'clean arena loader must bail out when opt-in is absent')
must(loader.includes("document.body.classList.remove('mx-clean-arena-enabled')"),'default arena path must clear clean-renderer presentation state')
must(loader.includes("document.body.classList.add('mx-clean-arena-enabled')"),'opt-in arena path must mark clean-renderer presentation state')

console.log('PASS clean arena is opt-in only and legacy arena remains default')
