import * as THREE from 'three'

const steel='#0b121b'
const steelDark='#04080d'
const gold='#d8b64f'
const blue='#28b7ff'
const red='#ff3d60'

export function Arena3DTable(){
  return <group>
    <mesh receiveShadow position={[0,-.74,0]}>
      <boxGeometry args={[15.2,1.25,9.7]}/>
      <meshStandardMaterial color={steelDark} metalness={.82} roughness={.32}/>
    </mesh>

    <mesh receiveShadow position={[0,-.08,0]}>
      <boxGeometry args={[14.3,.16,8.7]}/>
      <meshStandardMaterial color="#07101a" metalness={.6} roughness={.43}/>
    </mesh>

    <mesh receiveShadow position={[0,.01,0]}>
      <boxGeometry args={[8.1,.1,5.8]}/>
      <meshStandardMaterial color="#060b12" metalness={.48} roughness={.34}/>
    </mesh>

    <CombatCore/>
    <SideArchitecture side="left"/>
    <SideArchitecture side="right"/>
    <CornerPylons/>
    <gridHelper args={[13.7,20,0x163c55,0x0a1d2b]} position={[0,.085,0]}/>
  </group>
}

function CombatCore(){
  return <group>
    <mesh position={[0,.14,0]} rotation={[-Math.PI/2,0,0]}>
      <ringGeometry args={[2.55,2.65,96]}/>
      <meshBasicMaterial color={gold} transparent opacity={.48} side={THREE.DoubleSide}/>
    </mesh>
    <mesh position={[0,.135,0]} rotation={[-Math.PI/2,0,0]}>
      <ringGeometry args={[1.82,1.86,96]}/>
      <meshBasicMaterial color="#806319" transparent opacity={.65} side={THREE.DoubleSide}/>
    </mesh>
    <mesh position={[0,.11,0]} rotation={[-Math.PI/2,0,0]}>
      <circleGeometry args={[1.78,96]}/>
      <meshStandardMaterial color="#06090e" metalness={.78} roughness={.27}/>
    </mesh>
    <mesh position={[0,.18,0]}>
      <boxGeometry args={[5.8,.055,.055]}/>
      <meshStandardMaterial color={gold} emissive="#8f6a13" emissiveIntensity={1.5}/>
    </mesh>
    <mesh position={[0,.145,0]} rotation={[-Math.PI/2,0,Math.PI/4]}>
      <ringGeometry args={[.54,.59,4]}/>
      <meshBasicMaterial color="#f5d96f" transparent opacity={.58} side={THREE.DoubleSide}/>
    </mesh>
  </group>
}

function SideArchitecture({side}:{side:'left'|'right'}){
  const sign=side==='left'?-1:1
  const color=side==='left'?blue:red
  const emissive=side==='left'?'#0b6c9e':'#9c102b'
  return <group position={[sign*6.85,.12,0]}>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[.42,.4,8.1]}/>
      <meshStandardMaterial color={steel} metalness={.9} roughness={.26}/>
    </mesh>
    <mesh position={[sign*-.23,.18,0]}>
      <boxGeometry args={[.08,.12,7.4]}/>
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={2.4}/>
    </mesh>
    {[-2.8,0,2.8].map(z=><mesh key={z} castShadow position={[0,.48,z]}>
      <boxGeometry args={[.72,.72,.7]}/>
      <meshStandardMaterial color="#0b141f" metalness={.88} roughness={.22}/>
    </mesh>)}
    {[-2.8,0,2.8].map(z=><pointLight key={`light-${z}`} position={[sign*-.35,.82,z]} intensity={5.5} distance={3.2} color={color}/>) }
  </group>
}

function CornerPylons(){
  return <>
    {[[-6.55,3.85,blue],[-6.55,-3.85,blue],[6.55,3.85,red],[6.55,-3.85,red]].map(([x,z,color],index)=><group key={index} position={[x as number,.26,z as number]}>
      <mesh castShadow><cylinderGeometry args={[.3,.42,.85,8]}/><meshStandardMaterial color="#111923" metalness={.9} roughness={.25}/></mesh>
      <mesh position={[0,.52,0]}><cylinderGeometry args={[.12,.18,.28,8]}/><meshStandardMaterial color={color as string} emissive={color as string} emissiveIntensity={1.4}/></mesh>
    </group>)}
  </>
}
