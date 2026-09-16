import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { ArenaCardRef } from '../arena/ArenaStateAdapter'

export type Arena3DCardProps={
  card:ArenaCardRef|null
  position:[number,number,number]
  rotation?:[number,number,number]
  scale?:number
  dimmed?:boolean
  onPrimary?:(actionId:string)=>void
  onSecondary?:(card:ArenaCardRef)=>void
}

export function Arena3DCard({card,position,rotation=[-Math.PI/2,0,0],scale=1,dimmed=false,onPrimary,onSecondary}:Arena3DCardProps){
  if(!card)return null
  return <TexturedArenaCard card={card} position={position} rotation={rotation} scale={scale} dimmed={dimmed} onPrimary={onPrimary} onSecondary={onSecondary}/>
}

function TexturedArenaCard({card,position,rotation,scale,dimmed,onPrimary,onSecondary}:Required<Pick<Arena3DCardProps,'card'|'position'|'rotation'|'scale'|'dimmed'>> & Pick<Arena3DCardProps,'onPrimary'|'onSecondary'>){
  const texture=useTexture(card.src)
  texture.colorSpace=THREE.SRGBColorSpace
  texture.anisotropy=Math.max(texture.anisotropy,4)
  const width=1.42*scale,height=2.03*scale
  const actionable=Boolean(card.actionId)
  return <group position={position} rotation={rotation}>
    <mesh position={[0,-.035,0]} scale={[1.07,1.07,1]}>
      <planeGeometry args={[width,height]}/>
      <meshBasicMaterial color={actionable?'#d6b34e':'#071018'} transparent opacity={actionable?0.24:0.16}/>
    </mesh>
    <mesh
      castShadow
      receiveShadow
      onPointerDown={(event)=>{
        event.stopPropagation()
        if(card.actionId){onPrimary?.(card.actionId);return}
        onSecondary?.(card)
      }}
      onPointerOver={(event)=>{event.stopPropagation();document.body.style.cursor='pointer'}}
      onPointerOut={()=>{document.body.style.cursor=''}}
    >
      <planeGeometry args={[width,height]}/>
      <meshStandardMaterial map={texture} transparent opacity={dimmed?0.46:1} roughness={.58} metalness={.02} emissive={actionable?'#241b08':'#000000'} emissiveIntensity={actionable?0.5:0}/>
    </mesh>
  </group>
}
