import fs from 'node:fs'

const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const files=['Arena3DRoot.tsx','Arena3DScene.tsx','Arena3DTable.tsx','Arena3DCard.tsx','Arena3DZones.tsx','Arena3DHUD.tsx','arena3d.css']
for(const file of files)must(fs.existsSync(`src/game/arena3d/${file}`),`missing Gate 1 3D file: ${file}`)
const root=fs.readFileSync('src/game/arena3d/Arena3DRoot.tsx','utf8')
const scene=fs.readFileSync('src/game/arena3d/Arena3DScene.tsx','utf8')
const card=fs.readFileSync('src/game/arena3d/Arena3DCard.tsx','utf8')
const hud=fs.readFileSync('src/game/arena3d/Arena3DHUD.tsx','utf8')
must(root.includes('Canvas'),'3D root must own a React Three Fiber Canvas')
must(scene.includes('PerspectiveCamera'),'3D scene must use perspective camera framing')
must(card.includes('useTexture'),'3D cards must use real game texture URLs')
must(card.includes('card.actionId'),'3D card clicks must honor primary authoritative actions')
must(hud.includes('state.prompt'),'HUD must show the current gameplay prompt')
must(hud.includes('state.legalActions'),'HUD must render authoritative legal commands')
must(hud.includes('requestFullscreen'),'HUD must expose fullscreen control')
console.log('PASS Gate 1 Mega X perspective 3D arena shell contract')
