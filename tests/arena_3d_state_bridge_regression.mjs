import fs from 'node:fs'

const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const path='src/game/arena3d/Arena3DStateBridge.ts'
must(fs.existsSync(path),'3D state bridge must exist')
const src=fs.readFileSync(path,'utf8')
must(src.includes("readArenaRenderState"),'3D bridge must reuse the existing normalized arena state')
must(src.includes('data-arena-action-id'),'3D dispatch must use authoritative action ids')
must(src.includes('button.click()'),'3D dispatch must invoke the existing game control')
must(src.includes('button.disabled'),'disabled authoritative controls must never dispatch')
must(src.includes('MutationObserver'),'3D state bridge must subscribe to authoritative DOM changes')
must(src.includes('requestAnimationFrame'),'state refresh must be coalesced instead of firing on every mutation')
console.log('PASS authoritative Mega X 3D state/action bridge contract')
