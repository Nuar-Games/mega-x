import fs from 'node:fs'

const scene=fs.readFileSync('src/game/arena/ArenaScene.ts','utf8')
const pool=fs.readFileSync('src/game/arena/ArenaTexturePool.ts','utf8')
const main=fs.readFileSync('src/main.tsx','utf8')
const loader=fs.readFileSync('src/arena-loader.ts','utf8')
const must=(ok,msg)=>{if(!ok)throw new Error(msg)}

must(!scene.includes('ARENA_ASSETS.cards.game.forEach'),'arena entry must not preload all 30 card textures')
must(scene.includes('this.texturePool.preloadState(readArenaRenderState(this.shell))'),'arena must preload only current visible state')
must(scene.includes('this.texturePool.ensureState(next)'),'new state card textures must load on demand')
must(pool.includes("!this.scene.textures.exists(`asset:${src}`)"),'texture pool must skip already-loaded card assets')
must(main.includes("import './arena-loader.ts'"),'arena loader must remain a tiny app-entry bridge')
must(loader.includes("await import('./game/arena/bootstrapArena')"),'Phaser arena runtime must remain dynamically imported only when a duel shell exists')
console.log('PASS clean arena on-demand loading contract')
