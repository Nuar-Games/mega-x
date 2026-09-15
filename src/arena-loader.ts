import type { ArenaHandle } from './game/arena/bootstrapArena'

let handle:ArenaHandle|null=null
let shell:HTMLElement|null=null
let loading=false

async function syncArena(){
  const next=document.querySelector<HTMLElement>('.duel-shell')
  if(!next){
    handle?.destroy()
    handle=null
    shell=null
    return
  }
  if(next===shell&&handle)return
  if(loading)return
  handle?.destroy()
  handle=null
  shell=next
  loading=true
  try{
    const { bootstrapArena }=await import('./game/arena/bootstrapArena')
    if(document.contains(next))handle=bootstrapArena(next)
  }finally{loading=false}
}

const root=document.getElementById('root')??document.body
const observer=new MutationObserver(()=>void syncArena())
observer.observe(root,{childList:true,subtree:true})
window.addEventListener('popstate',()=>void syncArena())
window.addEventListener('hashchange',()=>void syncArena())
void syncArena()
