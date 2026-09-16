import { PerspectiveCamera, Stars } from '@react-three/drei'
import type { ArenaRenderState, ArenaCardRef } from '../arena/ArenaStateAdapter'
import { Arena3DTable } from './Arena3DTable'
import { Arena3DZones } from './Arena3DZones'

type Props={state:ArenaRenderState;onPrimary:(id:string)=>void;onSecondary:(card:ArenaCardRef)=>void}

export function Arena3DScene({state,onPrimary,onSecondary}:Props){
  return <>
    <color attach="background" args={['#020409']}/>
    <fog attach="fog" args={['#020409',13,28]}/>
    <PerspectiveCamera makeDefault position={[0,9.4,11.6]} fov={43} rotation={[-0.67,0,0]}/>
    <ambientLight intensity={0.46}/>
    <directionalLight castShadow position={[-4,10,6]} intensity={1.25} color="#d7ecff" shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
    <pointLight position={[-6,2,0]} intensity={14} distance={11} color="#1596e8"/>
    <pointLight position={[6,2,0]} intensity={14} distance={11} color="#d72f51"/>
    <pointLight position={[0,4,0]} intensity={10} distance={10} color="#d7b759"/>
    <Stars radius={32} depth={15} count={260} factor={1.6} saturation={0} fade speed={0.28}/>
    <Arena3DTable/>
    <Arena3DZones state={state} onPrimary={onPrimary} onSecondary={onSecondary}/>
  </>
}
