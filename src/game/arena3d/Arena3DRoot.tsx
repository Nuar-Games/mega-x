import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import type { ArenaCardRef, ArenaRenderState } from '../arena/ArenaStateAdapter'
import { dispatchArena3DAction, readArena3DState, subscribeArena3DState } from './Arena3DStateBridge'
import { deriveArena3DTransitions, type Arena3DTransition } from './Arena3DTransitions'
import { ARENA_3D_QUALITY, chooseArena3DQuality, saveArena3DQuality, type Arena3DQualityName } from './Arena3DQuality'
import { Arena3DScene } from './Arena3DScene'
import { Arena3DHUD } from './Arena3DHUD'
import './arena3d.css'

type Props={shell:HTMLElement}

export function Arena3DRoot({shell}:Props){
  const initial=useMemo(()=>readArena3DState(shell),[shell])
  const [state,setState]=useState<ArenaRenderState>(initial)
  const previous=useRef<ArenaRenderState|null>(initial)
  const [chooser,setChooser]=useState<ArenaCardRef|null>(null)
  const [transitions,setTransitions]=useState<Arena3DTransition[]>([])
  const [impactToken,setImpactToken]=useState(0)
  const [quality,setQuality]=useState<Arena3DQualityName>(()=>chooseArena3DQuality())
  const profile=ARENA_3D_QUALITY[quality]

  useEffect(()=>subscribeArena3DState(shell,next=>{
    const events=deriveArena3DTransitions(previous.current,next)
    previous.current=next
    setState(next)
    if(events.length){
      setTransitions(events)
      if(events.some(event=>event.kind==='attack'))setImpactToken(value=>value+1)
      window.setTimeout(()=>setTransitions([]),620)
    }
  }),[shell])

  const dispatch=useMemo(()=>((id:string)=>dispatchArena3DAction(shell,id)),[shell])
  const handleSecondary=(card:ArenaCardRef)=>{
    if(card.actions?.length){setChooser(card);return}
    setChooser(null)
  }
  const changeQuality=(next:Arena3DQualityName)=>{saveArena3DQuality(next);setQuality(next)}

  return <div className="mx3d-root">
    <div className="mx3d-canvas">
      <Canvas shadows={profile.shadows} dpr={profile.dpr} gl={{antialias:quality!=='low',powerPreference:quality==='low'?'low-power':'high-performance'}}>
        <Suspense fallback={null}>
          <Arena3DScene state={state} onPrimary={dispatch} onSecondary={handleSecondary} inspectOpen={Boolean(chooser)} transitions={transitions} impactToken={impactToken} quality={quality}/>
          {profile.bloom?<EffectComposer multisampling={quality==='high'?4:0}><Bloom luminanceThreshold={1.05} luminanceSmoothing={.78} intensity={quality==='high'?0.72:0.42}/></EffectComposer>:null}
        </Suspense>
      </Canvas>
    </div>
    <Arena3DHUD state={state} onAction={dispatch} chooser={chooser} onCloseChooser={()=>setChooser(null)} quality={quality} onQuality={changeQuality}/>
  </div>
}
