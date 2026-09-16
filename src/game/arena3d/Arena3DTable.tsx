import * as THREE from 'three'

export function Arena3DTable(){
  const metal=new THREE.MeshStandardMaterial({color:'#0b1118',metalness:.86,roughness:.34})
  const inset=new THREE.MeshStandardMaterial({color:'#03070c',metalness:.58,roughness:.54})
  return <group>
    <mesh receiveShadow position={[0,-.52,0]} material={metal}>
      <boxGeometry args={[16.8,.8,10.8]}/>
    </mesh>
    <mesh receiveShadow position={[0,-.05,0]} material={inset}>
      <boxGeometry args={[15.8,.18,9.8]}/>
    </mesh>
    <mesh position={[0,.03,0]}>
      <boxGeometry args={[9.2,.06,.08]}/>
      <meshStandardMaterial color="#d5b552" emissive="#a47f22" emissiveIntensity={1.2}/>
    </mesh>
    <mesh position={[-7.75,.14,0]}>
      <boxGeometry args={[.12,.32,9.4]}/>
      <meshStandardMaterial color="#2ba9ef" emissive="#0d68a2" emissiveIntensity={1.4}/>
    </mesh>
    <mesh position={[7.75,.14,0]}>
      <boxGeometry args={[.12,.32,9.4]}/>
      <meshStandardMaterial color="#f04b65" emissive="#8b1529" emissiveIntensity={1.4}/>
    </mesh>
    <gridHelper args={[15.4,18,0x24435a,0x112431]} position={[0,.055,0]}/>
  </group>
}
