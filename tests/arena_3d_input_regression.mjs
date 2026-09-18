import fs from 'node:fs'

const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const card=fs.readFileSync('src/game/arena3d/Arena3DCard.tsx','utf8')
const root=fs.readFileSync('src/game/arena3d/Arena3DRoot.tsx','utf8')
const css=fs.readFileSync('src/game/arena3d/arena3d.css','utf8')

must(card.includes('mx3d-hit-target'),'3D cards must expose an oversized touch hit target')
must(card.includes('onPointerDown={handlePointerDown}'),'3D card press handling must be shared by the full hit target')
must(card.includes('onPointerUp={handlePointerUp}'),'3D card release handling must be shared by the full hit target')
must(!card.includes('onPointerOut={() => {\n          press.current = null'),'pointer-out must not cancel an in-progress touch press')
must(root.includes('navigator.maxTouchPoints'),'3D root must prefer navigator touch capability when available')
must(root.includes("'ontouchstart' in window"),'3D root must fall back to touch-event capability for WebKit emulation compatibility')
must(root.includes("'(pointer: coarse), (hover: none)'"),'3D root must fall back to coarse/no-hover media signals when touch APIs are incomplete')
must(root.includes("data-touch-capable={touchCapable?'true':'false'}"),'3D root must expose touch capability to responsive CSS')
must(css.includes('[data-touch-capable="true"] .mx3d-mobile-hand'),'touch-capable devices must always expose the reliable DOM hand fallback')

console.log('PASS Mega X 3D cross-device card input contract')
