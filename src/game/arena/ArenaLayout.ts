export type ArenaRect = { x:number; y:number; width:number; height:number }
export type ArenaLayoutSnapshot = {
  width:number
  height:number
  mode:'portrait'|'wide'
  opponent:ArenaRect
  opponentHand:ArenaRect
  combat:ArenaRect
  localHand:ArenaRect
  deck:ArenaRect
  discard:ArenaRect
  effectLeft:ArenaRect
  effectRight:ArenaRect
  zonXLeft:ArenaRect
  zonXRight:ArenaRect
  hud:ArenaRect
  prompt:ArenaRect
}

const rect=(x:number,y:number,width:number,height:number):ArenaRect=>({x,y,width,height})

export function computeArenaLayout(width:number,height:number):ArenaLayoutSnapshot {
  const w=Math.max(320,width)
  const h=Math.max(480,height)
  const portrait=h/w>=1.15
  const pad=Math.max(8,Math.min(w,h)*0.018)

  if (portrait) {
    const hudH=h*0.075
    const opponentH=h*0.02
    const opponentHandH=h*0.10
    const localHandH=h*0.21
    const promptH=h*0.10
    const combatY=pad+hudH+opponentH+opponentHandH
    const combatH=Math.max(h*0.34,h-combatY-localHandH-promptH-pad*2)
    const side=Math.max(46,w*0.13)
    return {
      width:w,height:h,mode:'portrait',
      hud:rect(pad,pad,w-pad*2,hudH),
      opponent:rect(pad,pad+hudH,w-pad*2,opponentH),
      opponentHand:rect(pad,pad+hudH+opponentH,w-pad*2,opponentHandH),
      combat:rect(pad+side,combatY,w-pad*2-side*2,combatH),
      effectLeft:rect(pad,combatY,side-pad*0.35,combatH*0.40),
      zonXLeft:rect(pad,combatY+combatH*0.46,side-pad*0.35,combatH*0.30),
      effectRight:rect(w-pad-side+pad*0.35,combatY,side-pad*0.35,combatH*0.40),
      zonXRight:rect(w-pad-side+pad*0.35,combatY+combatH*0.46,side-pad*0.35,combatH*0.30),
      deck:rect(w-pad-side+pad*0.35,combatY+combatH*0.81,side-pad*0.35,combatH*0.17),
      discard:rect(pad,combatY+combatH*0.81,side-pad*0.35,combatH*0.17),
      prompt:rect(pad,h-localHandH-promptH-pad,w-pad*2,promptH),
      localHand:rect(pad,h-localHandH-pad,w-pad*2,localHandH),
    }
  }

  const hudH=h*0.11
  const opponentHandH=h*0.10
  const handH=h*0.21
  const promptH=h*0.10
  const commandRail=Math.max(260,w*0.18)
  const playableW=w-pad*2-commandRail
  const arenaY=pad+hudH
  const combatY=arenaY+opponentHandH
  const arenaH=h-hudH-opponentHandH-handH-promptH-pad*2
  const side=Math.max(86,w*0.07)
  return {
    width:w,height:h,mode:'wide',
    hud:rect(pad,pad,w-pad*2,hudH),
    opponent:rect(pad,arenaY,playableW,opponentHandH*0.24),
    opponentHand:rect(pad+side,arenaY,playableW-side*2,opponentHandH),
    combat:rect(pad+side,combatY,playableW-side*2,arenaH),
    effectLeft:rect(pad,combatY,side-pad*0.35,arenaH*0.42),
    zonXLeft:rect(pad,combatY+arenaH*0.48,side-pad*0.35,arenaH*0.28),
    discard:rect(pad,combatY+arenaH*0.80,side-pad*0.35,arenaH*0.18),
    effectRight:rect(pad+playableW-side+pad*0.35,combatY,side-pad*0.35,arenaH*0.42),
    zonXRight:rect(pad+playableW-side+pad*0.35,combatY+arenaH*0.48,side-pad*0.35,arenaH*0.28),
    deck:rect(pad+playableW-side+pad*0.35,combatY+arenaH*0.80,side-pad*0.35,arenaH*0.18),
    prompt:rect(pad,h-handH-promptH-pad,playableW,promptH),
    localHand:rect(pad,h-handH-pad,playableW,handH),
  }
}
