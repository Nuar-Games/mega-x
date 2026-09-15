import fs from 'node:fs'

const perf=fs.readFileSync('src/game/arena/ArenaPerformance.ts','utf8')
const boot=fs.readFileSync('src/game/arena/bootstrapArena.ts','utf8')

for(const required of ['hardwareConcurrency','deviceMemory','mxQuality','low','balanced','high']){
  if(!perf.includes(required))throw new Error(`missing performance profile marker: ${required}`)
}
if(!/resolution\s*:\s*profile\.resolution/.test(boot))throw new Error('Phaser resolution is not driven by performance profile')
if(!/antialias\s*:\s*profile\.antialias/.test(boot))throw new Error('antialias is not driven by performance profile')
if(!/fps\s*:\s*\{[^}]*target\s*:\s*profile\.targetFps/s.test(boot))throw new Error('FPS target is not driven by performance profile')
if(!boot.includes('requestFullscreen'))throw new Error('real Fullscreen API request missing')
if(!boot.includes('exitFullscreen'))throw new Error('real Fullscreen API exit missing')
if(!boot.includes("data-mx-fullscreen"))throw new Error('fullscreen control marker missing')

console.log('ARENA_PERFORMANCE_FULLSCREEN_REGRESSION_PASS')
