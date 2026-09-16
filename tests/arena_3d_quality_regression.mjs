import fs from 'node:fs'
const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const path='src/game/arena3d/Arena3DQuality.ts'
must(fs.existsSync(path),'3D quality profile module must exist')
const src=fs.readFileSync(path,'utf8')
for(const name of ['high','medium','low'])must(src.includes(`${name}:`),`missing quality profile: ${name}`)
must(src.includes('dpr:1.75'),'high quality DPR must cap at 1.75')
must(src.includes('dpr:1.25'),'medium quality DPR must cap at 1.25')
must(src.includes('dpr:1'),'low quality DPR must be 1.0')
must(src.includes('bloom:false'),'low quality must disable bloom')
must(src.includes('chooseArena3DQuality'),'quality module must expose device heuristic selection')
console.log('PASS scalable Mega X 3D quality profile contract')
