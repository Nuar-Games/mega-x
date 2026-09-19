import type { ArenaState } from '../ArenaState'
import { ArenaLiveController } from '../live/ArenaLiveController'
import { createArenaPrototypeGame } from './ArenaPrototypeGame'
import { ArenaPrototypeScene } from './ArenaPrototypeScene'
import { signInWithEmail } from '../../../onlineAuth'

function requiredElement(id:string){
  const element=document.getElementById(id)
  if(!element)throw new Error(`ARENA_LIVE_HOST_MISSING:${id}`)
  return element
}

const host=requiredElement('arena-next-live')
const status=requiredElement('arena-next-live-status')
const controls=requiredElement('arena-next-live-controls')
void host

const onlineOnly=new URLSearchParams(location.search).get('mode')==='online'
let game:ReturnType<typeof createArenaPrototypeGame>|null=null
let transition=Promise.resolve()

const controller=new ArenaLiveController({
  allowPracticeBootstrap:!onlineOnly,
  onUpdate:({state,events})=>{
    clearAuthPanel()
    renderStatus(state)
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
  const mode=state.identity.mode==='practice'?'PRACTICE ENGINE':'LIVE MATCH'
  status.textContent=`${mode} · ${connection} · V${state.stateVersion} · ROUND ${state.round} · ${state.phase}${busy}`
}

function wireCommandSurface(){
  if(!game)return
  const scene=game.scene.getScene('arena-prototype') as ArenaPrototypeScene
  scene.setCommandDispatcher((command)=>{void controller.dispatch(command).catch(()=>undefined)})
}

function clearAuthPanel(){
  document.getElementById('arena-next-auth-panel')?.remove()
}

function showOnlineSignIn(){
  clearAuthPanel()
  controls.replaceChildren()
  status.textContent='ONLINE TEST · SIGN IN TO MEGA X'
  const panel=document.createElement('div')
  panel.id='arena-next-auth-panel'
  panel.style.cssText='position:fixed;left:24px;top:90px;z-index:20;display:grid;gap:10px;width:min(360px,calc(100vw - 48px));padding:16px;background:#15181d;border:1px solid #59616c;color:white;font-family:Arial,sans-serif'
  const email=document.createElement('input')
  email.type='email'; email.placeholder='EMAIL'; email.autocomplete='email'; email.style.cssText='padding:12px;background:#0d0f12;color:white;border:1px solid #59616c'
  const password=document.createElement('input')
  password.type='password'; password.placeholder='PASSWORD'; password.autocomplete='current-password'; password.style.cssText='padding:12px;background:#0d0f12;color:white;border:1px solid #59616c'
  const button=document.createElement('button')
  button.type='button'; button.textContent='SIGN IN'; button.style.cssText='padding:12px;font-weight:700'
  const message=document.createElement('div')
  message.style.cssText='min-height:20px;font-size:12px;opacity:.8'
  button.addEventListener('click',async()=>{
    if(!email.value.trim()||password.value.length<6)return
    button.disabled=true; message.textContent='SIGNING IN…'
    try{
      await signInWithEmail(email.value.trim(),password.value)
      message.textContent='SIGNED IN. LOADING MATCH…'
      await boot()
    }catch(error){
      message.textContent=(error instanceof Error?error.message:'SIGN_IN_FAILED').replaceAll('_',' ')
      button.disabled=false
    }
  })
  panel.append(email,password,button,message)
  document.body.append(panel)
}

function showOpenLobby(){
  clearAuthPanel()
  controls.replaceChildren()
  status.textContent='ONLINE TEST · NO ACTIVE MATCH'
  const panel=document.createElement('div')
  panel.id='arena-next-auth-panel'
  panel.style.cssText='position:fixed;left:24px;top:90px;z-index:20;display:grid;gap:10px;width:min(360px,calc(100vw - 48px));padding:16px;background:#15181d;border:1px solid #59616c;color:white;font-family:Arial,sans-serif'
  const copy=document.createElement('div')
  copy.textContent='You are signed in on this preview. Start or join an online match in the Mega X lobby, then return here.'
  const button=document.createElement('button')
  button.type='button'; button.textContent='OPEN MEGA X LOBBY'; button.style.cssText='padding:12px;font-weight:700'
  button.addEventListener('click',()=>{location.href='/'})
  panel.append(copy,button)
  document.body.append(panel)
}

function showError(message:string){
  const normalized=message.replaceAll('_',' ')
  if(onlineOnly&&message.includes('NO_SAVED_SESSION')){showOnlineSignIn();return}
  if(onlineOnly&&message.includes('NO_ACTIVE_MATCH')){showOpenLobby();return}
  status.textContent=`ARENA LIVE · ${normalized}`
}

async function boot(){
  try{
    const initial=await controller.start()
    clearAuthPanel()
    controls.replaceChildren()
    if(!game)game=createArenaPrototypeGame('arena-next-live',initial)
    else (game.scene.getScene('arena-prototype') as ArenaPrototypeScene).rebuildFromState(initial)
    wireCommandSurface()
    renderStatus(initial)
  }catch(error){
    showError(error instanceof Error?error.message:'ARENA_LIVE_START_FAILED')
  }
}

void boot()

window.addEventListener('beforeunload',()=>{
  controller.stop()
  game?.destroy(true)
  game=null
})
