import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Arena3DRoot } from './Arena3DRoot'

export type LegacyArenaVisibility={
  element:HTMLElement|null
  opacity:string
  pointerEvents:string
}

export function shouldUseArena3D(search:string){
  return new URLSearchParams(search).get('arena')==='3d'
}

export async function mountArena3D(shell:HTMLElement,legacyVisibility?:LegacyArenaVisibility):Promise<()=>void>{
  const existingHost=shell.querySelector<HTMLElement>('[data-arena-3d-host]')
  if(existingHost)existingHost.remove()

  const legacy=legacyVisibility?.element ?? shell.querySelector<HTMLElement>('.mx3-canvas')
  const previousOpacity=legacyVisibility?.opacity ?? legacy?.style.opacity ?? ''
  const previousPointerEvents=legacyVisibility?.pointerEvents ?? legacy?.style.pointerEvents ?? ''

  if(legacy){
    legacy.style.opacity='0'
    legacy.style.pointerEvents='none'
  }

  const host=document.createElement('div')
  host.dataset.arena3dHost='true'
  Object.assign(host.style,{position:'fixed',inset:'0',zIndex:'40',overflow:'hidden',background:'#03060b',touchAction:'none',overscrollBehavior:'none'})
  shell.appendChild(host)

  const restoreLegacy=()=>{
    if(!legacy)return
    legacy.style.opacity=previousOpacity
    legacy.style.pointerEvents=previousPointerEvents
  }

  let root:Root|null=null
  try{
    root=createRoot(host)
    root.render(<StrictMode><Arena3DRoot shell={shell}/></StrictMode>)
    document.body.classList.add('mx-arena-3d-enabled')
  }catch(error){
    root?.unmount()
    host.remove()
    restoreLegacy()
    document.body.classList.remove('mx-arena-3d-enabled')
    throw error
  }

  return () => {
    root?.unmount()
    host.remove()
    restoreLegacy()
    document.body.classList.remove('mx-arena-3d-enabled')
  }
}
