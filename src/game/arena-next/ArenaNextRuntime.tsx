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
  const gameRef=useRef<ReturnType<typeof createArenaPrototypeGame>['game']|null>(null)
  const sceneRef=useRef<ArenaPrototypeScene|null>(null)
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
        setError('')
        const scene=sceneRef.current
        if(!scene)return
        transitionRef.current=transitionRef.current.then(async()=>{
          if(cancelled||sceneRef.current!==scene)return
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
      setError('')
      const {game,scene}=createArenaPrototypeGame(RUNTIME_HOST_ID,initial)
      gameRef.current=game
      sceneRef.current=scene
      scene.setCommandDispatcher((command)=>{void controller.dispatch(command).catch(()=>undefined)})
    }).catch((e)=>{if(!cancelled)setError(e instanceof Error?e.message:'ARENA_START_FAILED')})
    return()=>{
      cancelled=true
      controller.stop()
      controllerRef.current=null
      sceneRef.current=null
      gameRef.current?.destroy(true)
      gameRef.current=null
    }
  },[allowPracticeBootstrap,session?.accessToken,session?.userId,match?.id])

  const practiceGameOver=state?.identity.mode==='practice'&&state.phase==='GAME_OVER'
  const localVsPosition=state?.players[state.identity.localPlayerIndex].vs?.position??''
  const localLegalActions=state?.legalCommands.map(command=>command.action).join(',')??''
  const connectionStatus=state?.connection.status??''

  return <main style={{position:'fixed',inset:0,overflow:'hidden',background:'#101216',zIndex:99999}}>
    <div id={RUNTIME_HOST_ID} ref={hostRef} style={{position:'absolute',inset:0}} />
    <div data-arena-status="true" data-local-vs-position={localVsPosition} data-local-legal-actions={localLegalActions} data-connection-status={connectionStatus} style={{position:'absolute',left:12,top:12,right:12,zIndex:20,pointerEvents:'none',font:'700 14px/1.2 system-ui',letterSpacing:'.08em',color:'#fff'}}>
      {error?`ARENA NEXT · ${error.replaceAll('_',' ')}`:state?`ARENA NEXT · ${state.identity.mode.toUpperCase()} · V${state.stateVersion} · ROUND ${state.round} · ${state.phase}`:'ARENA NEXT · LOADING'}
    </div>
    {practiceGameOver&&<section style={{position:'absolute',left:'50%',bottom:24,transform:'translateX(-50%)',zIndex:30,width:'min(92vw,520px)',padding:18,border:'1px solid rgba(255,215,96,.55)',background:'rgba(5,8,14,.94)',color:'#fff',textAlign:'center',font:'700 14px/1.3 system-ui'}}>
      <div style={{marginBottom:14,letterSpacing:'.08em'}}>LEADERBOARD POINTS WERE NOT RECORDED</div>
      <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
        <button type="button" onClick={()=>window.dispatchEvent(new CustomEvent('mega-x:open-sign-in'))}>SIGN IN</button>
        <button type="button" onClick={()=>window.dispatchEvent(new CustomEvent('mega-x:start-practice-match'))}>PLAY AGAIN AS GUEST</button>
      </div>
    </section>}
  </main>
}
