import fs from 'node:fs'

const layout=fs.readFileSync('src/game/arena-next/prototype/ArenaPrototypeLayout.ts','utf8')
const pointers=fs.readFileSync('src/game/arena-next/ArenaPointerTargets.ts','utf8')
const commands=fs.readFileSync('src/game/arena-next/ArenaCommandSurface.ts','utf8')
const scene=fs.readFileSync('src/game/arena-next/prototype/ArenaPrototypeScene.ts','utf8')
const runtime=fs.readFileSync('src/game/arena-next/ArenaNextRuntime.tsx','utf8')
const inspect=fs.readFileSync('src/game/arena-next/ArenaCardInspect.tsx','utf8')
const driver=fs.readFileSync('tests-e2e/helpers/arenaDriver.ts','utf8')
const root=fs.readFileSync('src/root.tsx','utf8')

for(const marker of ['createArenaBoardLayout','localPlayerIndex','opponentPlayerIndex','arenaHandPoint','arenaActionPoint']){
  if(!layout.includes(marker))throw new Error(`arena v2 layout missing: ${marker}`)
}
if(layout.includes('createDesktopPrototypeLayout'))throw new Error('desktop-only arena layout survived v2')
for(const marker of ['createArenaBoardLayout','arenaHandPoint','arenaActionPoint','PLAY_EFFECT']){
  if(!pointers.includes(marker))throw new Error(`pointer targets do not share viewer-relative layout: ${marker}`)
}
if(!commands.includes("case 'PLAY_EFFECT'" )||!commands.includes("const key=`hand:${command.cardId}`")||!commands.includes("kind:'HAND_CARD'"))throw new Error('PLAY_EFFECT must route through the hand-card inspect surface')
if(!driver.includes('playEffectThroughInspect')||!driver.includes("target.action==='PLAY_EFFECT'"))throw new Error('E2E driver must follow PLAY_EFFECT through card inspect')
if(driver.includes("locator('#arena-next-runtime-host canvas').boundingBox()"))throw new Error('E2E driver must use full-screen arena pointer coordinates directly')
for(const marker of ['card.artSrc','/cards/back-game.webp','KAD KAMU','KAD LAWAN','GILIRAN\\nKAMU','setInspectDispatcher','ZON_X','ZON_TEPI']){
  if(!scene.includes(marker))throw new Error(`arena v2 scene missing: ${marker}`)
}
for(const marker of ['ArenaCardInspect','data-arena-board-version="2"','data-local-vs-y','data-opponent-vs-y','data-arena-timer="true"','data-arena-mode','data-arena-version','data-arena-round','data-arena-phase','data-arena-error',"style={{display:'none'}}"]){
  if(!runtime.includes(marker))throw new Error(`arena v2 runtime missing: ${marker}`)
}
if(runtime.includes('ARENA NEXT ·'))throw new Error('arena debug banner survived v2')
for(const marker of ['/cards/inspect/','KAD DI TANGAN','MAIN KAD INI','TUTUP','ZON X','ZON TEPI']){
  if(!inspect.includes(marker))throw new Error(`arena inspect missing: ${marker}`)
}
if(!root.includes('startingPractice.current'))throw new Error('practice double-start guard missing')
console.log('ARENA_BOARD_V2_REGRESSION_PASS')
