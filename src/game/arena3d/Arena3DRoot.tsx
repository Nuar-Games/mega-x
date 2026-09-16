import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type { ArenaCardRef, ArenaRenderState } from '../arena/ArenaStateAdapter'
import { dispatchArena3DAction, readArena3DState, subscribeArena3DState } from './Arena3DStateBridge'
import { Arena3DScene } from './Arena3DScene'
import { Arena3DHUD } from './Arena3DHUD'
import './arena3d.css'

type Props={shell:HTMLElement}

export function Arena3DRoot({shell}:Props){
  const [state,setState]=useState<ArenaRenderState>(()=>readArena3DState(shell))
  const [chooser,setChooser]=useState<ArenaCardRef|null>(null)
  useEffect(()=>subscribeArena3DState(shell,next=>setState(next)),[shell])
  const dispatch=useMemo(()=>((id:string)=>dispatchArena3DAction(shell,id)),[shell])
  const handleSecondary=(card:ArenaCardRef)=>{
    if(card.actions?.length){setChooser(card);return}
    setChooser(null)
  }
  return <div className="mx3d-root">
    <div className="mx3d-canvas">
      <Canvas shadows dpr={[1,1.5]} gl={{antialias:true,powerPreference:'high-performance'}}>
        <Suspense fallback={null}>
          <Arena3DScene state={state} onPrimary={dispatch} onSecondary={handleSecondary}/>
        </Suspense>
      </Canvas>
    </div>
    <Arena3DHUD state={state} onAction={dispatch} chooser={chooser} onCloseChooser={()=>setChooser(null)}/>
  </div>
}
