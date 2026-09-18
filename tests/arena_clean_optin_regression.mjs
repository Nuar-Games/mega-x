import fs from 'node:fs'

const loader=fs.readFileSync('src/arena-loader.ts','utf8')
const must=(ok,msg)=>{if(!ok)throw new Error(msg)}

must(loader.includes("const initialArenaMode=new URLSearchParams(window.location.search).get('arena')"),'arena loader must capture the requested initial arena mode')
must(loader.includes("return liveMode ?? initialArenaMode ?? '3d'"),'3D arena must be the default when no arena mode is requested')
must(loader.includes("if(mode==='3d')"),'3D arena must have an explicit loader path')
must(loader.includes("if(mode!=='clean')"),'clean arena must remain explicit opt-in rather than becoming the fallback default')
must(loader.includes("document.body.classList.remove('mx-clean-arena-enabled')"),'leaving clean mode must clear clean-renderer presentation state')
must(loader.includes("document.body.classList.add('mx-clean-arena-enabled')"),'explicit clean mode must mark clean-renderer presentation state')
must(loader.includes("document.body.classList.remove('mx-arena-3d-enabled')"),'leaving 3D mode must clear 3D presentation state')

console.log('PASS 3D arena is default and clean arena remains explicit opt-in')
