import {
  getMyActiveMatch,
  getSavedSession,
  heartbeatMatch,
  submitMatchEngineAction,
  submitMatchSpecialAction,
  subscribeToMatchChanges,
  type ActiveOnlineMatch,
  type OnlineSession,
} from '../../../onlineAuth'
import type { ArenaEventEnvelope } from '../ArenaEvents'
import type { ArenaLegalCommand, ArenaState } from '../ArenaState'
import { deriveArenaEvents } from './ArenaEventDiff'
import { projectActiveMatchToArenaState } from './ArenaStateProjection'

type ArenaLiveUpdate={state:ArenaState;events:ArenaEventEnvelope[]}
type ArenaLiveOptions={
  onUpdate?:(update:ArenaLiveUpdate)=>void
  onError?:(message:string)=>void
}

const SPECIAL_ACTIONS=new Set(['TIE_PICK','RESOLVE_VISIBLE_EFFECT_CHOICE'])

function sameCommand(a:ArenaLegalCommand,b:ArenaLegalCommand){
  return a.action===b.action&&a.cardId===b.cardId&&a.position===b.position&&a.slot===b.slot
}

export class ArenaLiveController{
  private session:OnlineSession|null=null
  private match:ActiveOnlineMatch|null=null
  private state:ArenaState|null=null
  private unsubscribe:()=>void=()=>undefined
  private heartbeatTimer=0
  private fallbackTimer=0
  private signalTimer=0
  private stopped=false
  private refreshing=false
  private busy=false
  private sequence=0

  constructor(private readonly options:ArenaLiveOptions={}){}

  get currentState(){return this.state}

  async start(){
    const session=getSavedSession()
    if(!session)throw new Error('NO_SAVED_SESSION')
    this.session=session
    const match=await getMyActiveMatch(session)
    if(!match)throw new Error('NO_ACTIVE_MATCH')
    const initial=projectActiveMatchToArenaState(match,session.userId)
    this.match=match
    this.state=initial
    this.stopped=false
    this.sequence=0
    this.connectSignals(match.id)
    return initial
  }

  stop(){
    this.stopped=true
    this.unsubscribe()
    this.unsubscribe=()=>undefined
    window.clearInterval(this.heartbeatTimer)
    window.clearTimeout(this.fallbackTimer)
    window.clearTimeout(this.signalTimer)
  }

  async dispatch(command:ArenaLegalCommand){
    if(!this.session||!this.match||!this.state||this.busy)return
    if(!this.state.legalCommands.some((legal)=>sameCommand(legal,command)))throw new Error('ILLEGAL_ARENA_COMMAND')
    this.busy=true
    this.publishBusy(true,null)
    try{
      const submit=SPECIAL_ACTIONS.has(command.action)?submitMatchSpecialAction:submitMatchEngineAction
      const payload:Record<string,unknown>={}
      if(command.cardId!==undefined)payload.cardId=command.cardId
      if(command.position!==undefined)payload.position=command.position
      if(command.slot!==undefined)payload.slot=command.slot
      if(command.cardIds!==undefined)payload.cardIds=command.cardIds
      const result=await submit(this.session,this.match.id,this.match.state_version,command.action,payload)
      const nextMatch:ActiveOnlineMatch={
        ...this.match,
        state:result.state,
        state_version:Number(result.state_version),
        phase:String(result.phase),
        status:result.status as ActiveOnlineMatch['status'],
      }
      this.acceptMatch(nextMatch)
    }catch(error){
      const message=error instanceof Error?error.message:'MATCH_ACTION_FAILED'
      if(message.includes('STALE_MATCH_STATE'))await this.refresh('STALE_REFRESH')
      else this.options.onError?.(message)
      throw error
    }finally{
      this.busy=false
      this.publishBusy(false,null)
    }
  }

  private connectSignals(matchId:string){
    if(!this.session)return
    const session=this.session
    this.unsubscribe=subscribeToMatchChanges(session,matchId,()=>{
      window.clearTimeout(this.signalTimer)
      this.signalTimer=window.setTimeout(()=>{void this.refresh('RECOVERY')},40)
    })
    void heartbeatMatch(session,matchId).catch(()=>undefined)
    this.heartbeatTimer=window.setInterval(()=>{void heartbeatMatch(session,matchId).catch(()=>undefined)},20_000)
    const schedule=()=>{
      const delay=document.visibilityState==='hidden'?30_000:5_000
      this.fallbackTimer=window.setTimeout(async()=>{
        if(this.stopped)return
        await this.refresh('RECOVERY').catch(()=>undefined)
        if(!this.stopped)schedule()
      },delay)
    }
    schedule()
  }

  private async refresh(reason:'STALE_REFRESH'|'RECOVERY'){
    if(this.stopped||this.refreshing||!this.session)return
    this.refreshing=true
    try{
      const match=await getMyActiveMatch(this.session)
      if(!match){this.options.onError?.('NO_ACTIVE_MATCH');return}
      if(!this.match||match.id!==this.match.id){
        this.match=match
        const state=projectActiveMatchToArenaState(match,this.session.userId)
        this.state=state
        const event:ArenaEventEnvelope={matchId:state.identity.matchId,sequence:++this.sequence,fromVersion:state.stateVersion,toVersion:state.stateVersion,event:{type:'STATE_RECONCILED',reason}}
        this.options.onUpdate?.({state,events:[event]})
        return
      }
      this.acceptMatch(match,reason)
    }finally{this.refreshing=false}
  }

  private acceptMatch(match:ActiveOnlineMatch,reconcileReason:'STALE_REFRESH'|'RECOVERY'='RECOVERY'){
    if(!this.session)return
    if(this.match&&match.id===this.match.id&&Number(match.state_version)<Number(this.match.state_version))return
    const previous=this.state
    const next=projectActiveMatchToArenaState(match,this.session.userId)
    this.match=match
    this.state=next
    if(!previous){this.options.onUpdate?.({state:next,events:[]});return}
    if(next.stateVersion===previous.stateVersion){
      if(next.connection.status!==previous.connection.status||next.connection.reconnectDeadline!==previous.connection.reconnectDeadline){
        const event:ArenaEventEnvelope={matchId:next.identity.matchId,sequence:++this.sequence,fromVersion:previous.stateVersion,toVersion:next.stateVersion,event:{type:'STATE_RECONCILED',reason:reconcileReason}}
        this.options.onUpdate?.({state:next,events:[event]})
      }
      return
    }
    const events=deriveArenaEvents(previous,next,this.sequence)
    if(events.length)this.sequence=events[events.length-1].sequence
    this.options.onUpdate?.({state:next,events})
  }

  private publishBusy(networkBusy:boolean,lastError:string|null){
    if(!this.state)return
    const next={...this.state,connection:{...this.state.connection,networkBusy,lastError}}
    this.state=next
    this.options.onUpdate?.({state:next,events:[]})
  }
}
