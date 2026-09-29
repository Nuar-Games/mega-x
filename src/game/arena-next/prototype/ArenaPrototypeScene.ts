import Phaser from 'phaser'
import type { ArenaInspectSelection } from '../ArenaCardInspect'
import type { ArenaEventEnvelope } from '../ArenaEvents'
import type { ArenaCardState, ArenaLegalCommand, ArenaState, ArenaStats } from '../ArenaState'
import { deriveArenaCommandTargets } from '../ArenaCommandSurface'
import { arenaActionPoint, arenaHandPoint, createArenaBoardLayout, type ArenaPrototypeLayout, type ArenaPrototypeRect } from './ArenaPrototypeLayout'

const PANEL=0x101725
const PANEL_DARK=0x070b13
const LINE=0x334057
const TEXT='#f7f8fb'
const MUTED='#9da8ba'
const FLASH=0xffffff
const BLUE=0x268cff
const RED=0xff3d45
const GOLD=0xffd448
const BACK_SRC='/cards/back-game.webp'

type InspectMode='click'|'hover'
type InspectDispatcher=(selection:ArenaInspectSelection|null,mode:InspectMode)=>void

export class ArenaPrototypeScene extends Phaser.Scene {
  private currentState:ArenaState|null=null
  private arenaRoot:Phaser.GameObjects.Container|null=null
  private commandDispatcher:((command:ArenaLegalCommand)=>void)|null=null
  private inspectDispatcher:InspectDispatcher|null=null
  private selectedSelfDiscardIds=new Set<number>()
  private selfDiscardChoiceKey=''
  private loadingTextures=new Set<string>()

  constructor(){super('arena-prototype')}
  init(data:{state?:ArenaState}){this.currentState=data?.state??null}

  setCommandDispatcher(dispatcher:((command:ArenaLegalCommand)=>void)|null){
    this.commandDispatcher=dispatcher
    if(this.currentState)this.rebuildFromState(this.currentState)
  }

  setInspectDispatcher(dispatcher:InspectDispatcher|null){
    this.inspectDispatcher=dispatcher
    if(this.currentState)this.rebuildFromState(this.currentState)
  }

  create(){
    const registryState=this.registry.get('arena-prototype-initial-state') as ArenaState|undefined
    if(!this.currentState&&registryState)this.currentState=registryState
    if(this.currentState)this.rebuildFromState(this.currentState)
    this.scale.on(Phaser.Scale.Events.RESIZE,()=>{if(this.currentState)this.rebuildFromState(this.currentState)})
  }

  rebuildFromState(state:ArenaState){
    this.currentState=state
    this.syncSelfDiscardSelection(state)
    this.arenaRoot?.destroy(true)
    const root=this.add.container(0,0)
    this.arenaRoot=root
    const local=state.identity.localPlayerIndex
    const opponent=(local===0?1:0) as 0|1
    const layout=createArenaBoardLayout(this.scale.width,this.scale.height,local)

    const background=this.add.rectangle(layout.viewport.width/2,layout.viewport.height/2,layout.viewport.width,layout.viewport.height,0x03050a,1)
    const board=this.add.rectangle(layout.board.x,layout.board.y,layout.board.width,layout.board.height,0x07101e,0.98).setStrokeStyle(1,0x42516b,0.8)
    const upperTint=this.add.rectangle(layout.board.x,layout.board.height*0.25,layout.board.width,layout.board.height*0.5,0x3d0810,0.18)
    const lowerTint=this.add.rectangle(layout.board.x,layout.board.height*0.75,layout.board.width,layout.board.height*0.5,0x062a52,0.18)
    const centerLine=this.add.rectangle(layout.board.x,layout.centerLineY,layout.board.width*0.82,2,0xb32632,0.72)
    root.add([background,board,upperTint,lowerTint,centerLine])

    this.drawFighterBar(root,layout,state,opponent,false)
    this.drawFighterBar(root,layout,state,local,true)
    this.drawOpponentHand(root,layout,state.players[opponent].handCount)
    this.drawMasterDeck(root,layout,state.deckCount)

    for(const player of [opponent,local] as const){
      const own=player===local
      this.drawZoneCounter(root,layout.zonX[player],'ZON X',state.players[player].zonX,player,own,'ZON_X')
      this.drawZoneCounter(root,layout.zonTepi[player],'ZON\nTEPI',state.players[player].zonTepi,player,own,'ZON_TEPI')
      this.drawVs(root,layout.vs[player],state.players[player].vs?.card??null,state.players[player].vs?.position??null,player,own)
      this.drawStats(root,layout.stats[player],state.players[player].stats,state.players[player].vs?.position??null,own)
      layout.effectSlots[player].forEach((slot,index)=>{
        const effect=state.players[player].effects[index]
        if(effect)this.drawArtCard(root,slot,effect.card,own?BLUE:RED,{owner:player,source:'EFFECT',cards:[effect.card],index:0})
        else this.drawEmptyEffect(root,slot,index+1,own)
      })
    }

    if(state.pendingChoice?.kind==='TIE')this.drawTieBreakerHand(root,layout,state)
    else this.drawHand(root,layout,state)
    this.drawCommandSurface(root,layout,state)
    this.drawTurnIndicator(root,layout,state)
    if(state.phase==='GAME_OVER')this.drawGameOver(root,layout,state)
  }

  consumeEvent(envelope:ArenaEventEnvelope,nextState:ArenaState):Promise<void>{
    if(envelope.matchId!==nextState.identity.matchId||envelope.toVersion!==nextState.stateVersion)return this.reconcileState(nextState)
    const event=envelope.event
    let animation:Promise<void>
    switch(event.type){
      case 'VS_SET': animation=this.animateVsSet(event.player,event.cardId); break
      case 'CARD_DRAWN': animation=this.animateDraw(event.player,event.cardId,event.count); break
      case 'EFFECT_PLAYED': animation=this.animateEffectPlayed(event.player,event.cardId); break
      case 'EFFECT_TRIGGERED': animation=this.animateEffectTriggered(event.player,event.cardId); break
      case 'ATTACK_DECLARED': animation=this.animateAttack(event.attacker,event.defender); break
      case 'CARD_CAPTURED': animation=this.animateZoneMove(event.fromPlayer,'VS',event.player,'ZON_X',event.cardId); break
      case 'CARD_DESTROYED': animation=this.animateZoneMove(event.owner,event.from,event.owner,event.destination,event.cardId); break
      case 'CARD_DISCARDED': animation=this.animateZoneMove(event.player,'HAND',event.player,'ZON_TEPI',event.cardId); break
      case 'STAT_CHANGED': animation=this.animateStatChange(event.player,event.after); break
      case 'PHASE_CHANGED': animation=this.animatePhaseChange(`PHASE · ${event.to}`); break
      case 'TURN_CHANGED': animation=this.animatePhaseChange('TURN'); break
      case 'STATE_RECONCILED': return this.reconcileState(nextState)
      default: this.rebuildFromState(nextState); return Promise.resolve()
    }
    return animation.then(()=>this.rebuildFromState(nextState))
  }

  private layout(){
    const local=this.currentState?.identity.localPlayerIndex??0
    return createArenaBoardLayout(this.scale.width,this.scale.height,local)
  }

  private animateVsSet(player:0|1,cardId:number){
    const layout=this.layout()
    const hand=this.currentState?.players[player].hand??[]
    const cardIndex=Math.max(0,hand.findIndex(card=>card.id===cardId))
    return this.animateToken(arenaHandPoint(cardIndex,Math.max(1,hand.length),layout),layout.vs[player],this.cardName(cardId),420)
  }

  private animateDraw(player:0|1,cardId:number|null,count:number){
    const layout=this.layout()
    const current=this.currentState
    const hand=current?.players[player].hand??[]
    const destination=player===current?.identity.localPlayerIndex?arenaHandPoint(hand.length,Math.max(1,hand.length+1),layout):layout.opponentHand
    return this.animateToken(layout.masterDeck,destination,cardId===null?`DRAW ×${count}`:this.cardName(cardId),360)
  }

  private animateEffectPlayed(player:0|1,cardId:number){
    const layout=this.layout()
    const current=this.currentState
    const hand=current?.players[player].hand??[]
    const cardIndex=Math.max(0,hand.findIndex(card=>card.id===cardId))
    const start=player===current?.identity.localPlayerIndex?arenaHandPoint(cardIndex,Math.max(1,hand.length),layout):layout.opponentHand
    const slotIndex=Math.max(0,current?.players[player].effects.findIndex(effect=>effect===null)??0)
    return this.animateToken(start,layout.effectSlots[player][slotIndex]??layout.effectSlots[player][0],this.cardName(cardId),360)
  }

  private animateEffectTriggered(player:0|1,cardId:number){
    const layout=this.layout()
    const effects=this.currentState?.players[player].effects??[]
    const slotIndex=Math.max(0,effects.findIndex(effect=>effect?.card.id===cardId))
    return this.animatePulse(layout.effectSlots[player][slotIndex]??layout.effectSlots[player][0],`EFFECT\n${this.cardName(cardId)}`,300)
  }

  private animateAttack(attacker:0|1,defender:0|1){
    const layout=this.layout()
    const from=layout.vs[attacker]
    const toward=layout.vs[defender]
    const body=this.add.rectangle(from.x,from.y,from.width*0.74,from.height*0.74,PANEL,1).setStrokeStyle(3,FLASH).setDepth(150)
    return new Promise<void>(resolve=>this.tweens.add({targets:body,x:Phaser.Math.Linear(from.x,toward.x,0.35),y:Phaser.Math.Linear(from.y,toward.y,0.35),duration:160,ease:'Cubic.easeIn',yoyo:true,hold:60,onComplete:()=>{body.destroy();resolve()}}))
  }

  private animateZoneMove(fromPlayer:0|1,fromZone:'VS'|'EFFECT'|'HAND',toPlayer:0|1,toZone:'ZON_TEPI'|'ZON_X',cardId:number|null){
    const layout=this.layout()
    const start=this.zonePoint(fromPlayer,fromZone,cardId,layout)
    const destination=toZone==='ZON_X'?layout.zonX[toPlayer]:layout.zonTepi[toPlayer]
    return this.animateToken(start,destination,cardId===null?'CARD':this.cardName(cardId),350)
  }

  private animateStatChange(player:0|1,stats:ArenaStats|null){
    const label=stats?`ATK ${stats.atk} · DEF ${stats.def} · STA ${stats.sta}`:'STATS CLEARED'
    return this.animatePulse(this.layout().stats[player],label,300)
  }

  private animatePhaseChange(label:string){return this.animatePulse(this.layout().turnIndicator,label,260)}

  private reconcileState(nextState:ArenaState){
    this.rebuildFromState(nextState)
    const layout=this.layout()
    const flash=this.add.rectangle(layout.board.x,layout.board.y,layout.board.width,layout.board.height,FLASH,0.07).setDepth(200)
    return new Promise<void>(resolve=>this.tweens.add({targets:flash,alpha:0,duration:140,onComplete:()=>{flash.destroy();resolve()}}))
  }

  private animateToken(start:{x:number;y:number},destination:{x:number;y:number;width?:number;height?:number},label:string,duration:number){
    const width=Math.max(54,Math.min(92,destination.width??76))
    const height=Math.max(76,Math.min(132,destination.height??108))
    const moving=this.add.container(start.x,start.y).setDepth(160)
    const body=this.add.rectangle(0,0,width,height,PANEL,1).setStrokeStyle(2,GOLD)
    const text=this.add.text(0,0,label,{fontFamily:'Arial, sans-serif',fontSize:'11px',color:TEXT,align:'center',wordWrap:{width:width*0.82}}).setOrigin(0.5)
    moving.add([body,text])
    return new Promise<void>(resolve=>this.tweens.add({targets:moving,x:destination.x,y:destination.y,duration,ease:'Cubic.easeInOut',onComplete:()=>{moving.destroy(true);resolve()}}))
  }

  private animatePulse(slot:{x:number;y:number;width:number;height:number},label:string,duration:number){
    const body=this.add.rectangle(slot.x,slot.y,slot.width,slot.height,PANEL,0.95).setStrokeStyle(3,GOLD).setDepth(170)
    const text=this.add.text(slot.x,slot.y,label,{fontFamily:'Arial, sans-serif',fontSize:'13px',color:TEXT,fontStyle:'bold',align:'center'}).setOrigin(0.5).setDepth(171)
    return new Promise<void>(resolve=>this.tweens.add({targets:[body,text],scaleX:1.06,scaleY:1.06,alpha:0.18,duration:duration/2,yoyo:true,onComplete:()=>{body.destroy();text.destroy();resolve()}}))
  }

  private zonePoint(player:0|1,zone:'VS'|'EFFECT'|'HAND',cardId:number|null,layout:ArenaPrototypeLayout){
    if(zone==='VS')return layout.vs[player]
    if(zone==='EFFECT'){
      const index=Math.max(0,this.currentState?.players[player].effects.findIndex(effect=>effect?.card.id===cardId)??0)
      return layout.effectSlots[player][index]??layout.effectSlots[player][0]
    }
    const hand=this.currentState?.players[player].hand??[]
    const index=Math.max(0,hand.findIndex(card=>card.id===cardId))
    return arenaHandPoint(index,Math.max(1,hand.length),layout)
  }

  private cardName(cardId:number){
    const state=this.currentState
    if(!state)return `CARD ${cardId}`
    for(const player of state.players){
      const candidates=[...(player.hand??[]),...player.zonTepi,...player.zonX]
      if(player.vs)candidates.push(player.vs.card)
      for(const effect of player.effects)if(effect)candidates.push(effect.card)
      const found=candidates.find(card=>card.id===cardId)
      if(found)return found.name
    }
    if(state.pendingChoice?.kind==='TIE'){
      const found=state.pendingChoice.value.hand.find(card=>card.id===cardId)
      if(found)return found.name
    }
    return `CARD ${cardId}`
  }

  private textureKey(src:string){return `arena-card:${src}`}
  private ensureTexture(src:string){
    const key=this.textureKey(src)
    if(this.textures.exists(key))return key
    if(this.loadingTextures.has(src))return null
    this.loadingTextures.add(src)
    const image=new Image()
    image.onload=()=>{
      this.loadingTextures.delete(src)
      if(!this.textures.exists(key))this.textures.addImage(key,image)
      if(this.currentState&&this.scene.isActive())this.rebuildFromState(this.currentState)
    }
    image.onerror=()=>this.loadingTextures.delete(src)
    image.src=src
    return null
  }

  private bindInspect(target:Phaser.GameObjects.GameObject,selection:ArenaInspectSelection){
    if(!this.inspectDispatcher)return
    target.setInteractive({useHandCursor:true})
    target.on('pointerdown',()=>this.inspectDispatcher?.(selection,'click'))
    target.on('pointerover',()=>this.inspectDispatcher?.(selection,'hover'))
    target.on('pointerout',()=>this.inspectDispatcher?.(null,'hover'))
  }

  private drawFighterBar(root:Phaser.GameObjects.Container,layout:ArenaPrototypeLayout,state:ArenaState,player:0|1,own:boolean){
    const slot=layout.nameplates[player]
    const color=own?BLUE:RED
    const body=this.add.rectangle(slot.x,slot.y,slot.width,slot.height,PANEL,0.9).setStrokeStyle(2,color,0.75)
    const kicker=this.add.text(slot.x-slot.width*0.45,slot.y-slot.height*0.18,own?'KAMU':'LAWAN',{fontFamily:'Arial, sans-serif',fontSize:'10px',color:own?'#6cb8ff':'#ff7a80',fontStyle:'bold'}).setOrigin(0,0.5)
    const name=this.add.text(slot.x-slot.width*0.45,slot.y+slot.height*0.12,state.players[player].handle,{fontFamily:'Arial, sans-serif',fontSize:'18px',color:TEXT,fontStyle:'bold'}).setOrigin(0,0.5)
    root.add([body,kicker,name])
  }

  private drawOpponentHand(root:Phaser.GameObjects.Container,layout:ArenaPrototypeLayout,count:number){
    const slot=layout.opponentHand
    const shown=Math.min(4,Math.max(1,count))
    for(let index=0;index<shown;index+=1){
      const width=Math.min(36,slot.width*0.38)
      const cardSlot={x:slot.x+(index-(shown-1)/2)*Math.min(17,width*0.52),y:slot.y,width,height:width*1.42}
      this.drawBackCard(root,cardSlot)
    }
    const badge=this.add.text(slot.x+slot.width*0.48,slot.y,`${count}`,{fontFamily:'Arial, sans-serif',fontSize:'15px',color:TEXT,fontStyle:'bold'}).setOrigin(0.5)
    root.add(badge)
  }

  private drawMasterDeck(root:Phaser.GameObjects.Container,layout:ArenaPrototypeLayout,count:number){
    this.drawBackCard(root,layout.masterDeck)
    const badge=this.add.circle(layout.masterDeck.x,layout.masterDeck.y+layout.masterDeck.height*0.48,18,0x082c1e,1).setStrokeStyle(2,0x57d99a)
    const text=this.add.text(badge.x,badge.y,`${count}`,{fontFamily:'Arial, sans-serif',fontSize:'13px',color:'#caffdf',fontStyle:'bold'}).setOrigin(0.5)
    root.add([badge,text])
  }

  private drawBackCard(root:Phaser.GameObjects.Container,slot:ArenaPrototypeRect){
    const texture=this.ensureTexture(BACK_SRC)
    const body=this.add.rectangle(slot.x,slot.y,slot.width,slot.height,0x07111f,1).setStrokeStyle(2,GOLD,0.7)
    root.add(body)
    if(texture){const image=this.add.image(slot.x,slot.y,texture).setDisplaySize(slot.width,slot.height);root.add(image)}
  }

  private drawVs(root:Phaser.GameObjects.Container,slot:ArenaPrototypeRect,card:ArenaCardState|null,position:'ATK'|'DEF'|null,player:0|1,own:boolean){
    const tagY=own?slot.y+slot.height*0.56:slot.y-slot.height*0.56
    const tag=this.add.text(slot.x,tagY,own?'KAD KAMU':'KAD LAWAN',{fontFamily:'Arial, sans-serif',fontSize:'11px',color:'#fff',fontStyle:'bold',backgroundColor:own?'#136dd2':'#c41f29',padding:{x:8,y:4}}).setOrigin(0.5).setDepth(20)
    root.add(tag)
    if(card)this.drawArtCard(root,slot,card,own?BLUE:RED,{owner:player,source:'VS',cards:[card],index:0})
    else this.drawCardPlaceholder(root,slot,'KAD VS',own?BLUE:RED)
    if(position){const pos=this.add.text(slot.x+slot.width*0.46,slot.y-slot.height*0.44,position,{fontFamily:'Arial, sans-serif',fontSize:'10px',color:'#fff',fontStyle:'bold',backgroundColor:own?'#136dd2':'#c41f29',padding:{x:5,y:3}}).setOrigin(0.5);root.add(pos)}
  }

  private drawStats(root:Phaser.GameObjects.Container,slot:ArenaPrototypeRect,stats:ArenaStats|null,position:'ATK'|'DEF'|null,own:boolean){
    const color=own?BLUE:RED
    const values=stats??{atk:0,def:0,sta:0}
    const body=this.add.rectangle(slot.x,slot.y,slot.width,slot.height,PANEL_DARK,0.86).setStrokeStyle(1,color,0.55)
    const lines=[`ATK   ${stats?values.atk:'—'}`,`DEF   ${stats?values.def:'—'}`,`STA   ${stats?values.sta:'—'}`]
    const text=this.add.text(slot.x-slot.width*0.42,slot.y-slot.height*0.29,lines.join('\n'),{fontFamily:'Arial, sans-serif',fontSize:'14px',lineSpacing:8,color:TEXT,fontStyle:'bold'}).setOrigin(0,0)
    const pos=this.add.text(slot.x,slot.y+slot.height*0.62,`POSISI ${position??'—'}`,{fontFamily:'Arial, sans-serif',fontSize:'10px',color:own?'#79bcff':'#ff8d92',fontStyle:'bold'}).setOrigin(0.5)
    root.add([body,text,pos])
  }

  private drawZoneCounter(root:Phaser.GameObjects.Container,slot:ArenaPrototypeRect,label:string,cards:ArenaCardState[],player:0|1,own:boolean,source:'ZON_X'|'ZON_TEPI'){
    const color=own?BLUE:RED
    const isZonX=source==='ZON_X'
    const body=isZonX
      ? this.add.circle(slot.x,slot.y,Math.min(slot.width,slot.height)*0.46,0x08101c,0.95).setStrokeStyle(2,color)
      : this.add.rectangle(slot.x,slot.y,slot.width,slot.height,0x17150a,0.9).setStrokeStyle(2,0xd8aa1e)
    const value=this.add.text(slot.x,slot.y+(isZonX?-4:-8),`${cards.length}`,{fontFamily:'Arial, sans-serif',fontSize:isZonX?'20px':'18px',color:isZonX?TEXT:'#ffe58c',fontStyle:'bold'}).setOrigin(0.5)
    const caption=this.add.text(slot.x,slot.y+18,label,{fontFamily:'Arial, sans-serif',fontSize:'8px',color:isZonX?(own?'#79bcff':'#ff8d92'):'#ffe58c',fontStyle:'bold',align:'center'}).setOrigin(0.5)
    root.add([body,value,caption])
    if(cards.length>0){const newestFirst=[...cards].reverse();this.bindInspect(body,{owner:player,source,cards:newestFirst,index:0})}
  }

  private drawArtCard(root:Phaser.GameObjects.Container,slot:ArenaPrototypeRect,card:ArenaCardState,borderColor:number,selection:ArenaInspectSelection,angle=0){
    const body=this.add.rectangle(slot.x,slot.y,slot.width,slot.height,PANEL_DARK,1).setStrokeStyle(2,borderColor,0.92).setRotation(angle)
    root.add(body)
    const texture=this.ensureTexture(card.artSrc)
    let target:Phaser.GameObjects.GameObject=body
    if(texture){const image=this.add.image(slot.x,slot.y,texture).setDisplaySize(slot.width,slot.height).setRotation(angle);root.add(image);target=image}
    else{const text=this.add.text(slot.x,slot.y,card.name,{fontFamily:'Arial, sans-serif',fontSize:'10px',color:TEXT,align:'center',wordWrap:{width:slot.width*0.82}}).setOrigin(0.5).setRotation(angle);root.add(text)}
    this.bindInspect(target,selection)
  }

  private drawEmptyEffect(root:Phaser.GameObjects.Container,slot:ArenaPrototypeRect,index:number,own:boolean){
    const color=own?BLUE:RED
    const body=this.add.rectangle(slot.x,slot.y,slot.width,slot.height,0x121722,0.44).setStrokeStyle(1,color,0.35)
    const text=this.add.text(slot.x,slot.y,`${index}`,{fontFamily:'Arial, sans-serif',fontSize:'13px',color:own?'#547eb2':'#9e4f56',fontStyle:'bold'}).setOrigin(0.5)
    root.add([body,text])
  }

  private drawCardPlaceholder(root:Phaser.GameObjects.Container,slot:ArenaPrototypeRect,label:string,color:number){
    const body=this.add.rectangle(slot.x,slot.y,slot.width,slot.height,PANEL_DARK,0.78).setStrokeStyle(2,color,0.5)
    const text=this.add.text(slot.x,slot.y,label,{fontFamily:'Arial, sans-serif',fontSize:'11px',color:MUTED,fontStyle:'bold'}).setOrigin(0.5)
    root.add([body,text])
  }

  private drawHand(root:Phaser.GameObjects.Container,layout:ArenaPrototypeLayout,state:ArenaState){
    const local=state.identity.localPlayerIndex
    const cards=state.players[local].hand??[]
    const width=Math.max(62,Math.min(92,layout.handBand.width/Math.max(4.5,cards.length+0.6)))
    const height=width*1.42
    cards.forEach((card,index)=>{const point=arenaHandPoint(index,Math.max(1,cards.length),layout);this.drawArtCard(root,{x:point.x,y:point.y,width,height},card,BLUE,{owner:local,source:'HAND',cards,index},point.angle)})
    const caption=this.add.text(layout.handBand.x-layout.handBand.width*0.48,layout.handBand.y-layout.handBand.height*0.56,`KAD DI TANGAN · ${state.players[local].handCount}`,{fontFamily:'Arial, sans-serif',fontSize:'10px',color:'#ffd448',fontStyle:'bold'}).setOrigin(0,0.5)
    root.add(caption)
  }

  private drawTieBreakerHand(root:Phaser.GameObjects.Container,layout:ArenaPrototypeLayout,state:ArenaState){
    if(state.pendingChoice?.kind!=='TIE')return
    const local=state.identity.localPlayerIndex
    const tie=state.pendingChoice.value
    const width=Math.max(62,Math.min(92,layout.handBand.width/Math.max(4.5,tie.hand.length+0.6)))
    const height=width*1.42
    tie.hand.forEach((card,index)=>{const point=arenaHandPoint(index,Math.max(1,tie.hand.length),layout);this.drawArtCard(root,{x:point.x,y:point.y,width,height},card,BLUE,{owner:local,source:'HAND',cards:tie.hand,index},point.angle)})
    const status=tie.picked?'CHOICE LOCKED — WAITING FOR OPPONENT':`TIE BREAKER · CHOOSE 1 OF ${tie.hand.length}`
    const caption=this.add.text(layout.handBand.x,layout.handBand.y-layout.handBand.height*0.56,status,{fontFamily:'Arial, sans-serif',fontSize:'11px',color:TEXT,fontStyle:'bold'}).setOrigin(0.5)
    root.add(caption)
  }

  private drawTurnIndicator(root:Phaser.GameObjects.Container,layout:ArenaPrototypeLayout,state:ArenaState){
    const local=state.identity.localPlayerIndex
    const active=state.phase==='EFFECT'?state.effectTurnIndex:state.phase==='ATTACK'?state.attackTurnIndex:null
    const ownTurn=active===local
    const label=active===null?(state.phase==='SET_VS'?'SEDIA':'MENUNGGU'):ownTurn?'GILIRAN\nKAMU':'GILIRAN\nLAWAN'
    const color=ownTurn?BLUE:active===null?0x41516b:RED
    const radius=Math.min(layout.turnIndicator.width,layout.turnIndicator.height)*0.48
    const body=this.add.circle(layout.turnIndicator.x,layout.turnIndicator.y,radius,0x0c1729,0.95).setStrokeStyle(3,color)
    const text=this.add.text(layout.turnIndicator.x,layout.turnIndicator.y,label,{fontFamily:'Arial, sans-serif',fontSize:'12px',color:TEXT,fontStyle:'bold',align:'center'}).setOrigin(0.5)
    root.add([body,text])
  }

  private syncSelfDiscardSelection(state:ArenaState){
    const pending=state.pendingChoice?.kind==='SELF_DISCARD'?state.pendingChoice.value:null
    const key=pending?`${state.identity.matchId}:${state.stateVersion}:${pending.player}:${pending.count}:${pending.mode}:${pending.reason}`:''
    if(key!==this.selfDiscardChoiceKey){this.selfDiscardChoiceKey=key;this.selectedSelfDiscardIds.clear()}
  }

  private selfDiscardCanConfirm(state:ArenaState){
    if(state.pendingChoice?.kind!=='SELF_DISCARD')return false
    const pending=state.pendingChoice.value
    if(pending.player!==state.identity.localPlayerIndex)return false
    if(pending.mode==='EXACT')return this.selectedSelfDiscardIds.size===pending.count
    return true
  }

  private boardSlotForCard(state:ArenaState,layout:ArenaPrototypeLayout,cardId:number):ArenaPrototypeRect|null{
    if(state.pendingChoice?.kind!=='BOARD')return null
    const target=state.pendingChoice.value.target
    if(state.players[target].vs?.card.id===cardId)return layout.vs[target]
    const effectIndex=state.players[target].effects.findIndex(effect=>effect?.card.id===cardId)
    return effectIndex>=0?(layout.effectSlots[target][effectIndex]??null):null
  }

  private drawCommandSurface(root:Phaser.GameObjects.Container,layout:ArenaPrototypeLayout,state:ArenaState){
    if(state.phase==='GAME_OVER'||!this.commandDispatcher||state.connection.networkBusy)return
    const targets=deriveArenaCommandTargets(state)
    const actionTargets=targets.filter(target=>target.kind==='ACTION')
    const local=state.identity.localPlayerIndex
    const hand=state.players[local].hand??[]
    const tieHand=state.pendingChoice?.kind==='TIE'?state.pendingChoice.value.hand:[]

    for(const target of targets){
      if(target.kind==='HAND_CARD'){
        const cardIndex=hand.findIndex(card=>card.id===target.cardId)
        if(cardIndex<0)continue
        const point=arenaHandPoint(cardIndex,Math.max(1,hand.length),layout)
        const commands=target.commands.filter(command=>command.action==='SET_VS')
        commands.forEach((command,index)=>{
          const x=point.x+(index-(commands.length-1)/2)*42
          const y=point.y-Math.max(58,layout.handBand.height*0.48)
          const body=this.add.rectangle(x,y,38,24,0x111928,0.98).setStrokeStyle(1,BLUE).setInteractive({useHandCursor:true})
          const text=this.add.text(x,y,command.position??'VS',{fontFamily:'Arial, sans-serif',fontSize:'10px',color:TEXT,fontStyle:'bold'}).setOrigin(0.5)
          body.on('pointerdown',()=>this.commandDispatcher?.(command));root.add([body,text])
        })
      }else if(target.kind==='TIE_CARD'){
        const cardIndex=tieHand.findIndex(card=>card.id===target.cardId)
        const command=target.commands.find(candidate=>candidate.action==='TIE_PICK')
        if(cardIndex<0||!command)continue
        const point=arenaHandPoint(cardIndex,Math.max(1,tieHand.length),layout)
        const hit=this.add.rectangle(point.x,point.y,72,102,FLASH,0.02).setStrokeStyle(3,GOLD).setInteractive({useHandCursor:true})
        hit.on('pointerdown',()=>this.commandDispatcher?.(command));root.add(hit)
      }else if(target.kind==='BOARD_CARD'){
        if(target.cardId===undefined)continue
        const command=target.commands.find(candidate=>candidate.action==='RESOLVE_BOARD_CHOICE')
        const slot=this.boardSlotForCard(state,layout,target.cardId)
        if(!command||!slot)continue
        const hit=this.add.rectangle(slot.x,slot.y,slot.width,slot.height,FLASH,0.03).setStrokeStyle(3,GOLD).setInteractive({useHandCursor:true})
        hit.on('pointerdown',()=>this.commandDispatcher?.(command));root.add(hit)
      }else if(target.kind==='SELF_DISCARD_CARD'){
        if(target.cardId===undefined)continue
        const cardIndex=hand.findIndex(card=>card.id===target.cardId)
        if(cardIndex<0)continue
        const point=arenaHandPoint(cardIndex,Math.max(1,hand.length),layout)
        const selected=this.selectedSelfDiscardIds.has(target.cardId)
        const hit=this.add.rectangle(point.x,point.y,72,102,FLASH,selected?0.14:0.02).setStrokeStyle(selected?4:2,GOLD).setInteractive({useHandCursor:true})
        hit.on('pointerdown',()=>{if(this.selectedSelfDiscardIds.has(target.cardId!))this.selectedSelfDiscardIds.delete(target.cardId!);else this.selectedSelfDiscardIds.add(target.cardId!);this.rebuildFromState(state)})
        root.add(hit)
      }else if(target.kind==='ACTION'){
        const command=target.commands[0]
        if(!command)continue
        if(command.action==='RESOLVE_SELF_DISCARD'&&!this.selfDiscardCanConfirm(state))continue
        const index=actionTargets.indexOf(target)
        const point=arenaActionPoint(Math.max(0,index),Math.max(1,actionTargets.length),layout)
        const width=Math.max(78,Math.min(112,layout.actionArea.width/Math.max(1,actionTargets.length)-5))
        const body=this.add.rectangle(point.x,point.y,width,40,0xc71921,0.96).setStrokeStyle(1,0xffb33d).setInteractive({useHandCursor:true})
        const text=this.add.text(point.x,point.y,target.label,{fontFamily:'Arial, sans-serif',fontSize:'10px',color:TEXT,fontStyle:'bold',align:'center',wordWrap:{width:width-8}}).setOrigin(0.5)
        body.on('pointerdown',()=>{if(command.action==='RESOLVE_SELF_DISCARD')this.commandDispatcher?.({...command,cardIds:[...this.selectedSelfDiscardIds]});else this.commandDispatcher?.(command)})
        root.add([body,text])
      }
    }

    const promptY=layout.viewport.height*0.775
    if(state.pendingChoice?.kind==='BOARD'){
      const prompt=this.add.text(layout.board.x,promptY,state.pendingChoice.value.title,{fontFamily:'Arial, sans-serif',fontSize:'12px',color:TEXT,fontStyle:'bold',align:'center',wordWrap:{width:layout.board.width*0.74}}).setOrigin(0.5)
      root.add(prompt)
    }else if(state.pendingChoice?.kind==='SELF_DISCARD'){
      const pending=state.pendingChoice.value
      const count=pending.mode==='EXACT'?`${this.selectedSelfDiscardIds.size}/${pending.count}`:`${this.selectedSelfDiscardIds.size}`
      const prompt=this.add.text(layout.board.x,promptY,`SELECT CARDS TO DISCARD · ${count}`,{fontFamily:'Arial, sans-serif',fontSize:'12px',color:TEXT,fontStyle:'bold'}).setOrigin(0.5)
      root.add(prompt)
    }
  }

  private drawGameOver(root:Phaser.GameObjects.Container,layout:ArenaPrototypeLayout,state:ArenaState){
    const local=state.identity.localPlayerIndex
    const winner=state.winnerIndex
    const result=winner===null?'MATCH OVER':winner===local?'VICTORY':'DEFEAT'
    const winnerLabel=winner===null?'NO WINNER':`${state.players[winner].handle} WINS`
    const shade=this.add.rectangle(layout.board.x,layout.board.y,layout.board.width,layout.board.height,0x000000,0.64).setDepth(180)
    const panel=this.add.rectangle(layout.board.x,layout.board.y,Math.min(420,layout.board.width*0.84),170,PANEL_DARK,0.98).setStrokeStyle(3,GOLD).setDepth(181)
    const title=this.add.text(layout.board.x,layout.board.y-25,result,{fontFamily:'Arial, sans-serif',fontSize:'30px',color:TEXT,fontStyle:'bold'}).setOrigin(0.5).setDepth(182)
    const detail=this.add.text(layout.board.x,layout.board.y+28,winnerLabel,{fontFamily:'Arial, sans-serif',fontSize:'16px',color:TEXT}).setOrigin(0.5).setDepth(182)
    root.add([shade,panel,title,detail])
  }
}
