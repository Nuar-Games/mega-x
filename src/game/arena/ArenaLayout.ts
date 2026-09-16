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
  const pad=Math.max(8,Math.min(w,h)*0.014)

  if (portrait) {
    const hudH=h*0.085
    const opponentH=h*0.018
    const opponentHandH=h*0.105
    const localHandH=h*0.245
    const promptH=h*0.085
    const combatY=pad+hudH+opponentH+opponentHandH
    const combatH=Math.max(h*0.33,h-combatY-localHandH-promptH-pad*2)
    const side=Math.max(42,w*0.115)
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

  const hudH=h*0.12
  const opponentHandH=h*0.115
  const handH=h*0.275
  const promptH=h*0.075
  const commandRail=Math.max(250,w*0.165)
  const playableW=w-pad*2-commandRail
  const arenaY=pad+hudH
  const combatY=arenaY+opponentHandH
  const arenaH=Math.max(h*0.31,h-hudH-opponentHandH-handH-promptH-pad*2)
  const side=Math.max(78,w*0.062)
  return {
    width:w,height:h,mode:'wide',
    hud:rect(pad,pad,w-pad*2,hudH),
    opponent:rect(pad,arenaY,playableW,opponentHandH*0.22),
    opponentHand:rect(pad+side,arenaY,playableW-side*2,opponentHandH),
    combat:rect(pad+side,combatY,playableW-side*2,arenaH),
    effectLeft:rect(pad,combatY,side-pad*0.35,arenaH*0.40),
    zonXLeft:rect(pad,combatY+arenaH*0.47,side-pad*0.35,arenaH*0.27),
    discard:rect(pad,combatY+arenaH*0.79,side-pad*0.35,arenaH*0.19),
    effectRight:rect(pad+playableW-side+pad*0.35,combatY,side-pad*0.35,arenaH*0.40),
    zonXRight:rect(pad+playableW-side+pad*0.35,combatY+arenaH*0.47,side-pad*0.35,arenaH*0.27),
    deck:rect(pad+playableW-side+pad*0.35,combatY+arenaH*0.79,side-pad*0.35,arenaH*0.19),
    prompt:rect(pad,h-handH-promptH-pad,playableW,promptH),
    localHand:rect(pad,h-handH-pad,playableW,handH),
  }
}
