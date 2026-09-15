import Phaser from 'phaser'
import type { ArenaRenderState } from './ArenaStateAdapter'

const cardSources=(state:ArenaRenderState)=>{
  const values=[
    ...state.localHand,
    state.localVs,state.opponentVs,
    state.localDiscard,state.opponentDiscard,
    state.localZonX,state.opponentZonX,
    ...state.localEffects,...state.opponentEffects,
  ]
  return Array.from(new Set(values.filter(Boolean).map(card=>card!.src)))
}

export class ArenaTexturePool{
  private queued=new Set<string>()
  private pendingRefresh=false
  constructor(private scene:Phaser.Scene,private refresh:()=>void){}

  preloadState(state:ArenaRenderState){
    for(const src of cardSources(state)){
      const key=`asset:${src}`
      if(!this.scene.textures.exists(key))this.scene.load.image(key,src)
    }
  }

  ensureState(state:ArenaRenderState){
    const missing=cardSources(state).filter(src=>!this.scene.textures.exists(`asset:${src}`)&&!this.queued.has(src))
    if(!missing.length)return
    for(const src of missing){
      this.queued.add(src)
      this.scene.load.image(`asset:${src}`,src)
    }
    if(!this.pendingRefresh){
      this.pendingRefresh=true
      this.scene.load.once(Phaser.Loader.Events.COMPLETE,()=>{
        this.pendingRefresh=false
        for(const src of missing)this.queued.delete(src)
        this.refresh()
      })
    }
    if(!this.scene.load.isLoading())this.scene.load.start()
  }
}
