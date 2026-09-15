import Phaser from 'phaser'
import { ArenaScene } from './ArenaScene'
import { ARENA_ASSETS } from './ArenaAssets'
import { chooseArenaPerformanceProfile } from './ArenaPerformance'

export type ArenaHandle={destroy:()=>void;refresh:()=>void}

export function bootstrapArena(shell:HTMLElement):ArenaHandle{
  const legacy=shell.querySelector<HTMLElement>('.mx3-canvas')
  if(legacy){legacy.style.opacity='0';legacy.style.pointerEvents='none'}

  const legacyAudio=document.querySelector<HTMLElement>('#mx-audio-controls')
  const previousAudioDisplay=legacyAudio?.style.display ?? ''
  if(legacyAudio)legacyAudio.style.display='none'

  const profile=chooseArenaPerformanceProfile()
  shell.dataset.mxQuality=profile.quality

  let scene:ArenaScene
  const host=document.createElement('div')
  host.id='mx-clean-arena'
  Object.assign(host.style,{position:'fixed',inset:'0',width:'100vw',height:'100dvh',zIndex:'30',overflow:'hidden',background:'#05070b'})

  const fullscreen=document.createElement('button')
  fullscreen.type='button'
  fullscreen.dataset.mxFullscreen='true'
  fullscreen.setAttribute('aria-label','Toggle fullscreen')
  fullscreen.textContent='⛶'
  Object.assign(fullscreen.style,{position:'absolute',right:'10px',top:'10px',zIndex:'120',width:'42px',height:'42px',border:'1px solid rgba(255,255,255,.2)',borderRadius:'10px',background:'rgba(3,6,11,.72)',color:'#fff',fontSize:'24px',lineHeight:'1',cursor:'pointer',backdropFilter:'blur(8px)'})
  fullscreen.addEventListener('click',async()=>{
    try{
      if(document.fullscreenElement)await document.exitFullscreen()
      else if(host.requestFullscreen)await host.requestFullscreen()
    }catch{}
  })
  document.addEventListener('fullscreenchange',()=>{
    fullscreen.textContent=document.fullscreenElement?'×':'⛶'
    fullscreen.setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen')
  })

  const boot=document.createElement('div')
  Object.assign(boot.style,{position:'absolute',inset:'0',display:'grid',placeItems:'center',background:'#03060b',zIndex:'2',transition:'opacity 220ms ease'})
  const mark=document.createElement('img')
  mark.src=ARENA_ASSETS.arenaUi.loadingMark
  mark.alt='Loading arena'
  Object.assign(mark.style,{width:'clamp(88px,16vw,160px)',height:'auto',opacity:'0.9'})
  boot.appendChild(mark)
  host.appendChild(boot)
  host.appendChild(fullscreen)
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
    resolution:profile.resolution,
    scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH,width:window.innerWidth,height:window.innerHeight},
    render:{antialias:profile.antialias,pixelArt:false,roundPixels:profile.quality==='low'},
    fps:{target:profile.targetFps,forceSetTimeOut:profile.quality==='low'},
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
      if(document.fullscreenElement===host)void document.exitFullscreen().catch(()=>undefined)
      game.destroy(true)
      host.remove()
      if(legacy){legacy.style.opacity='';legacy.style.pointerEvents=''}
      if(legacyAudio)legacyAudio.style.display=previousAudioDisplay
    },
  }
}
