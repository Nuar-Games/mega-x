import type { ArenaRenderState, ArenaCardRef } from '../arena/ArenaStateAdapter'
import { Arena3DCard } from './Arena3DCard'

type Props={state:ArenaRenderState;onPrimary:(id:string)=>void;onSecondary:(card:ArenaCardRef)=>void}

const handX=(index:number,count:number)=>{
  const spread=Math.min(1.55,8.4/Math.max(1,count))
  return (index-(count-1)/2)*spread
}

export function Arena3DZones({state,onPrimary,onSecondary}:Props){
  const localHand=state.localHand.slice(-7)
  return <group>
    <ZonePad position={[-1.8,.1,.1]} size={[2.15,3.05]} color="#1b9ee4" active={Boolean(state.localVs?.actionId)}/>
    <ZonePad position={[1.8,.1,-.1]} size={[2.15,3.05]} color="#e73a57" active={Boolean(state.opponentVs?.actionId)}/>

    {localHand.map((card,index)=><Arena3DCard key={`hand-${card.src}-${index}`} card={card} position={[handX(index,localHand.length),.26,3.68+Math.abs(index-(localHand.length-1)/2)*.09]} rotation={[-Math.PI/2,0,(index-(localHand.length-1)/2)*-.035]} scale={1.02} onPrimary={onPrimary} onSecondary={onSecondary}/>) }

    <Arena3DCard card={state.localVs} position={[-1.8,.32,.1]} scale={1.46} onPrimary={onPrimary} onSecondary={onSecondary}/>
    <Arena3DCard card={state.opponentVs} position={[1.8,.32,-.1]} rotation={[-Math.PI/2,0,Math.PI]} scale={1.46} onPrimary={onPrimary} onSecondary={onSecondary}/>

    <PileFixture label="DISCARD" position={[-5.55,.12,3.0]} color="#268ec4"/>
    <PileFixture label="ZON X" position={[-5.55,.12,1.15]} color="#d8b64f"/>
    <PileFixture label="ZON X" position={[5.55,.12,-1.15]} color="#d8b64f"/>
    <PileFixture label="DISCARD" position={[5.55,.12,-3.0]} color="#b7354d"/>

    <Arena3DCard card={state.localDiscard} position={[-5.55,.25,3.0]} scale={.66} dimmed onSecondary={onSecondary}/>
    <Arena3DCard card={state.opponentDiscard} position={[5.55,.25,-3.0]} rotation={[-Math.PI/2,0,Math.PI]} scale={.66} dimmed onSecondary={onSecondary}/>
    <Arena3DCard card={state.localZonX} position={[-5.55,.25,1.15]} scale={.72} dimmed={!state.localZonX} onPrimary={onPrimary} onSecondary={onSecondary}/>
    <Arena3DCard card={state.opponentZonX} position={[5.55,.25,-1.15]} rotation={[-Math.PI/2,0,Math.PI]} scale={.72} dimmed={!state.opponentZonX} onPrimary={onPrimary} onSecondary={onSecondary}/>

    <EffectRail side="local"/>
    <EffectRail side="opponent"/>
    {state.localEffects.slice(0,3).map((card,index)=><Arena3DCard key={`le-${card.src}-${index}`} card={card} position={[-5.5,.27,-.7-index*1.55]} scale={.58} dimmed={!card.actionId} onPrimary={onPrimary} onSecondary={onSecondary}/>) }
    {state.opponentEffects.slice(0,3).map((card,index)=><Arena3DCard key={`oe-${card.src}-${index}`} card={card} position={[5.5,.27,.7+index*1.55]} rotation={[-Math.PI/2,0,Math.PI]} scale={.58} dimmed={!card.actionId} onPrimary={onPrimary} onSecondary={onSecondary}/>) }

    <DeckStack count={state.deckCount}/>
  </group>
}

function ZonePad({position,size,color,active}:{position:[number,number,number];size:[number,number];color:string;active:boolean}){
  return <group position={position}>
    <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={size}/><meshStandardMaterial color="#071018" metalness={.68} roughness={.32}/></mesh>
    <mesh position={[0,.012,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.82,.88,48]}/><meshBasicMaterial color={color} transparent opacity={active?.9:.38}/></mesh>
    <pointLight position={[0,.7,0]} color={color} intensity={active?8:2.5} distance={3.4}/>
  </group>
}

function PileFixture({label,position,color}:{label:string;position:[number,number,number];color:string}){
  return <group position={position}>
    <mesh receiveShadow><boxGeometry args={[1.25,.14,1.72]}/><meshStandardMaterial color="#08111a" metalness={.82} roughness={.28}/></mesh>
    <mesh position={[0,.085,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.52,.57,4]}/><meshBasicMaterial color={color} transparent opacity={.44}/></mesh>
    <mesh position={[0,.07,.78]}><boxGeometry args={[.9,.035,.04]}/><meshBasicMaterial color={color}/></mesh>
    <pointLight position={[0,.42,0]} color={color} intensity={2.5} distance={2}/>
  </group>
}

function EffectRail({side}:{side:'local'|'opponent'}){
  const x=side==='local'?-5.5:5.5
  const color=side==='local'?'#6b43c9':'#c84478'
  return <group position={[x,.11,side==='local'?-2.15:2.15]}>
    <mesh><boxGeometry args={[1.15,.1,4.5]}/><meshStandardMaterial color="#080b13" metalness={.76} roughness={.3}/></mesh>
    <mesh position={[0,.07,0]}><boxGeometry args={[.045,.035,4.15]}/><meshBasicMaterial color={color}/></mesh>
  </group>
}

function DeckStack({count}:{count:number}){
  const layers=Math.max(1,Math.min(10,Math.ceil(count/4)))
  return <group position={[5.55,.16,3.05]}>
    <mesh position={[0,-.03,0]}><boxGeometry args={[1.4,.14,1.9]}/><meshStandardMaterial color="#0a121c" metalness={.86} roughness={.24}/></mesh>
    {Array.from({length:layers},(_,index)=><mesh key={index} position={[0,.08+index*.032,0]} rotation={[-Math.PI/2,0,0]} castShadow><boxGeometry args={[1.04,1.48,.032]}/><meshStandardMaterial color={index===layers-1?'#172131':'#080d13'} metalness={.3} roughness={.46}/></mesh>)}
    <pointLight position={[0,.55,0]} intensity={4.2} distance={2.4} color="#e7bd52"/>
  </group>
}
