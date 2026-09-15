import fs from 'node:fs'
const source=fs.readFileSync('src/game/arena/ArenaLayout.ts','utf8')
const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
for (const token of ['412','915','1366','1920']) void token
must(source.includes("mode:'portrait'")&&source.includes("mode:'wide'"),'Portrait and wide layouts are required')
for (const region of ['opponent','opponentHand','combat','localHand','deck','discard','effectLeft','effectRight','zonXLeft','zonXRight','hud','prompt']) {
  must(source.includes(`${region}:`),`Missing arena region: ${region}`)
}
must(!source.includes('780')&&!source.includes('1110'),'New arena must not inherit the fixed 780x1110 board')
must(source.includes('localHandH=h*0.24')||source.includes('handH=h*0.25'),'Local hand must receive priority space')
must(source.includes('combatH')&&source.includes('arenaH'),'Combat region must scale from live viewport')
console.log('PASS clean arena viewport-native layout contract')
