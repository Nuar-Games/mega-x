import fs from 'node:fs'

const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const factory=fs.readFileSync('src/game/arena-next/prototype/ArenaPrototypeGame.ts','utf8')
const runtime=fs.readFileSync('src/game/arena-next/ArenaNextRuntime.tsx','utf8')
const liveMain=fs.readFileSync('src/game/arena-next/prototype/live-main.ts','utf8')

must(factory.includes('const scene=new ArenaPrototypeScene()'),'arena prototype boot must create and retain the scene instance')
must(factory.includes('scene:[scene]'),'arena prototype boot must register the retained scene instance')
must(factory.includes('return {game,scene}'),'arena prototype boot must return the retained scene instance with the game')

for(const [name,source] of [['ArenaNextRuntime',runtime],['live-main',liveMain]]){
  must(!source.includes(".scene.getScene('arena-prototype')"),`${name} must not synchronously look up the Phaser scene after game construction`)
  must(source.includes('setCommandDispatcher'),`${name} must wire the arena command dispatcher`)
}

console.log('PASS arena-next retained scene boot avoids Phaser startup race')
