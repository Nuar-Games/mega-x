import { PerspectiveCamera, Stars } from '@react-three/drei'
import type { ArenaRenderState, ArenaCardRef } from '../arena/ArenaStateAdapter'
import type { Arena3DTransition } from './Arena3DTransitions'
import type { Arena3DQualityName } from './Arena3DQuality'
import { Arena3DTable } from './Arena3DTable'
import { Arena3DZonesVSFirst } from './Arena3DZonesVSFirst'
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
    <color attach="background" args={['#010308']}/>
    <fog attach="fog" args={['#01040a',12,24]}/>
    <PerspectiveCamera makeDefault position={[0,7.4,8.9]} fov={43}/>
    <Arena3DCameraRig state={state} inspectOpen={inspectOpen} impactToken={impactToken}/>

    <ambientLight intensity={low ? .34 : .24}/>
    <hemisphereLight intensity={low ? .42 : .62} color="#a9ddff" groundColor="#08030b"/>
    <directionalLight castShadow={!low} position={[-3.5,9,5]} intensity={1.65} color="#dcefff" shadow-mapSize-width={low?256:1024} shadow-mapSize-height={low?256:1024}/>
    <spotLight castShadow={!low} position={[0,9,0]} angle={.48} penumbra={.74} intensity={quality==='high'?48:30} distance={18} color="#f2d374"/>
    <pointLight position={[-5.8,1.7,0]} intensity={low?6:11} distance={10} color="#1aaeff"/>
    <pointLight position={[5.8,1.7,0]} intensity={low?6:11} distance={10} color="#ff3157"/>
    <pointLight position={[0,2.2,0]} intensity={low?7:15} distance={7} color="#e7bc52"/>

    {!low?<Stars radius={28} depth={12} count={quality==='high'?160:75} factor={1.1} saturation={0} fade speed={.2}/>:null}
    <ArenaBackdrop quality={quality}/>
    <Arena3DTable/>
    <Arena3DZonesVSFirst state={state} onPrimary={onPrimary} onSecondary={onSecondary}/>
    <Arena3DFX events={transitions} quality={quality}/>
  </>
}

function ArenaBackdrop({quality}:{quality:Arena3DQualityName}){
  const low=quality==='low'
  return <group position={[0,0,-5.25]}>
    <mesh position={[0,2.65,0]}><boxGeometry args={[13.5,5.6,.45]}/><meshStandardMaterial color="#03070d" metalness={.66} roughness={.38}/></mesh>
    <mesh position={[0,2.6,.25]}><boxGeometry args={[7.6,.055,.055]}/><meshBasicMaterial color="#d5b552" transparent opacity={.34}/></mesh>
    {[-5.1,-3.4,-1.7,1.7,3.4,5.1].map((x,index)=><mesh key={x} position={[x,2.5,.28]} rotation={[0,0,index<3 ? .18 : -.18]}><boxGeometry args={[.09,4.35,.08]}/><meshBasicMaterial color={index<3?'#157fbd':'#af1f3b'} transparent opacity={low ? .22 : .4}/></mesh>)}
    {!low&&<>
      <pointLight position={[-4.8,2.5,1]} intensity={5} distance={5} color="#168ed0"/>
      <pointLight position={[4.8,2.5,1]} intensity={5} distance={5} color="#c52b47"/>
    </>}
  </group>
}
