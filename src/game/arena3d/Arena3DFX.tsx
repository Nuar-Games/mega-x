import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Arena3DTransition } from './Arena3DTransitions'

export type Arena3DQualityName='high'|'medium'|'low'
type Props={events:Arena3DTransition[];quality:Arena3DQualityName}

export function Arena3DFX({events,quality}:Props){
  const pulse=useRef<THREE.Group>(null)
  const reducedMotion=useMemo(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false,[])
  const attack=events.some(event=>event.kind==='attack')
  const impact=attack
  const effect=events.some(event=>event.kind==='effect')
  const phase=events.some(event=>event.kind==='set-vs'||event.kind==='draw')
  const result=events.some(event=>event.kind==='result')
  const particleCount=quality==='low'?0:quality==='medium'?10:22
  const particles=useMemo(()=>Array.from({length:particleCount},(_,index)=>{
    const angle=index/Math.max(1,particleCount)*Math.PI*2
    const radius=.45+(index%4)*.16
    return [Math.cos(angle)*radius,.42+(index%3)*.18,Math.sin(angle)*radius] as [number,number,number]
  }),[particleCount])

  useFrame((_,delta)=>{
    if(!pulse.current||reducedMotion)return
    pulse.current.rotation.y+=delta*1.8
    const next=1+Math.sin(performance.now()/90)*.08
    pulse.current.scale.setScalar(next)
  })

  return <group>
    {/* attack-trail */}
    {attack?<mesh position={[0,.55,0]} rotation={[0,0,Math.PI/2]}>
      <cylinderGeometry args={[.055,.22,4.2,10]}/>
      <meshBasicMaterial color="#ffd768" transparent opacity={.78}/>
    </mesh>:null}
    {/* impact-flash */}
    {impact?<mesh position={[0,.68,0]}>
      <sphereGeometry args={[.72,20,20]}/>
      <meshBasicMaterial color="#fff0a3" transparent opacity={.58} blending={THREE.AdditiveBlending}/>
    </mesh>:null}
    {/* particle-burst */}
    {!reducedMotion&&impact&&quality!=='low'?particles.map((position,index)=><mesh key={index} position={position}>
      <sphereGeometry args={[.05+(index%3)*.018,8,8]}/>
      <meshBasicMaterial color={index%2?'#6dd2ff':'#ffd768'}/>
    </mesh>):null}
    {/* stat-pulse */}
    {impact?<group ref={pulse} position={[0,.12,0]} rotation={[-Math.PI/2,0,0]}>
      <mesh><torusGeometry args={[2.25,.035,8,64]}/><meshBasicMaterial color="#ffd768" transparent opacity={.52}/></mesh>
    </group>:null}
    {/* effect-pulse */}
    {effect?<mesh position={[-5.9,.22,-1.7]} rotation={[-Math.PI/2,0,0]}>
      <ringGeometry args={[.55,.78,32]}/><meshBasicMaterial color="#b779ff" transparent opacity={.64} side={THREE.DoubleSide}/>
    </mesh>:null}
    {/* phase-transition */}
    {phase?<mesh position={[0,3.2,-1.4]}>
      <planeGeometry args={[5.6,.16]}/><meshBasicMaterial color="#5ecbff" transparent opacity={.34}/>
    </mesh>:null}
    {/* result-sequence */}
    {result?<group position={[0,1.6,0]}>
      <mesh rotation={[-Math.PI/2,0,0]}><torusGeometry args={[3.6,.08,10,80]}/><meshBasicMaterial color="#f2cf67" transparent opacity={.75}/></mesh>
      <pointLight intensity={28} distance={12} color="#f2cf67"/>
    </group>:null}
  </group>
}
