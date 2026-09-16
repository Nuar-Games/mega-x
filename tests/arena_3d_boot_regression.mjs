import fs from 'node:fs'

const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'))
const loader=fs.readFileSync('src/arena-loader.ts','utf8')
const bootPath='src/game/arena3d/Arena3DBoot.tsx'

for(const dep of ['three','@react-three/fiber','@react-three/drei','@react-three/postprocessing']){
  must(pkg.dependencies?.[dep],`missing 3D runtime dependency: ${dep}`)
}
must(loader.includes("get('arena')==='3d'"),"3D arena must be opt-in via ?arena=3d")
must(loader.includes("import('./game/arena3d/Arena3DBoot')"),"loader must dynamically import the 3D boot module")
must(fs.existsSync(bootPath),'3D boot module must exist')
const boot=fs.readFileSync(bootPath,'utf8')
must(boot.includes('createRoot'),'3D boot must mount through a React root')
must(boot.includes('mountArena3D'),'3D boot must export mountArena3D')
must(boot.includes('return () =>'),'3D boot must return an unmount cleanup')
console.log('PASS opt-in Mega X 3D arena boot contract')
