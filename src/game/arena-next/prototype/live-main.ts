import type Phaser from 'phaser'
import type { ArenaLegalCommand, ArenaState } from '../ArenaState'
import { ArenaLiveController } from '../live/ArenaLiveController'
import { createArenaPrototypeGame } from './ArenaPrototypeGame'
import { ArenaPrototypeScene } from './ArenaPrototypeScene'

const host=document.getElementById('arena-next-live')
const status=document.getElementById('arena-next-live-status')
const controls=document.getElementById('arena-next-live-controls')
if(!host||!status||!controls)throw new Error('ARENA_LIVE_HOST_MISSING')

let game:Phaser.Game|null=null
let latestState:ArenaState|null=null
let transition=Promise.resolve()

const cardName=(state:ArenaState,cardId:number|undefined)=>{
  if(cardId===undefined)return ''
  const local=state.players[state.identity.localPlayerIndex]
  return local.hand?.find((card)=>card.id===cardId)?.name??`CARD ${cardId}`
}

const labelFor=(state:ArenaState,command:ArenaLegalCommand)=>{
  if(command.action==='SET_VS')return `SET ${cardName(state,command.cardId)} · ${command.position}`
  if(command.action==='PLAY_EFFECT')return `EFFECT · ${cardName(state,command.cardId)}`
  if(command.action==='RESOLVE_BOARD_CHOICE')return `CHOOSE CARD ${command.cardId}`
  if(command.action==='RESOLVE_VISIBLE_EFFECT_CHOICE')return `CHOOSE EFFECT ${command.cardId}`
  if(command.action==='RESOLVE_HIDDEN_CHOICE')return `HIDDEN SLOT ${(command.slot??0)+1}`
  if(command.action==='TIE_PICK')return `TIE PICK · ${cardName(state,command.cardId)}`
  return command.action.replaceAll('_',' ')
}

const controller=new ArenaLiveController({
  onUpdate:({state,events})=>{
    latestState=state
    renderStatus(state)
    renderControls(state)
    if(!game)return
    transition=transition.then(async()=>{
      if(!game)return
      const scene=game.scene.getScene('arena-prototype') as ArenaPrototypeScene
      if(events.length===0){scene.rebuildFromState(state);return}
      for(const event of events)await scene.consumeEvent(event,state)
    }).catch((error)=>showError(error instanceof Error?error.message:'ARENA_TRANSITION_FAILED'))
  },
  onError:(message)=>showError(message),
})

function renderStatus(state:ArenaState){
  const busy=state.connection.networkBusy?' · SENDING':''
  const connection=state.connection.status.toUpperCase()
  status.textContent=`LIVE MATCH · ${connection} · V${state.stateVersion} · ROUND ${state.round} · ${state.phase}${busy}`
}

function renderControls(state:ArenaState){
  controls.replaceChildren()
  const commands=state.legalCommands
  if(commands.length===0)return
  for(const command of commands){
    const button=document.createElement('button')
    button.type='button'
    button.textContent=labelFor(state,command)
    button.disabled=state.connection.networkBusy
    button.addEventListener('click',()=>{
      if(command.action==='SET_VS'){
        void controller.dispatch({action:'SET_VS',cardId:command.cardId,position:command.position}).catch(()=>undefined)
        return
      }
      void controller.dispatch(command).catch(()=>undefined)
    })
    controls.append(button)
  }
}

function showError(message:string){
  status.textContent=`ARENA LIVE · ${message.replaceAll('_',' ')}`
}

async function boot(){
  try{
    const initial=await controller.start()
    latestState=initial
    game=createArenaPrototypeGame('arena-next-live',initial)
    renderStatus(initial)
    renderControls(initial)
  }catch(error){
    showError(error instanceof Error?error.message:'ARENA_LIVE_START_FAILED')
  }
}

void boot()

window.addEventListener('beforeunload',()=>{
  controller.stop()
  game?.destroy(true)
  game=null
  latestState=null
})
