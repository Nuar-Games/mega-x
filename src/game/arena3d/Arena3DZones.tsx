import type { ArenaRenderState, ArenaCardRef } from '../arena/ArenaStateAdapter'
import { Arena3DCard } from './Arena3DCard'

type Props={state:ArenaRenderState;onPrimary:(id:string)=>void;onSecondary:(card:ArenaCardRef)=>void}

const handX=(index:number,count:number)=>{
  const spread=Math.min(1.35,7.5/Math.max(1,count))
  return (index-(count-1)/2)*spread
}

export function Arena3DZones({state,onPrimary,onSecondary}:Props){
  const localHand=state.localHand.slice(-7)
  return <group>
    {localHand.map((card,index)=><Arena3DCard key={`hand-${card.src}-${index}`} card={card} position={[handX(index,localHand.length),0.14,4.2+Math.abs(index-(localHand.length-1)/2)*0.08]} rotation={[-Math.PI/2,0,(index-(localHand.length-1)/2)*-0.025]} scale={.82} onPrimary={onPrimary} onSecondary={onSecondary}/>) }
    <Arena3DCard card={state.localVs} position={[-2.0,.2,.15]} scale={1.18} onPrimary={onPrimary} onSecondary={onSecondary}/>
    <Arena3DCard card={state.opponentVs} position={[2.0,.2,-.15]} rotation={[-Math.PI/2,0,Math.PI]} scale={1.18} onPrimary={onPrimary} onSecondary={onSecondary}/>
    <Arena3DCard card={state.localDiscard} position={[-6.4,.16,3.35]} scale={.58} dimmed onSecondary={onSecondary}/>
    <Arena3DCard card={state.opponentDiscard} position={[6.4,.16,-3.35]} rotation={[-Math.PI/2,0,Math.PI]} scale={.58} dimmed onSecondary={onSecondary}/>
    <Arena3DCard card={state.localZonX} position={[-6.4,.16,1.2]} scale={.62} dimmed={!state.localZonX} onPrimary={onPrimary} onSecondary={onSecondary}/>
    <Arena3DCard card={state.opponentZonX} position={[6.4,.16,-1.2]} rotation={[-Math.PI/2,0,Math.PI]} scale={.62} dimmed={!state.opponentZonX} onPrimary={onPrimary} onSecondary={onSecondary}/>
    {state.localEffects.slice(0,3).map((card,index)=><Arena3DCard key={`le-${card.src}-${index}`} card={card} position={[-6.4,.16,-1.2-index*1.65]} scale={.5} dimmed={!card.actionId} onPrimary={onPrimary} onSecondary={onSecondary}/>) }
    {state.opponentEffects.slice(0,3).map((card,index)=><Arena3DCard key={`oe-${card.src}-${index}`} card={card} position={[6.4,.16,1.2+index*1.65]} rotation={[-Math.PI/2,0,Math.PI]} scale={.5} dimmed={!card.actionId} onPrimary={onPrimary} onSecondary={onSecondary}/>) }
    <DeckStack count={state.deckCount}/>
  </group>
}

function DeckStack({count}:{count:number}){
  const layers=Math.max(1,Math.min(8,Math.ceil(count/5)))
  return <group position={[6.4,.1,3.45]}>{Array.from({length:layers},(_,index)=><mesh key={index} position={[0,index*.025,0]} rotation={[-Math.PI/2,0,0]} castShadow><boxGeometry args={[.95,1.35,.035]}/><meshStandardMaterial color={index===layers-1?'#111923':'#080d13'} metalness={.32} roughness={.5}/></mesh>)}</group>
}
