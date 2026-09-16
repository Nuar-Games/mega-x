import { PerspectiveCamera, Stars } from '@react-three/drei'
import type { ArenaRenderState, ArenaCardRef } from '../arena/ArenaStateAdapter'
import type { Arena3DTransition } from './Arena3DTransitions'
import type { Arena3DQualityName } from './Arena3DQuality'
import { Arena3DTable } from './Arena3DTable'
import { Arena3DZones } from './Arena3DZones'
import { Arena3DCameraRig } from './Arena3DCameraRig'
import { Arena3DFX } from './Arena3DFX'

type Props={
  state:ArenaRenderState
  onPrimary:(id:string)=>void
  onSecondary:(card:ArenaCardRef)=>void
  inspectOpen:boolean
  transitions:Arena3DTransition[]
  impactToken:number
  quality:Arena3DQualityName
}

export function Arena3DScene({state,onPrimary,onSecondary,inspectOpen,transitions,impactToken,quality}:Props){
  const low=quality==='low'
  return <>
    <color attach="background" args={['#020409']}/>
    <fog attach="fog" args={['#020409',13,28]}/>
    <PerspectiveCamera makeDefault position={[0,9.4,11.6]} fov={43}/>
    <Arena3DCameraRig state={state} inspectOpen={inspectOpen} impactToken={impactToken}/>
    <ambientLight intensity={0.46}/>
    <directionalLight castShadow={!low} position={[-4,10,6]} intensity={1.25} color="#d7ecff" shadow-mapSize-width={low?256:1024} shadow-mapSize-height={low?256:1024}/>
    <pointLight position={[-6,2,0]} intensity={14} distance={11} color="#1596e8"/>
    <pointLight position={[6,2,0]} intensity={14} distance={11} color="#d72f51"/>
    <pointLight position={[0,4,0]} intensity={10} distance={10} color="#d7b759"/>
    {!low?<Stars radius={32} depth={15} count={quality==='high'?260:120} factor={1.6} saturation={0} fade speed={0.28}/>:null}
    <Arena3DTable/>
    <Arena3DZones state={state} onPrimary={onPrimary} onSecondary={onSecondary}/>
    <Arena3DFX events={transitions} quality={quality}/>
  </>
}
