import fs from 'node:fs'
const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const path='src/game/arena3d/Arena3DFX.tsx'
must(fs.existsSync(path),'3D FX system must exist')
const src=fs.readFileSync(path,'utf8')
for(const effect of ['attack-trail','impact-flash','particle-burst','stat-pulse','effect-pulse','phase-transition','result-sequence'])must(src.includes(effect),`missing visible 3D FX: ${effect}`)
must(src.includes('reducedMotion'),'FX must respect reduced motion')
must(src.includes("quality==='low'"),'FX must reduce expensive layers on low quality')
console.log('PASS visible Mega X 3D combat FX contract')
