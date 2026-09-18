import type { ArenaRenderState, ArenaCardRef } from '../arena/ArenaStateAdapter'
import { Arena3DCard } from './Arena3DCard'

type Props={state:ArenaRenderState;onPrimary:(id:string)=>void;onSecondary:(card:ArenaCardRef)=>void}

const handX=(index:number,count:number)=>{
  const spread=Math.min(1.02,6.1/Math.max(1,count))
  return (index-(count-1)/2)*spread
}

const qaHandSize=()=>{
  if(typeof window==='undefined')return 0
  const params=new URLSearchParams(window.location.search)
  if(params.get('qa3dHitboxes')!=='1')return 0
  const requested=Number(params.get('qaHandSize')||0)
  return Number.isInteger(requested)&&requested>0?Math.min(7,requested):0
}

export function Arena3DZonesVSFirst({state,onPrimary,onSecondary}:Props){
  const fullLocalHand=state.localHand.slice(-7)
  const requestedQaHandSize=qaHandSize()
  const localHand=requestedQaHandSize?fullLocalHand.slice(0,requestedQaHandSize):fullLocalHand
  return <group>
    <VsStage position={[0,.09,1.62]} color="#1da9f1" active={Boolean(state.localVs)}/>
    <VsStage position={[0,.09,-1.62]} color="#ef3d5f" active={Boolean(state.opponentVs)}/>

    <Arena3DCard card={state.localVs} position={[0,.35,1.62]} scale={1.72} onPrimary={onPrimary} onSecondary={onSecondary} qaId="local-vs"/>
    <Arena3DCard card={state.opponentVs} position={[0,.35,-1.62]} rotation={[-Math.PI/2,0,Math.PI]} scale={1.72} onPrimary={onPrimary} onSecondary={onSecondary} qaId="opponent-vs"/>

    {localHand.map((card,index)=><Arena3DCard
      key={`hand-${card.src}-${index}`}
      card={card}
      position={[handX(index,localHand.length),.23,4.25+Math.abs(index-(localHand.length-1)/2)*.035]}
      rotation={[-Math.PI/2,0,(index-(localHand.length-1)/2)*-.025]}
      scale={.72}
      onPrimary={onPrimary}
      onSecondary={onSecondary}
      qaId={`hand-${index}-${card.alt||card.src}`}
    />)}

    <UtilityPad label="DISCARD" position={[-5.05,.1,3.1]} color="#268ec4"/>
    <UtilityPad label="ZON X" position={[-5.05,.1,1.45]} color="#d8b64f"/>
    <UtilityPad label="ZON X" position={[5.05,.1,-1.45]} color="#d8b64f"/>
    <UtilityPad label="DISCARD" position={[5.05,.1,-3.1]} color="#b7354d"/>

    <Arena3DCard card={state.localDiscard} position={[-5.05,.23,3.1]} scale={.52} dimmed onSecondary={onSecondary}/>
    <Arena3DCard card={state.opponentDiscard} position={[5.05,.23,-3.1]} rotation={[-Math.PI/2,0,Math.PI]} scale={.52} dimmed onSecondary={onSecondary}/>
    <Arena3DCard card={state.localZonX} position={[-5.05,.23,1.45]} scale={.56} dimmed={!state.localZonX} onPrimary={onPrimary} onSecondary={onSecondary}/>
    <Arena3DCard card={state.opponentZonX} position={[5.05,.23,-1.45]} rotation={[-Math.PI/2,0,Math.PI]} scale={.56} dimmed={!state.opponentZonX} onPrimary={onPrimary} onSecondary={onSecondary}/>

    <EffectRail side="local"/>
    <EffectRail side="opponent"/>
    {state.localEffects.slice(0,3).map((card,index)=><Arena3DCard key={`le-${card.src}-${index}`} card={card} position={[-4.72,.24,-.4-index*1.28]} scale={.48} dimmed={!card.actionId} onPrimary={onPrimary} onSecondary={onSecondary}/>) }
    {state.opponentEffects.slice(0,3).map((card,index)=><Arena3DCard key={`oe-${card.src}-${index}`} card={card} position={[4.72,.24,.4+index*1.28]} rotation={[-Math.PI/2,0,Math.PI]} scale={.48} dimmed={!card.actionId} onPrimary={onPrimary} onSecondary={onSecondary}/>) }

    <DeckStack count={state.deckCount}/>
  </group>
}

function VsStage({position,color,active}:{position:[number,number,number];color:string;active:boolean}){
  return <group position={position}>
    <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[3.05,3.75]}/><meshStandardMaterial color="#071019" metalness={.72} roughness={.29}/></mesh>
    <mesh position={[0,.018,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.22,1.31,64]}/><meshBasicMaterial color={color} transparent opacity={active?.92:.42}/></mesh>
    <mesh position={[0,.023,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.42,1.45,64]}/><meshBasicMaterial color={color} transparent opacity={active?.36:.14}/></mesh>
    <pointLight position={[0,.95,0]} color={color} intensity={active?11:3.2} distance={4.2}/>
  </group>
}

function UtilityPad({position,color}:{label:string;position:[number,number,number];color:string}){
  return <group position={position}>
    <mesh receiveShadow><boxGeometry args={[1.02,.1,1.46]}/><meshStandardMaterial color="#08111a" metalness={.82} roughness={.28}/></mesh>
    <mesh position={[0,.065,.62]}><boxGeometry args={[.68,.028,.035]}/><meshBasicMaterial color={color} transparent opacity={.82}/></mesh>
  </group>
}

function EffectRail({side}:{side:'local'|'opponent'}){
  const x=side==='local'?-4.72:4.72
  const color=side==='local'?'#5d58d6':'#cf4776'
  return <group position={[x,.105,side==='local'?-1.6:1.6]}>
    <mesh><boxGeometry args={[.98,.08,3.95]}/><meshStandardMaterial color="#080b13" metalness={.76} roughness={.3}/></mesh>
    <mesh position={[0,.055,0]}><boxGeometry args={[.035,.026,3.55]}/><meshBasicMaterial color={color} transparent opacity={.8}/></mesh>
  </group>
}

function DeckStack({count}:{count:number}){
  const layers=Math.max(1,Math.min(10,Math.ceil(count/4)))
  return <group position={[5.05,.14,3.2]}>
    <mesh position={[0,-.03,0]}><boxGeometry args={[1.15,.11,1.62]}/><meshStandardMaterial color="#0a121c" metalness={.86} roughness={.24}/></mesh>
    {Array.from({length:layers},(_,index)=><mesh key={index} position={[0,.06+index*.026,0]} rotation={[-Math.PI/2,0,0]} castShadow><boxGeometry args={[.86,1.24,.025]}/><meshStandardMaterial color={index===layers-1?'#172131':'#080d13'} metalness={.3} roughness={.46}/></mesh>)}
    <pointLight position={[0,.48,0]} intensity={3.4} distance={2.1} color="#e7bd52"/>
  </group>
}
