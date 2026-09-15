import Phaser from 'phaser'
import { ArenaScene } from './ArenaScene'

export type ArenaHandle={destroy:()=>void;refresh:()=>void}

export function bootstrapArena(shell:HTMLElement):ArenaHandle{
  const legacy=shell.querySelector<HTMLElement>('.mx3-canvas')
  if(legacy){legacy.style.opacity='0';legacy.style.pointerEvents='none'}

  let scene:ArenaScene
  const host=document.createElement('div')
  host.id='mx-clean-arena'
  Object.assign(host.style,{position:'fixed',inset:'0',width:'100vw',height:'100dvh',zIndex:'30',overflow:'hidden',background:'#05070b'})
  shell.appendChild(host)

  scene=new ArenaScene(shell)
  const game=new Phaser.Game({
    type:Phaser.AUTO,
    parent:host,
    backgroundColor:'#05070b',
    transparent:false,
    scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH,width:window.innerWidth,height:window.innerHeight},
    render:{antialias:true,pixelArt:false,roundPixels:false},
    scene:[scene],
    audio:{disableWebAudio:false},
  })

  let frame=0
  const observer=new MutationObserver(()=>{
    cancelAnimationFrame(frame)
    frame=requestAnimationFrame(()=>scene.renderArena())
  })
  observer.observe(shell,{subtree:true,childList:true,attributes:true,characterData:true})

  return {
    refresh:()=>scene.renderArena(true),
    destroy:()=>{
      observer.disconnect()
      cancelAnimationFrame(frame)
      game.destroy(true)
      host.remove()
      if(legacy){legacy.style.opacity='';legacy.style.pointerEvents=''}
    },
  }
}
