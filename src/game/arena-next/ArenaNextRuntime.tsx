import { useEffect, useMemo, useRef, useState } from 'react'
import type { ActiveOnlineMatch, OnlineSession } from '../../onlineAuth'
import { ArenaBoardChrome } from './ArenaBoardChrome'
import { ArenaCardInspect, type ArenaInspectSelection } from './ArenaCardInspect'
import type { ArenaLegalCommand, ArenaState } from './ArenaState'
import { deriveArenaPointerTargets, type ArenaPointerTarget } from './ArenaPointerTargets'
import { ArenaLiveController } from './live/ArenaLiveController'
import { createArenaPrototypeGame } from './prototype/ArenaPrototypeGame'
import { createArenaBoardLayout } from './prototype/ArenaPrototypeLayout'
import { ArenaPrototypeScene } from './prototype/ArenaPrototypeScene'

const RUNTIME_HOST_ID='arena-next-runtime-host'
const PRESENTATION_TIMER_SECONDS=20

type ArenaNextRuntimeProps={
  allowPracticeBootstrap?:boolean
  session?:OnlineSession|null
  match?:ActiveOnlineMatch|null
}

type PointerSnapshot={version:number;targets:ArenaPointerTarget[]}

export function ArenaNextRuntime({allowPracticeBootstrap=true,session=null,match=null}:ArenaNextRuntimeProps){
  const hostRef=useRef<HTMLDivElement|null>(null)
  const controllerRef=useRef<ArenaLiveController|null>(null)
  const gameRef=useRef<ReturnType<typeof createArenaPrototypeGame>['game']|null>(null)
  const sceneRef=useRef<ArenaPrototypeScene|null>(null)
  const transitionRef=useRef(Promise.resolve())
  const [state,setState]=useState<ArenaState|null>(null)
  const [pointerSnapshot,setPointerSnapshot]=useState<PointerSnapshot>({version:-1,targets:[]})
  const [error,setError]=useState('')
  const [pinnedInspect,setPinnedInspect]=useState<ArenaInspectSelection|null>(null)
  const [hoverInspect,setHoverInspect]=useState<ArenaInspectSelection|null>(null)
  const [timerSeconds,setTimerSeconds]=useState(PRESENTATION_TIMER_SECONDS)
  const [viewport,setViewport]=useState(()=>({width:window.innerWidth,height:window.innerHeight}))

  const publishPointerTargets=(next:ArenaState)=>{
    setPointerSnapshot({version:next.stateVersion,targets:deriveArenaPointerTargets(next,window.innerWidth,window.innerHeight)})
  }

  useEffect(()=>{
    const resize=()=>setViewport({width:window.innerWidth,height:window.innerHeight})
    window.addEventListener('resize',resize)
    return()=>window.removeEventListener('resize',resize)
  },[])

  useEffect(()=>{
    if(!state)return
    publishPointerTargets(state)
  },[viewport.width,viewport.height])

  useEffect(()=>{
    setTimerSeconds(PRESENTATION_TIMER_SECONDS)
    if(!state||state.phase==='GAME_OVER')return
    const started=Date.now()
    const interval=window.setInterval(()=>{
      const elapsed=(Date.now()-started)/1000
      setTimerSeconds(Math.max(0,Math.ceil(PRESENTATION_TIMER_SECONDS-elapsed)))
    },250)
    return()=>window.clearInterval(interval)
  },[state?.stateVersion,state?.phase,state?.effectTurnIndex,state?.attackTurnIndex])

  useEffect(()=>{
    setPinnedInspect(null)
    setHoverInspect(null)
  },[state?.stateVersion])

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
        if(!scene){publishPointerTargets(next);return}
        transitionRef.current=transitionRef.current.then(async()=>{
          if(cancelled||sceneRef.current!==scene)return
          if(events.length===0)scene.rebuildFromState(next)
          else for(const event of events)await scene.consumeEvent(event,next)
          if(cancelled||sceneRef.current!==scene)return
          publishPointerTargets(next)
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
      scene.setInspectDispatcher((selection,mode)=>{
        if(mode==='click'){
          setPinnedInspect(selection)
          setHoverInspect(null)
          return
        }
        setHoverInspect(selection)
      })
      publishPointerTargets(initial)
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

  const local=state?.identity.localPlayerIndex??0
  const opponent=(local===0?1:0) as 0|1
  const layout=useMemo(()=>state?createArenaBoardLayout(viewport.width,viewport.height,local):null,[state,viewport.width,viewport.height,local])
  const activeInspect=pinnedInspect??hoverInspect
  const legalInspectCommands=useMemo(()=>{
    if(!state||!pinnedInspect||pinnedInspect.source!=='HAND')return []
    const card=pinnedInspect.cards[pinnedInspect.index]
    if(!card)return []
    return state.legalCommands.filter(command=>command.cardId===card.id&&(command.action==='SET_VS'||command.action==='PLAY_EFFECT'))
  },[state,pinnedInspect])

  const playFromInspect=(command:ArenaLegalCommand)=>{
    setPinnedInspect(null)
    void controllerRef.current?.dispatch(command).catch(()=>undefined)
  }

  const moveInspect=(index:number)=>{
    if(pinnedInspect){setPinnedInspect({...pinnedInspect,index});return}
    if(hoverInspect)setHoverInspect({...hoverInspect,index})
  }

  const practiceGameOver=state?.identity.mode==='practice'&&state.phase==='GAME_OVER'
  const localVsPosition=state?.players[local].vs?.position??''
  const localLegalActions=state?.legalCommands.map(command=>command.action).join(',')??''
  const connectionStatus=state?.connection.status??''
  const networkBusy=state?.connection.networkBusy?'true':'false'
  const legalPointerTargets=JSON.stringify(pointerSnapshot.targets)
  const selfDiscard=state?.pendingChoice?.kind==='SELF_DISCARD'?state.pendingChoice.value:null
  const selfDiscardMode=selfDiscard?.mode??''
  const selfDiscardCount=selfDiscard?.count??0
  const localVsY=layout?.vs[local].y??-1
  const opponentVsY=layout?.vs[opponent].y??-1
  const timerProgress=Math.max(0,Math.min(1,timerSeconds/PRESENTATION_TIMER_SECONDS))

  return <main data-arena-board-version="2" style={{position:'fixed',inset:0,overflow:'hidden',background:'#020308',zIndex:99999}}>
    {layout&&state&&<div style={{position:'absolute',inset:0,zIndex:10,transition:'filter .16s ease',filter:pinnedInspect?'blur(5px) brightness(.72)':'none'}}>
      <ArenaBoardChrome state={state} layout={layout} timerSeconds={timerSeconds} timerProgress={timerProgress}/>
    </div>}

    <div id={RUNTIME_HOST_ID} ref={hostRef} aria-hidden="true" style={{position:'absolute',inset:0,zIndex:20,opacity:.001}} />

    <div
      data-arena-status="true"
      data-arena-mode={state?.identity.mode.toUpperCase()??'LOADING'}
      data-arena-version={state?.stateVersion??-1}
      data-arena-round={state?.round??0}
      data-arena-phase={state?.phase??'LOADING'}
      data-arena-error={error}
      data-local-vs-position={localVsPosition}
      data-local-legal-actions={localLegalActions}
      data-connection-status={connectionStatus}
      data-network-busy={networkBusy}
      data-legal-target-version={pointerSnapshot.version}
      data-legal-targets={legalPointerTargets}
      data-self-discard-mode={selfDiscardMode}
      data-self-discard-count={selfDiscardCount}
      data-local-vs-y={localVsY}
      data-opponent-vs-y={opponentVsY}
      data-arena-viewport-height={viewport.height}
      style={{display:'none'}}
    />

    {error&&<div data-arena-error-banner="true" style={{position:'absolute',left:'50%',top:12,transform:'translateX(-50%)',zIndex:95,padding:'8px 12px',border:'1px solid #ff5f5f',borderRadius:8,background:'rgba(30,3,8,.94)',color:'#fff',font:'700 12px/1.2 system-ui'}}>{error}</div>}

    {activeInspect&&<ArenaCardInspect
      selection={activeInspect}
      localPlayerIndex={local}
      legalCommands={pinnedInspect?legalInspectCommands:[]}
      hoverOnly={!pinnedInspect&&Boolean(hoverInspect)}
      onIndex={moveInspect}
      onClose={()=>{setPinnedInspect(null);setHoverInspect(null)}}
      onPlay={playFromInspect}
    />}

    {practiceGameOver&&<section style={{position:'absolute',left:'50%',bottom:24,transform:'translateX(-50%)',zIndex:90,width:'min(92vw,520px)',padding:18,border:'1px solid rgba(255,215,96,.55)',background:'rgba(5,8,14,.94)',color:'#fff',textAlign:'center',font:'700 14px/1.3 system-ui'}}>
      <div style={{marginBottom:14,letterSpacing:'.08em'}}>LEADERBOARD POINTS WERE NOT RECORDED</div>
      <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
        <button type="button" onClick={()=>window.dispatchEvent(new CustomEvent('mega-x:open-sign-in'))}>SIGN IN</button>
        <button type="button" onClick={()=>window.dispatchEvent(new CustomEvent('mega-x:start-practice-match'))}>PLAY AGAIN AS GUEST</button>
      </div>
    </section>}
  </main>
}
