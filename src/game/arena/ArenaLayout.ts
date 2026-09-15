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
  const pad=Math.max(10,Math.min(w,h)*0.02)

  if (portrait) {
    const hudH=h*0.07
    const opponentH=h*0.16
    const opponentHandH=h*0.11
    const localHandH=h*0.24
    const promptH=h*0.07
    const combatY=pad+hudH+opponentH+opponentHandH
    const combatH=Math.max(h*0.26,h-combatY-localHandH-promptH-pad*2)
    const side=Math.max(48,w*0.135)
    return {
      width:w,height:h,mode:'portrait',
      hud:rect(pad,pad,w-pad*2,hudH),
      opponent:rect(pad,pad+hudH,w-pad*2,opponentH),
      opponentHand:rect(pad,pad+hudH+opponentH,w-pad*2,opponentHandH),
      combat:rect(pad+side,combatY,w-pad*2-side*2,combatH),
      effectLeft:rect(pad,combatY,side-pad*0.35,combatH*0.42),
      zonXLeft:rect(pad,combatY+combatH*0.48,side-pad*0.35,combatH*0.32),
      effectRight:rect(w-pad-side+pad*0.35,combatY,side-pad*0.35,combatH*0.42),
      zonXRight:rect(w-pad-side+pad*0.35,combatY+combatH*0.48,side-pad*0.35,combatH*0.32),
      deck:rect(w-pad-side+pad*0.35,combatY+combatH*0.84,side-pad*0.35,combatH*0.14),
      discard:rect(pad,combatY+combatH*0.84,side-pad*0.35,combatH*0.14),
      prompt:rect(pad,h-localHandH-promptH-pad,w-pad*2,promptH),
      localHand:rect(pad,h-localHandH-pad,w-pad*2,localHandH),
    }
  }

  const hudH=h*0.09
  const handH=h*0.25
  const promptH=h*0.08
  const arenaY=pad+hudH
  const arenaH=h-hudH-handH-promptH-pad*2
  const side=Math.max(70,w*0.105)
  const opponentW=Math.max(180,w*0.22)
  return {
    width:w,height:h,mode:'wide',
    hud:rect(pad,pad,w-pad*2,hudH),
    opponent:rect(pad,arenaY,opponentW,arenaH*0.48),
    opponentHand:rect(pad,arenaY+arenaH*0.50,opponentW,arenaH*0.35),
    combat:rect(pad+opponentW+side,arenaY,w-pad*2-opponentW-side*2,arenaH),
    effectLeft:rect(pad+opponentW+pad,arenaY,side-pad*1.2,arenaH*0.42),
    zonXLeft:rect(pad+opponentW+pad,arenaY+arenaH*0.48,side-pad*1.2,arenaH*0.28),
    discard:rect(pad+opponentW+pad,arenaY+arenaH*0.80,side-pad*1.2,arenaH*0.18),
    effectRight:rect(w-pad-side+pad*0.2,arenaY,side-pad*1.2,arenaH*0.42),
    zonXRight:rect(w-pad-side+pad*0.2,arenaY+arenaH*0.48,side-pad*1.2,arenaH*0.28),
    deck:rect(w-pad-side+pad*0.2,arenaY+arenaH*0.80,side-pad*1.2,arenaH*0.18),
    prompt:rect(pad,h-handH-promptH-pad,w-pad*2,promptH),
    localHand:rect(pad,h-handH-pad,w-pad*2,handH),
  }
}
