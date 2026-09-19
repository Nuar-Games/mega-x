import Phaser from 'phaser'
import type { ArenaState } from '../ArenaState'
import { ArenaPrototypeScene } from './ArenaPrototypeScene'

export function createArenaPrototypeGame(parent:string,initialState:ArenaState){
  return new Phaser.Game({
    type:Phaser.WEBGL,
    parent,
    backgroundColor:'#111317',
    width:window.innerWidth,
    height:window.innerHeight,
    scale:{
      mode:Phaser.Scale.RESIZE,
      autoCenter:Phaser.Scale.CENTER_BOTH,
      width:window.innerWidth,
      height:window.innerHeight,
    },
    render:{antialias:true,pixelArt:false,roundPixels:false},
    callbacks:{
      preBoot:(game)=>{
        game.registry.set('arena-prototype-initial-state',initialState)
      },
    },
    scene:[ArenaPrototypeScene],
  })
}
