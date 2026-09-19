export type ArenaPrototypePoint = { x:number; y:number }
export type ArenaPrototypeRect = ArenaPrototypePoint & { width:number; height:number }

export type ArenaPrototypeLayout = {
  viewport:{ width:number; height:number }
  nameplates:[ArenaPrototypeRect,ArenaPrototypeRect]
  masterDeck:ArenaPrototypeRect
  captured:[ArenaPrototypeRect,ArenaPrototypeRect]
  vs:[ArenaPrototypeRect,ArenaPrototypeRect]
  stats:[ArenaPrototypeRect,ArenaPrototypeRect]
  effectSlots:[ArenaPrototypeRect[],ArenaPrototypeRect[]]
  zonX:[ArenaPrototypeRect,ArenaPrototypeRect]
  zonTepi:[ArenaPrototypeRect,ArenaPrototypeRect]
  handBand:ArenaPrototypeRect
}

const rect=(x:number,y:number,width:number,height:number):ArenaPrototypeRect=>({x,y,width,height})

/**
 * Phase 3 has one layout profile: desktop landscape.
 * Coordinates are recalculated from the real canvas size; the page is never uniformly scaled.
 */
export function createDesktopPrototypeLayout(width:number,height:number):ArenaPrototypeLayout {
  const cardWidth=Math.max(92,Math.min(144,width*0.072))
  const cardHeight=cardWidth*1.42
  const effectWidth=Math.max(68,Math.min(96,width*0.048))
  const effectHeight=effectWidth*1.42
  const effectTop=height*0.26
  const effectGap=Math.max(effectHeight*0.72,height*0.102)
  const effectSlots:[ArenaPrototypeRect[],ArenaPrototypeRect[]]=[
    Array.from({ length: 5 },(_,index)=>rect(width*0.105,effectTop+index*effectGap,effectWidth,effectHeight)),
    Array.from({ length: 5 },(_,index)=>rect(width*0.895,effectTop+index*effectGap,effectWidth,effectHeight)),
  ]

  return {
    viewport:{width,height},
    nameplates:[
      rect(width*0.15,height*0.07,width*0.24,Math.max(58,height*0.07)),
      rect(width*0.85,height*0.07,width*0.24,Math.max(58,height*0.07)),
    ],
    masterDeck:rect(width*0.5,height*0.105,cardWidth*0.82,cardHeight*0.82),
    captured:[
      rect(width*0.22,height*0.57,width*0.115,Math.max(46,height*0.052)),
      rect(width*0.78,height*0.57,width*0.115,Math.max(46,height*0.052)),
    ],
    vs:[
      rect(width*0.405,height*0.45,cardWidth*1.28,cardHeight*1.28),
      rect(width*0.595,height*0.45,cardWidth*1.28,cardHeight*1.28),
    ],
    stats:[
      rect(width*0.405,height*0.685,width*0.205,Math.max(52,height*0.06)),
      rect(width*0.595,height*0.685,width*0.205,Math.max(52,height*0.06)),
    ],
    effectSlots,
    zonX:[
      rect(width*0.22,height*0.70,cardWidth*0.92,cardHeight*0.92),
      rect(width*0.78,height*0.70,cardWidth*0.92,cardHeight*0.92),
    ],
    zonTepi:[
      rect(width*0.08,height*0.82,cardWidth*0.86,cardHeight*0.86),
      rect(width*0.92,height*0.82,cardWidth*0.86,cardHeight*0.86),
    ],
    handBand:rect(width*0.5,height*0.89,width*0.47,cardHeight*0.72),
  }
}
