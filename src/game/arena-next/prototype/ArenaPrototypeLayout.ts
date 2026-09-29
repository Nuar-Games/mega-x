export type ArenaPrototypePoint = { x:number; y:number }
export type ArenaPrototypeRect = ArenaPrototypePoint & { width:number; height:number }

export type ArenaPrototypeLayout = {
  viewport:{ width:number; height:number }
  board:ArenaPrototypeRect
  scale:number
  boardLeft:number
  boardTop:number
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

export const PHONE_WIDTH=390
export const PHONE_HEIGHT=844

const rect=(x:number,y:number,width:number,height:number):ArenaPrototypeRect=>({x,y,width,height})

/**
 * Arena Board v2 uses the owner-approved 390x844 portrait composition as its
 * source geometry. Rendering and pointer targets both consume these scaled
 * rectangles so the viewer stays bottom/blue regardless of player index.
 */
export function createArenaBoardLayout(width:number,height:number,localPlayerIndex:0|1):ArenaPrototypeLayout {
  const opponentPlayerIndex=(localPlayerIndex===0?1:0) as 0|1
  const desktop=width>520
  const targetWidth=desktop?Math.min(width*0.58,520):width
  const scale=Math.min(targetWidth/PHONE_WIDTH,height/PHONE_HEIGHT,desktop?1.25:1)
  const boardWidth=PHONE_WIDTH*scale
  const boardHeight=PHONE_HEIGHT*scale
  const boardLeft=(width-boardWidth)/2
  const boardTop=(height-boardHeight)/2
  const phoneRect=(left:number,top:number,w:number,h:number)=>rect(
    boardLeft+(left+w/2)*scale,
    boardTop+(top+h/2)*scale,
    w*scale,
    h*scale,
  )

  const nameplates=[rect(0,0,0,0),rect(0,0,0,0)] as [ArenaPrototypeRect,ArenaPrototypeRect]
  const captured=[rect(0,0,0,0),rect(0,0,0,0)] as [ArenaPrototypeRect,ArenaPrototypeRect]
  const vs=[rect(0,0,0,0),rect(0,0,0,0)] as [ArenaPrototypeRect,ArenaPrototypeRect]
  const stats=[rect(0,0,0,0),rect(0,0,0,0)] as [ArenaPrototypeRect,ArenaPrototypeRect]
  const zonX=[rect(0,0,0,0),rect(0,0,0,0)] as [ArenaPrototypeRect,ArenaPrototypeRect]
  const zonTepi=[rect(0,0,0,0),rect(0,0,0,0)] as [ArenaPrototypeRect,ArenaPrototypeRect]
  const effectSlots=[[],[]] as [ArenaPrototypeRect[],ArenaPrototypeRect[]]

  nameplates[opponentPlayerIndex]=phoneRect(64,8,160,44)
  nameplates[localPlayerIndex]=phoneRect(64,628,160,44)
  zonX[opponentPlayerIndex]=phoneRect(10,8,46,46)
  zonX[localPlayerIndex]=phoneRect(10,628,46,46)
  captured[0]=zonX[0]
  captured[1]=zonX[1]

  const gridLeft=10
  const gridWidth=370
  const gap=6
  const slotWidth=(gridWidth-gap*5)/6
  const slotLeft=(index:number)=>gridLeft+index*(slotWidth+gap)
  effectSlots[opponentPlayerIndex]=Array.from({ length: 5 },(_,index)=>phoneRect(slotLeft(index),58,slotWidth,78))
  effectSlots[localPlayerIndex]=Array.from({ length: 5 },(_,index)=>phoneRect(slotLeft(index),542,slotWidth,78))
  zonTepi[opponentPlayerIndex]=phoneRect(slotLeft(5),58,slotWidth,78)
  zonTepi[localPlayerIndex]=phoneRect(slotLeft(5),542,slotWidth,78)

  const vsWidth=120*scale
  const vsHeight=170*scale
  vs[opponentPlayerIndex]=rect(boardLeft+195*scale,boardTop+239*scale,vsWidth,vsHeight)
  vs[localPlayerIndex]=rect(boardLeft+195*scale,boardTop+433*scale,vsWidth,vsHeight)
  stats[opponentPlayerIndex]=phoneRect(12,172,108,115)
  stats[localPlayerIndex]=phoneRect(12,396,108,115)

  const centerLineY=boardTop+334*scale

  return {
    viewport:{width,height},
    board:rect(width/2,height/2,boardWidth,boardHeight),
    scale,
    boardLeft,
    boardTop,
    localPlayerIndex,
    opponentPlayerIndex,
    nameplates,
    opponentHand:phoneRect(276,10,58,36),
    masterDeck:phoneRect(12,295,58,91),
    captured,
    vs,
    stats,
    effectSlots,
    zonX,
    zonTepi,
    handBand:phoneRect(0,680,390,164),
    timer:phoneRect(161,301,68,68),
    turnIndicator:phoneRect(290,290,90,90),
    actionArea:phoneRect(232,628,148,44),
    centerLineY,
  }
}

export function arenaHandPoint(index:number,count:number,layout:ArenaPrototypeLayout){
  const cards=Math.max(1,count)
  const normalized=index-(cards-1)/2
  return {
    x:layout.boardLeft+(195+normalized*62)*layout.scale,
    y:layout.boardTop+(754+Math.abs(normalized)*9)*layout.scale,
    angle:normalized*0.087,
  }
}

export function arenaActionPoint(index:number,count:number,layout:ArenaPrototypeLayout){
  const actions=Math.max(1,count)
  const spacing=Math.min(44*layout.scale,layout.actionArea.width/actions)
  return {
    x:layout.actionArea.x+(index-(actions-1)/2)*spacing,
    y:layout.actionArea.y,
  }
}
