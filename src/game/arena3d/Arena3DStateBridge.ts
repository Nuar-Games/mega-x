import { readArenaRenderState, type ArenaRenderState } from '../arena/ArenaStateAdapter'

export function readArena3DState(shell:HTMLElement):ArenaRenderState{
  return readArenaRenderState(shell)
}

export function dispatchArena3DAction(shell:HTMLElement,actionId:string):boolean{
  const selector=`[data-arena-action-id="${CSS.escape(actionId)}"]`
  const button=shell.querySelector<HTMLButtonElement>(selector)
  if(!button||button.disabled)return false
  button.click()
  return true
}

export function subscribeArena3DState(shell:HTMLElement,listener:(state:ArenaRenderState)=>void):()=>void{
  let frame=0
  const emit=()=>{
    cancelAnimationFrame(frame)
    frame=requestAnimationFrame(()=>listener(readArenaRenderState(shell)))
  }
  const observer=new MutationObserver(emit)
  observer.observe(shell,{subtree:true,childList:true,attributes:true,characterData:true})
  emit()
  return ()=>{
    observer.disconnect()
    cancelAnimationFrame(frame)
  }
}
