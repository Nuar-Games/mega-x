import fs from 'node:fs'
const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
for(const file of ['Arena3DCameraRig.tsx','Arena3DTransitions.ts'])must(fs.existsSync(`src/game/arena3d/${file}`),`missing 3D motion file: ${file}`)
const camera=fs.readFileSync('src/game/arena3d/Arena3DCameraRig.tsx','utf8')
const transitions=fs.readFileSync('src/game/arena3d/Arena3DTransitions.ts','utf8')
for(const mode of ['overview','set-vs','attack','inspect','result'])must(camera.includes(`'${mode}'`),`camera mode missing: ${mode}`)
for(const event of ['draw','set-vs','attack','discard','zon-x','effect','result'])must(transitions.includes(`'${event}'`),`transition event missing: ${event}`)
must(camera.includes('useFrame'),'camera movement must run in the render loop')
must(camera.includes('prefers-reduced-motion'),'camera rig must respect reduced motion')
console.log('PASS cinematic 3D camera and deterministic transition contract')
