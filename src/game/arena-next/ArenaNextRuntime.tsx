import { useEffect, useRef, useState } from 'react'
import type { ActiveOnlineMatch, OnlineSession } from '../../onlineAuth'
import type { ArenaState } from './ArenaState'
import { ArenaLiveController } from './live/ArenaLiveController'
import { createArenaPrototypeGame } from './prototype/ArenaPrototypeGame'
import { ArenaPrototypeScene } from './prototype/ArenaPrototypeScene'

const RUNTIME_HOST_ID='arena-next-runtime-host'

type ArenaNextRuntimeProps={
  allowPracticeBootstrap?:boolean
  session?:OnlineSession|null
  match?:ActiveOnlineMatch|null
}

export function ArenaNextRuntime({allowPracticeBootstrap=true,session=null,match=null}:ArenaNextRuntimeProps){
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
      sessionOverride:session,
      matchOverride:match,
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
      const game=createArenaPrototypeGame(RUNTIME_HOST_ID,initial)
      gameRef.current=game
      const scene=game.scene.getScene('arena-prototype') as ArenaPrototypeScene
      scene.setCommandDispatcher((command)=>{void controller.dispatch(command).catch(()=>undefined)})
    }).catch((e)=>{if(!cancelled)setError(e instanceof Error?e.message:'ARENA_START_FAILED')})
    return()=>{
      cancelled=true
      controller.stop()
      controllerRef.current=null
      gameRef.current?.destroy(true)
      gameRef.current=null
    }
  },[allowPracticeBootstrap,session?.accessToken,session?.userId,match?.id])

  return <main style={{position:'fixed',inset:0,overflow:'hidden',background:'#101216',zIndex:99999}}>
    <div id={RUNTIME_HOST_ID} ref={hostRef} style={{position:'absolute',inset:0}} />
    <div style={{position:'absolute',left:12,top:12,right:12,zIndex:20,pointerEvents:'none',font:'700 14px/1.2 system-ui',letterSpacing:'.08em',color:'#fff'}}>
      {error?`ARENA NEXT · ${error.replaceAll('_',' ')}`:state?`ARENA NEXT · ${state.identity.mode.toUpperCase()} · V${state.stateVersion} · ROUND ${state.round} · ${state.phase}`:'ARENA NEXT · LOADING'}
    </div>
  </main>
}
