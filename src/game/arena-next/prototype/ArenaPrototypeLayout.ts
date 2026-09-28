export type ArenaPrototypePoint = { x:number; y:number }
export type ArenaPrototypeRect = ArenaPrototypePoint & { width:number; height:number }

export type ArenaPrototypeLayout = {
  viewport:{ width:number; height:number }
  board:ArenaPrototypeRect
  localPlayerIndex:0|1
  opponentPlayerIndex:0|1
  nameplates:[ArenaPrototypeRect,ArenaPrototypeRect]
  opponentHand:ArenaPrototypeRect
  masterDeck:ArenaPrototypeRect
  captured:[ArenaPrototypeRect,ArenaPrototypeRect]
  vs:[ArenaPrototypeRect,ArenaPrototypeRect]
  stats:[ArenaPrototypeRect,ArenaPrototypeRect]
  effectSlots:[ArenaPrototypeRect[],ArenaPrototypeRect[]]
  zonX:[ArenaPrototypeRect,ArenaPrototypeRect]
  zonTepi:[ArenaPrototypeRect,ArenaPrototypeRect]
  handBand:ArenaPrototypeRect
  timer:ArenaPrototypeRect
  turnIndicator:ArenaPrototypeRect
  actionArea:ArenaPrototypeRect
  centerLineY:number
}

const rect=(x:number,y:number,width:number,height:number):ArenaPrototypeRect=>({x,y,width,height})
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value))

/**
 * Arena Board v2 is portrait-first. Arrays stay indexed by authoritative
 * player index, while physical positions are mapped from localPlayerIndex so
 * the viewer is always bottom/blue and the opponent top/red.
 */
export function createArenaBoardLayout(width:number,height:number,localPlayerIndex:0|1):ArenaPrototypeLayout {
  const opponentPlayerIndex=(localPlayerIndex===0?1:0) as 0|1
  const boardWidth=Math.min(width,width<=520?width:clamp(width*0.58,520,760))
  const boardX=width/2
  const boardLeft=boardX-boardWidth/2
  const board=rect(boardX,height/2,boardWidth,height)
  const x=(fraction:number)=>boardLeft+boardWidth*fraction
  const y=(fraction:number)=>height*fraction

  const vsWidth=clamp(boardWidth*0.255,92,150)
  const vsHeight=vsWidth*1.42
  const effectWidth=clamp(boardWidth*0.13,46,82)
  const effectHeight=effectWidth*1.42
  const zoneWidth=clamp(boardWidth*0.145,54,90)
  const zoneHeight=clamp(effectHeight,66,116)
  const centerLineY=y(0.46)

  const nameplates=[rect(0,0,0,0),rect(0,0,0,0)] as [ArenaPrototypeRect,ArenaPrototypeRect]
  const captured=[rect(0,0,0,0),rect(0,0,0,0)] as [ArenaPrototypeRect,ArenaPrototypeRect]
  const vs=[rect(0,0,0,0),rect(0,0,0,0)] as [ArenaPrototypeRect,ArenaPrototypeRect]
  const stats=[rect(0,0,0,0),rect(0,0,0,0)] as [ArenaPrototypeRect,ArenaPrototypeRect]
  const zonX=[rect(0,0,0,0),rect(0,0,0,0)] as [ArenaPrototypeRect,ArenaPrototypeRect]
  const zonTepi=[rect(0,0,0,0),rect(0,0,0,0)] as [ArenaPrototypeRect,ArenaPrototypeRect]
  const effectSlots=[[],[]] as [ArenaPrototypeRect[],ArenaPrototypeRect[]]

  nameplates[opponentPlayerIndex]=rect(x(0.47),y(0.055),boardWidth*0.55,clamp(height*0.066,48,70))
  nameplates[localPlayerIndex]=rect(x(0.47),y(0.825),boardWidth*0.55,clamp(height*0.066,48,70))
  zonX[opponentPlayerIndex]=rect(x(0.095),y(0.055),zoneWidth,clamp(height*0.068,50,72))
  zonX[localPlayerIndex]=rect(x(0.095),y(0.825),zoneWidth,clamp(height*0.068,50,72))
  captured[0]=zonX[0]
  captured[1]=zonX[1]

  const slotFractions=[0.10,0.265,0.43,0.595,0.76]
  effectSlots[opponentPlayerIndex]=slotFractions.map(fraction=>rect(x(fraction),y(0.158),effectWidth,effectHeight))
  effectSlots[localPlayerIndex]=slotFractions.map(fraction=>rect(x(fraction),y(0.705),effectWidth,effectHeight))
  zonTepi[opponentPlayerIndex]=rect(x(0.91),y(0.158),zoneWidth,zoneHeight)
  zonTepi[localPlayerIndex]=rect(x(0.91),y(0.705),zoneWidth,zoneHeight)

  vs[opponentPlayerIndex]=rect(x(0.50),y(0.325),vsWidth,vsHeight)
  vs[localPlayerIndex]=rect(x(0.50),y(0.565),vsWidth,vsHeight)
  stats[opponentPlayerIndex]=rect(x(0.20),y(0.325),boardWidth*0.22,clamp(height*0.12,82,118))
  stats[localPlayerIndex]=rect(x(0.20),y(0.565),boardWidth*0.22,clamp(height*0.12,82,118))

  return {
    viewport:{width,height},
    board,
    localPlayerIndex,
    opponentPlayerIndex,
    nameplates,
    opponentHand:rect(x(0.84),y(0.055),boardWidth*0.20,clamp(height*0.07,52,76)),
    masterDeck:rect(x(0.095),centerLineY,clamp(boardWidth*0.12,54,84),clamp(boardWidth*0.17,76,118)),
    captured,
    vs,
    stats,
    effectSlots,
    zonX,
    zonTepi,
    handBand:rect(x(0.50),y(0.94),boardWidth*0.88,clamp(height*0.18,120,180)),
    timer:rect(x(0.50),centerLineY,clamp(boardWidth*0.15,58,88),clamp(boardWidth*0.15,58,88)),
    turnIndicator:rect(x(0.84),centerLineY,clamp(boardWidth*0.22,78,126),clamp(boardWidth*0.22,78,126)),
    actionArea:rect(x(0.66),y(0.825),boardWidth*0.58,clamp(height*0.065,46,64)),
    centerLineY,
  }
}

export function arenaHandPoint(index:number,count:number,layout:ArenaPrototypeLayout){
  const cards=Math.max(1,count)
  const spacing=Math.min(layout.handBand.width/Math.max(3,cards+0.7),88)
  const normalized=index-(cards-1)/2
  const angle=normalized*0.055
  return {
    x:layout.handBand.x+normalized*spacing,
    y:layout.handBand.y-Math.abs(normalized)*4,
    angle,
  }
}

export function arenaActionPoint(index:number,count:number,layout:ArenaPrototypeLayout){
  const actions=Math.max(1,count)
  const spacing=Math.min(118,layout.actionArea.width/actions)
  return {
    x:layout.actionArea.x+(index-(actions-1)/2)*spacing,
    y:layout.actionArea.y,
  }
}
