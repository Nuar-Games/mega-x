import fs from 'node:fs'

const layout=fs.readFileSync('src/game/arena-next/prototype/ArenaPrototypeLayout.ts','utf8')
const pointers=fs.readFileSync('src/game/arena-next/ArenaPointerTargets.ts','utf8')
const scene=fs.readFileSync('src/game/arena-next/prototype/ArenaPrototypeScene.ts','utf8')
const runtime=fs.readFileSync('src/game/arena-next/ArenaNextRuntime.tsx','utf8')
const inspect=fs.readFileSync('src/game/arena-next/ArenaCardInspect.tsx','utf8')
const root=fs.readFileSync('src/root.tsx','utf8')

for(const marker of ['createArenaBoardLayout','localPlayerIndex','opponentPlayerIndex','arenaHandPoint','arenaActionPoint']){
  if(!layout.includes(marker))throw new Error(`arena v2 layout missing: ${marker}`)
}
if(layout.includes('createDesktopPrototypeLayout'))throw new Error('desktop-only arena layout survived v2')
for(const marker of ['createArenaBoardLayout','arenaHandPoint','arenaActionPoint']){
  if(!pointers.includes(marker))throw new Error(`pointer targets do not share viewer-relative layout: ${marker}`)
}
for(const marker of ['card.artSrc','/cards/back-game.webp','KAD KAMU','KAD LAWAN','GILIRAN\\nKAMU','setInspectDispatcher','ZON_X','ZON_TEPI']){
  if(!scene.includes(marker))throw new Error(`arena v2 scene missing: ${marker}`)
}
for(const marker of ['ArenaCardInspect','data-arena-board-version="2"','data-local-vs-y','data-opponent-vs-y','data-arena-timer="true"',"style={{display:'none'}}"]){
  if(!runtime.includes(marker))throw new Error(`arena v2 runtime missing: ${marker}`)
}
for(const marker of ['/cards/inspect/','KAD DI TANGAN','MAIN KAD INI','TUTUP','ZON X','ZON TEPI']){
  if(!inspect.includes(marker))throw new Error(`arena inspect missing: ${marker}`)
}
if(!root.includes('startingPractice.current'))throw new Error('practice double-start guard missing')
console.log('ARENA_BOARD_V2_REGRESSION_PASS')
