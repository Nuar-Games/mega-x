import { useEffect, useRef, useState } from 'react'
import type { ArenaLegalCommand, ArenaState } from './ArenaState'
import { ArenaLiveController } from './live/ArenaLiveController'
import { createArenaPrototypeGame } from './prototype/ArenaPrototypeGame'
import { ArenaPrototypeScene } from './prototype/ArenaPrototypeScene'

const RUNTIME_HOST_ID='arena-next-runtime-host'

export function ArenaNextRuntime({allowPracticeBootstrap=true}:{allowPracticeBootstrap?:boolean}){
  const hostRef=useRef<HTMLDivElement|null>(null)
  const controllerRef=useRef<ArenaLiveController|null>(null)
  const gameRef=useRef<ReturnType<typeof createArenaPrototypeGame>|null>(null)
  const transitionRef=useRef(Promise.resolve())
  const [state,setState]=useState<ArenaState|null>(null)
  const [error,setError]=useState('')

  useEffect(()=>{
    let cancelled=false
    const controller=new ArenaLiveController({
      allowPracticeBootstrap,
      onUpdate:({state:next,events})=>{
        if(cancelled)return
        setState(next)
        const game=gameRef.current
        if(!game)return
        transitionRef.current=transitionRef.current.then(async()=>{
          if(cancelled||!gameRef.current)return
          const scene=game.scene.getScene('arena-prototype') as ArenaPrototypeScene
          if(events.length===0){scene.rebuildFromState(next);return}
          for(const event of events)await scene.consumeEvent(event,next)
        }).catch((e)=>setError(e instanceof Error?e.message:'ARENA_TRANSITION_FAILED'))
      },
      onError:(message)=>{if(!cancelled)setError(message)},
    })
    controllerRef.current=controller
    void controller.start().then((initial)=>{
      if(cancelled||!hostRef.current)return
      setState(initial)
      gameRef.current=createArenaPrototypeGame(RUNTIME_HOST_ID,initial)
    }).catch((e)=>{if(!cancelled)setError(e instanceof Error?e.message:'ARENA_START_FAILED')})
    return()=>{
      cancelled=true
      controller.stop()
      controllerRef.current=null
      gameRef.current?.destroy(true)
      gameRef.current=null
    }
  },[allowPracticeBootstrap])

  const cardName=(cardId:number|undefined)=>{
    if(cardId===undefined||!state)return ''
    const hand=state.players[state.identity.localPlayerIndex].hand
    return hand?.find((card)=>card.id===cardId)?.name??`CARD ${cardId}`
  }

  const dispatch=(command:ArenaLegalCommand)=>{void controllerRef.current?.dispatch(command).catch(()=>undefined)}

  return <main style={{position:'fixed',inset:0,overflow:'hidden',background:'#101216',zIndex:99999}}>
    <div id={RUNTIME_HOST_ID} ref={hostRef} style={{position:'absolute',inset:0}} />
    <div style={{position:'absolute',left:12,top:12,right:12,zIndex:20,pointerEvents:'none',font:'700 14px/1.2 system-ui',letterSpacing:'.08em',color:'#fff'}}>
      {error?`ARENA NEXT · ${error.replaceAll('_',' ')}`:state?`ARENA NEXT · ${state.identity.mode.toUpperCase()} · V${state.stateVersion} · ROUND ${state.round} · ${state.phase}`:'ARENA NEXT · LOADING'}
    </div>
    {state&&state.legalCommands.length>0&&<div style={{position:'absolute',left:10,right:10,bottom:10,zIndex:21,display:'flex',gap:8,overflowX:'auto'}}>
      {state.legalCommands.map((command,index)=><button key={`${command.action}-${command.cardId??''}-${command.position??''}-${command.slot??''}-${index}`} onClick={()=>dispatch(command)} disabled={state.connection.networkBusy} style={{flex:'0 0 auto',padding:'12px 14px',fontWeight:800}}>
        {command.action==='SET_VS'?`SET ${cardName(command.cardId)} · ${command.position}`:command.action.replaceAll('_',' ')}
      </button>)}
    </div>}
  </main>
}
