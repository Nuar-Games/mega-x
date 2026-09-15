import Phaser from 'phaser'
import { ArenaScene } from './ArenaScene'
import { ARENA_ASSETS } from './ArenaAssets'

export type ArenaHandle={destroy:()=>void;refresh:()=>void}

export function bootstrapArena(shell:HTMLElement):ArenaHandle{
  const legacy=shell.querySelector<HTMLElement>('.mx3-canvas')
  if(legacy){legacy.style.opacity='0';legacy.style.pointerEvents='none'}

  const legacyAudio=document.querySelector<HTMLElement>('#mx-audio-controls')
  const previousAudioDisplay=legacyAudio?.style.display ?? ''
  if(legacyAudio)legacyAudio.style.display='none'

  let scene:ArenaScene
  const host=document.createElement('div')
  host.id='mx-clean-arena'
  Object.assign(host.style,{position:'fixed',inset:'0',width:'100vw',height:'100dvh',zIndex:'30',overflow:'hidden',background:'#05070b'})

  const boot=document.createElement('div')
  Object.assign(boot.style,{position:'absolute',inset:'0',display:'grid',placeItems:'center',background:'#03060b',zIndex:'2',transition:'opacity 220ms ease'})
  const mark=document.createElement('img')
  mark.src=ARENA_ASSETS.arenaUi.loadingMark
  mark.alt='Loading arena'
  Object.assign(mark.style,{width:'clamp(88px,16vw,160px)',height:'auto',opacity:'0.9'})
  boot.appendChild(mark)
  host.appendChild(boot)
  shell.appendChild(host)
  mark.animate([{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:1100,iterations:Infinity})

  scene=new ArenaScene(shell)
  scene.events.once(Phaser.Scenes.Events.CREATE,()=>{
    boot.style.opacity='0'
    window.setTimeout(()=>boot.remove(),240)
  })
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
      if(legacyAudio)legacyAudio.style.display=previousAudioDisplay
    },
  }
}
