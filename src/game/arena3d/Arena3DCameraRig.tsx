import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ArenaRenderState } from '../arena/ArenaStateAdapter'

export type Arena3DCameraMode='overview'|'set-vs'|'attack'|'inspect'|'result'

type Props={state:ArenaRenderState;inspectOpen:boolean;impactToken:number}

export function Arena3DCameraRig({state,inspectOpen,impactToken}:Props){
  const {camera,size}=useThree()
  const reducedMotion=useMemo(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false,[])
  const shake=useRef(0)
  useEffect(()=>{if(!reducedMotion&&impactToken>0)shake.current=.19},[impactToken,reducedMotion])

  const mode:Arena3DCameraMode=state.result?'result':inspectOpen?'inspect':state.phase.includes('ATTACK')?'attack':state.phase.includes('SET_VS')?'set-vs':'overview'
  const aspect=size.height>0?size.width/size.height:1
  const narrow=THREE.MathUtils.clamp((1.05-aspect)/.55,0,1)
  const base=mode==='set-vs'?new THREE.Vector3(0,6.4,8.9):mode==='attack'?new THREE.Vector3(0,5.7,8.1):mode==='inspect'?new THREE.Vector3(0,4.5,6.1):mode==='result'?new THREE.Vector3(0,8.8,11.2):new THREE.Vector3(0,6.8,9.3)
  const target=base.clone().add(new THREE.Vector3(0,narrow*.7,narrow*4.4))
  const look=mode==='inspect'?new THREE.Vector3(0,.38,1.15):mode==='attack'?new THREE.Vector3(0,.38,0):new THREE.Vector3(0,.05,.2)

  useFrame((_,delta)=>{
    const speed=reducedMotion?12:mode==='attack'?8:5.5
    camera.position.lerp(target,1-Math.exp(-speed*delta))
    const activeShake=shake.current
    if(activeShake>0){
      camera.position.x+=(Math.random()-.5)*activeShake
      camera.position.y+=(Math.random()-.5)*activeShake*.55
      camera.position.z+=(Math.random()-.5)*activeShake*.32
      shake.current=Math.max(0,activeShake-delta*1.05)
    }
    camera.lookAt(look)
  })
  return null
}
