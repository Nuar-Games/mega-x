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

function detectTouchCapability(){
  if(typeof navigator==='undefined')return false
  if(navigator.maxTouchPoints>0)return true
  if(typeof window!=='undefined'&&'ontouchstart' in window)return true
  if(typeof window!=='undefined'&&window.matchMedia?.('(pointer: coarse), (hover: none)').matches)return true
  return false
}

export function Arena3DRoot({shell}:Props){
  const initial=useMemo(()=>readArena3DState(shell),[shell])
  const [state,setState]=useState<ArenaRenderState>(initial)
  const previous=useRef<ArenaRenderState|null>(initial)
  const [chooser,setChooser]=useState<ArenaCardRef|null>(null)
  const [transitions,setTransitions]=useState<Arena3DTransition[]>([])
  const [impactToken,setImpactToken]=useState(0)
  const [quality,setQuality]=useState<Arena3DQualityName>(()=>chooseArena3DQuality())
  const [touchCapable,setTouchCapable]=useState(()=>detectTouchCapability())
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

  useEffect(()=>{
    if(touchCapable||typeof window==='undefined')return
    const refresh=()=>{if(detectTouchCapability())setTouchCapable(true)}
    const onPointerDown=(event:PointerEvent)=>{if(event.pointerType==='touch')setTouchCapable(true)}
    const onTouchStart=()=>setTouchCapable(true)
    window.addEventListener('resize',refresh)
    window.addEventListener('orientationchange',refresh)
    window.addEventListener('pointerdown',onPointerDown,{passive:true})
    window.addEventListener('touchstart',onTouchStart,{passive:true,once:true})
    refresh()
    return ()=>{
      window.removeEventListener('resize',refresh)
      window.removeEventListener('orientationchange',refresh)
      window.removeEventListener('pointerdown',onPointerDown)
      window.removeEventListener('touchstart',onTouchStart)
    }
  },[touchCapable])

  const dispatch=useMemo(()=>((id:string)=>dispatchArena3DAction(shell,id)),[shell])
  const handleSecondary=(card:ArenaCardRef)=>{
    if(card.actions?.length){setChooser(card);return}
    setChooser(null)
  }
  // The chooser holds a snapshot of the card at the moment it was opened. If the
  // authoritative DOM state moves on underneath it — the card leaves the hand, its
  // action buttons are torn down by React reconciliation — the snapshot goes stale:
  // its action ids no longer resolve to any live button, so dispatchArena3DAction
  // silently no-ops on click (querySelector finds nothing) with no visible feedback.
  // Close the chooser as soon as its card is no longer present with matching,
  // dispatchable actions in the live state, so it can never show dead choices.
  useEffect(()=>{
    if(!chooser)return
    const live=state.localHand.find(card=>card.src===chooser.src&&card.alt===chooser.alt)
    const stillActionable=live?.actions?.length&&live.actions.every(action=>chooser.actions?.some(prior=>prior.id===action.id))
    if(!live||!stillActionable)setChooser(null)
  },[state,chooser])
  const changeQuality=(next:Arena3DQualityName)=>{saveArena3DQuality(next);setQuality(next)}

  return <div className="mx3d-root" data-arena-3d-root="true" data-touch-capable={touchCapable?'true':'false'}>
    <div className="mx3d-canvas">
      <Canvas shadows={profile.shadows} dpr={profile.dpr} style={{touchAction:'none'}} gl={{antialias:quality!=='low',powerPreference:quality==='low'?'low-power':'high-performance'}}>
        <Suspense fallback={null}>
          <Arena3DScene state={state} onPrimary={dispatch} onSecondary={handleSecondary} inspectOpen={Boolean(chooser)} transitions={transitions} impactToken={impactToken} quality={quality}/>
          {profile.bloom?<EffectComposer multisampling={quality==='high'?4:0}><Bloom luminanceThreshold={1.05} luminanceSmoothing={.78} intensity={quality==='high'?0.72:0.42}/></EffectComposer>:null}
        </Suspense>
      </Canvas>
    </div>
    <Arena3DHUD state={state} onAction={dispatch} onCardSelect={handleSecondary} chooser={chooser} onCloseChooser={()=>setChooser(null)} quality={quality} onQuality={changeQuality}/>
  </div>
}
