import fs from 'node:fs'
const source=fs.readFileSync('src/game/arena/ArenaLayout.ts','utf8')
const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
for (const token of ['412','915','1366','1920']) void token
must(source.includes("mode:'portrait'")&&source.includes("mode:'wide'"),'Portrait and wide layouts are required')
for (const region of ['opponent','opponentHand','combat','localHand','deck','discard','effectLeft','effectRight','zonXLeft','zonXRight','hud','prompt']) {
  must(source.includes(`${region}:`),`Missing arena region: ${region}`)
}
must(!source.includes('780')&&!source.includes('1110'),'New arena must not inherit the fixed 780x1110 board')
const portraitHand=Number(source.match(/localHandH=h\*([0-9.]+)/)?.[1]||0)
const wideHand=Number(source.match(/const handH=h\*([0-9.]+)/)?.[1]||0)
must(portraitHand>=0.20&&wideHand>=0.20,'Local hand must retain at least one fifth of the live viewport')
must(source.includes('combatH')&&source.includes('arenaH'),'Combat region must scale from live viewport')
must(source.includes('promptH=h*0.10'),'Action/prompt band must reserve dedicated space outside the hand')

// Desktop must read like a card battle: opponent hand across the top, player hand across the bottom,
// with an explicit right-side tactical command rail instead of squeezing controls into the battlefield.
const wideOpponentHand=Number(source.match(/const opponentHandH=h\*([0-9.]+)/)?.[1]||0)
must(wideOpponentHand>=0.09,'Wide layout must reserve a dedicated top opponent-hand band')
must(source.includes('const commandRail=Math.max(260,w*0.18)'),'Wide layout must reserve a dedicated tactical command rail')
must(source.includes('const playableW=w-pad*2-commandRail'),'Battlefield width must exclude the tactical command rail')
must(source.includes('opponentHand:rect(pad+side,arenaY,playableW-side*2,opponentHandH)'),'Wide opponent hand must span the top center instead of sitting in a side column')
must(source.includes('const combatY=arenaY+opponentHandH'),'Wide combat stage must begin below the opponent hand')
must(source.includes('localHand:rect(pad,h-handH-pad,playableW,handH)'),'Player hand must remain centered inside the playable battlefield width')

console.log('PASS clean arena viewport-native tactical layout contract')
