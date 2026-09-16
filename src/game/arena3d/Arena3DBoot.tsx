import { createRoot, type Root } from 'react-dom/client'
import { StrictMode } from 'react'

export function shouldUseArena3D(search:string){
  return new URLSearchParams(search).get('arena')==='3d'
}

function BootSurface(){
  return <div data-arena-3d-boot="true" style={{position:'absolute',inset:0,display:'grid',placeItems:'center',background:'#03060b',color:'#f4f7fb',fontFamily:'Oxanium, sans-serif',letterSpacing:'0.08em',fontWeight:800,zIndex:1}}>LOADING 3D ARENA</div>
}

export async function mountArena3D(shell:HTMLElement):Promise<()=>void>{
  const existing=shell.querySelector<HTMLElement>('[data-arena-3d-root]')
  if(existing)existing.remove()

  const legacy=shell.querySelector<HTMLElement>('.mx3-canvas')
  const previousOpacity=legacy?.style.opacity ?? ''
  const previousPointerEvents=legacy?.style.pointerEvents ?? ''

  const host=document.createElement('div')
  host.dataset.arena3dRoot='true'
  Object.assign(host.style,{position:'fixed',inset:'0',width:'100vw',height:'100dvh',zIndex:'40',overflow:'hidden',background:'#03060b'})
  shell.appendChild(host)

  let root:Root|null=null
  try{
    root=createRoot(host)
    root.render(<StrictMode><BootSurface/></StrictMode>)
    if(legacy){
      legacy.style.opacity='0'
      legacy.style.pointerEvents='none'
    }
    document.body.classList.add('mx-arena-3d-enabled')
  }catch(error){
    root?.unmount()
    host.remove()
    if(legacy){
      legacy.style.opacity=previousOpacity
      legacy.style.pointerEvents=previousPointerEvents
    }
    document.body.classList.remove('mx-arena-3d-enabled')
    throw error
  }

  return () => {
    root?.unmount()
    host.remove()
    if(legacy){
      legacy.style.opacity=previousOpacity
      legacy.style.pointerEvents=previousPointerEvents
    }
    document.body.classList.remove('mx-arena-3d-enabled')
  }
}
