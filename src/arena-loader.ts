import type { ArenaHandle } from './game/arena/bootstrapArena'

let cleanHandle:ArenaHandle|null=null
let cleanShell:HTMLElement|null=null
let cleanLoading=false
let destroy3D:(()=>void)|null=null
let arena3DShell:HTMLElement|null=null
let arena3DLoading=false

const initialArenaMode=new URLSearchParams(window.location.search).get('arena')

async function stopCleanArena(){
  cleanHandle?.destroy()
  cleanHandle=null
  cleanShell=null
  document.body.classList.remove('mx-clean-arena-enabled')
}

function stop3DArena(){
  destroy3D?.()
  destroy3D=null
  arena3DShell=null
  document.body.classList.remove('mx-arena-3d-enabled')
}

function requestedArenaMode(){
  const liveMode=new URLSearchParams(window.location.search).get('arena')
  return liveMode ?? initialArenaMode
}

async function syncArena(){
  const mode=requestedArenaMode()
  const next=document.querySelector<HTMLElement>('.duel-shell')

  if(mode==='3d'){
    await stopCleanArena()
    if(!next){stop3DArena();return}
    if(next===arena3DShell&&destroy3D)return
    if(arena3DLoading)return
    stop3DArena()
    arena3DShell=next
    arena3DLoading=true
    try{
      const { mountArena3D }=await import('./game/arena3d/Arena3DBoot')
      if(document.contains(next))destroy3D=await mountArena3D(next)
    }catch(error){
      console.error('[Mega X] 3D arena boot failed; using fallback arena.',error)
      stop3DArena()
    }finally{
      arena3DLoading=false
    }
    return
  }

  stop3DArena()

  if(mode!=='clean'){
    await stopCleanArena()
    return
  }

  document.body.classList.add('mx-clean-arena-enabled')
  if(!next){
    await stopCleanArena()
    return
  }
  if(next===cleanShell&&cleanHandle)return
  if(cleanLoading)return
  cleanHandle?.destroy()
  cleanHandle=null
  cleanShell=next
  cleanLoading=true
  try{
    const { bootstrapArena }=await import('./game/arena/bootstrapArena')
    if(document.contains(next))cleanHandle=bootstrapArena(next)
  }finally{
    cleanLoading=false
  }
}

const root=document.getElementById('root')??document.body
const observer=new MutationObserver(()=>void syncArena())
observer.observe(root,{childList:true,subtree:true})
window.addEventListener('popstate',()=>void syncArena())
window.addEventListener('hashchange',()=>void syncArena())
void syncArena()
