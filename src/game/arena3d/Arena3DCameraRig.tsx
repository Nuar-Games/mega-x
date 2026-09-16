import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ArenaRenderState } from '../arena/ArenaStateAdapter'

export type Arena3DCameraMode='overview'|'set-vs'|'attack'|'inspect'|'result'

type Props={state:ArenaRenderState;inspectOpen:boolean;impactToken:number}

export function Arena3DCameraRig({state,inspectOpen,impactToken}:Props){
  const {camera}=useThree()
  const reducedMotion=useMemo(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false,[])
  const shake=useRef(0)
  useEffect(()=>{if(!reducedMotion&&impactToken>0)shake.current=.16},[impactToken,reducedMotion])

  const mode:Arena3DCameraMode=state.result?'result':inspectOpen?'inspect':state.phase.includes('ATTACK')?'attack':state.phase.includes('SET_VS')?'set-vs':'overview'
  const target=mode==='set-vs'||mode==='attack'?new THREE.Vector3(0,7.1,9.1):mode==='inspect'?new THREE.Vector3(0,5.5,6.6):mode==='result'?new THREE.Vector3(0,11.4,14.6):new THREE.Vector3(0,9.4,11.6)
  const look=mode==='inspect'?new THREE.Vector3(0,.5,1.3):new THREE.Vector3(0,0,0)

  useFrame((_,delta)=>{
    const speed=reducedMotion?12:mode==='attack'?7:4.5
    camera.position.lerp(target,1-Math.exp(-speed*delta))
    const activeShake=shake.current
    if(activeShake>0){
      camera.position.x+=(Math.random()-.5)*activeShake
      camera.position.y+=(Math.random()-.5)*activeShake*.5
      shake.current=Math.max(0,activeShake-delta*.9)
    }
    camera.lookAt(look)
  })
  return null
}
