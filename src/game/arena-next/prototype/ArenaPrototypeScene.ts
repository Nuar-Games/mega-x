import Phaser from 'phaser'
import type { ArenaEventEnvelope } from '../ArenaEvents'
import type { ArenaCardState, ArenaState, ArenaStats } from '../ArenaState'
import { createDesktopPrototypeLayout, type ArenaPrototypeLayout, type ArenaPrototypeRect } from './ArenaPrototypeLayout'

const PANEL=0x3d434b
const PANEL_DARK=0x24282e
const LINE=0x8f969e
const TEXT='#f4f4f4'
const FLASH=0xd7dbe0

export class ArenaPrototypeScene extends Phaser.Scene {
  private currentState:ArenaState|null=null
  private arenaRoot:Phaser.GameObjects.Container|null=null

  constructor(){super('arena-prototype')}

  init(data:{state?:ArenaState}){
    this.currentState=data?.state??null
  }

  create(){
    const registryState=this.registry.get('arena-prototype-initial-state') as ArenaState|undefined
    if(!this.currentState&&registryState)this.currentState=registryState
    if(this.currentState)this.rebuildFromState(this.currentState)
    this.scale.on(Phaser.Scale.Events.RESIZE,()=>{
      if(this.currentState)this.rebuildFromState(this.currentState)
    })
  }

  rebuildFromState(state:ArenaState){
    this.currentState=state
    this.arenaRoot?.destroy(true)
    const root=this.add.container(0,0)
    this.arenaRoot=root
    const layout=createDesktopPrototypeLayout(this.scale.width,this.scale.height)

    const background=this.add.rectangle(layout.viewport.width/2,layout.viewport.height/2,layout.viewport.width,layout.viewport.height,0x111317,1)
    root.add(background)

    this.drawPanel(root,layout.nameplates[0],`${state.players[0].handle}  ·  RANK ${state.players[0].startRank??'—'}`)
    this.drawPanel(root,layout.nameplates[1],`${state.players[1].handle}  ·  RANK ${state.players[1].startRank??'—'}`)
    this.drawCardSlot(root,layout.masterDeck,`DECK\n${state.deckCount}`)

    for(const player of [0,1] as const){
      this.drawPanel(root,layout.captured[player],`CAPTURED ${state.players[player].capturedCount}`)
      this.drawZone(root,layout.zonX[player],`ZON X\n${state.players[player].zonX.length}`)
      this.drawZone(root,layout.zonTepi[player],`ZON TEPI\n${state.players[player].zonTepi.length}`)
      this.drawVs(root,layout.vs[player],state.players[player].vs?.card??null,state.players[player].vs?.position??null)
      this.drawStats(root,layout.stats[player],state.players[player].stats)
      layout.effectSlots[player].forEach((slot,index)=>{
        const effect=state.players[player].effects[index]
        this.drawCardSlot(root,slot,effect?`E${index+1}\n${effect.card.name}`:`EFFECT ${index+1}`)
      })
    }

    this.drawHand(root,layout,state)
    const phase=this.add.text(layout.viewport.width/2,layout.viewport.height*0.19,`ROUND ${state.round} · ${state.phase}`,{fontFamily:'Arial, sans-serif',fontSize:'22px',color:TEXT,fontStyle:'bold'}).setOrigin(0.5)
    root.add(phase)
  }

  consumeEvent(envelope:ArenaEventEnvelope,nextState:ArenaState):Promise<void>{
    if(envelope.matchId!==nextState.identity.matchId||envelope.toVersion!==nextState.stateVersion){
      return this.reconcileState(nextState)
    }

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
      case 'TURN_CHANGED': animation=this.animatePhaseChange(`TURN · E:${event.effectTurn??'—'} A:${event.attackTurn??'—'}`); break
      case 'STATE_RECONCILED': return this.reconcileState(nextState)
      default:
        this.rebuildFromState(nextState)
        return Promise.resolve()
    }

    return animation.then(()=>{
      this.rebuildFromState(nextState)
    })
  }

  private animateVsSet(player:0|1,cardId:number){
    const layout=this.layout()
    const current=this.currentState
    const hand=current?.players[player].hand??[]
    const cardIndex=Math.max(0,hand.findIndex(card=>card.id===cardId))
    const start=this.handPoint(cardIndex,Math.max(1,hand.length),layout)
    return this.animateToken(start,layout.vs[player],this.cardName(cardId),480)
  }

  private animateDraw(player:0|1,cardId:number|null,count:number){
    const layout=this.layout()
    const current=this.currentState
    const hand=current?.players[player].hand??[]
    const destination=player===current?.identity.localPlayerIndex
      ? this.handPoint(hand.length,Math.max(1,hand.length+1),layout)
      : {x:layout.nameplates[player].x,y:layout.nameplates[player].y+layout.nameplates[player].height}
    return this.animateToken(layout.masterDeck,destination,cardId===null?`DRAW ×${count}`:this.cardName(cardId),420)
  }

  private animateEffectPlayed(player:0|1,cardId:number){
    const layout=this.layout()
    const current=this.currentState
    const hand=current?.players[player].hand??[]
    const cardIndex=Math.max(0,hand.findIndex(card=>card.id===cardId))
    const start=player===current?.identity.localPlayerIndex
      ? this.handPoint(cardIndex,Math.max(1,hand.length),layout)
      : layout.nameplates[player]
    const slotIndex=Math.max(0,current?.players[player].effects.findIndex(effect=>effect===null)??0)
    return this.animateToken(start,layout.effectSlots[player][slotIndex]??layout.effectSlots[player][0],this.cardName(cardId),420)
  }

  private animateEffectTriggered(player:0|1,cardId:number){
    const layout=this.layout()
    const effects=this.currentState?.players[player].effects??[]
    const slotIndex=Math.max(0,effects.findIndex(effect=>effect?.card.id===cardId))
    return this.animatePulse(layout.effectSlots[player][slotIndex]??layout.effectSlots[player][0],`EFFECT\n${this.cardName(cardId)}`,360)
  }

  private animateAttack(attacker:0|1,defender:0|1){
    const layout=this.layout()
    const from=layout.vs[attacker]
    const toward=layout.vs[defender]
    const body=this.add.rectangle(from.x,from.y,from.width*0.72,from.height*0.72,PANEL,1).setStrokeStyle(3,FLASH).setDepth(150)
    const targetX=Phaser.Math.Linear(from.x,toward.x,0.38)
    const targetY=Phaser.Math.Linear(from.y,toward.y,0.38)
    return new Promise<void>(resolve=>{
      this.tweens.add({targets:body,x:targetX,y:targetY,duration:180,ease:'Cubic.easeIn',yoyo:true,hold:70,
        onComplete:()=>{body.destroy();resolve()},
      })
    })
  }

  private animateZoneMove(fromPlayer:0|1,fromZone:'VS'|'EFFECT'|'HAND',toPlayer:0|1,toZone:'ZON_TEPI'|'ZON_X',cardId:number|null){
    const layout=this.layout()
    const start=this.zonePoint(fromPlayer,fromZone,cardId,layout)
    const destination=toZone==='ZON_X'?layout.zonX[toPlayer]:layout.zonTepi[toPlayer]
    return this.animateToken(start,destination,cardId===null?'CARD':this.cardName(cardId),430)
  }

  private animateStatChange(player:0|1,stats:ArenaStats|null){
    const label=stats?`ATK ${stats.atk}   DEF ${stats.def}   STA ${stats.sta}`:'STATS CLEARED'
    return this.animatePulse(this.layout().stats[player],label,360)
  }

  private animatePhaseChange(label:string){
    const layout=this.layout()
    const slot:{x:number;y:number;width:number;height:number}={x:layout.viewport.width/2,y:layout.viewport.height*0.19,width:Math.min(420,layout.viewport.width*0.34),height:54}
    return this.animatePulse(slot,label,320)
  }

  private reconcileState(nextState:ArenaState){
    this.rebuildFromState(nextState)
    const layout=this.layout()
    const flash=this.add.rectangle(layout.viewport.width/2,layout.viewport.height/2,layout.viewport.width,layout.viewport.height,FLASH,0.09).setDepth(200)
    return new Promise<void>(resolve=>{
      this.tweens.add({targets:flash,alpha:0,duration:160,onComplete:()=>{flash.destroy();resolve()}})
    })
  }

  private animateToken(start:{x:number;y:number},destination:{x:number;y:number;width?:number;height?:number},label:string,duration:number){
    const width=Math.max(62,Math.min(112,destination.width??96))
    const height=Math.max(88,Math.min(158,destination.height??136))
    const moving=this.add.container(start.x,start.y).setDepth(160)
    const body=this.add.rectangle(0,0,width*0.72,height*0.72,PANEL,1).setStrokeStyle(2,FLASH)
    const text=this.add.text(0,0,label,{fontFamily:'Arial, sans-serif',fontSize:'12px',color:TEXT,align:'center',wordWrap:{width:width*0.58}}).setOrigin(0.5)
    moving.add([body,text])
    return new Promise<void>(resolve=>{
      this.tweens.add({targets:moving,x:destination.x,y:destination.y,duration,ease:'Cubic.easeInOut',
        onComplete:()=>{moving.destroy(true);resolve()},
      })
    })
  }

  private animatePulse(slot:{x:number;y:number;width:number;height:number},label:string,duration:number){
    const body=this.add.rectangle(slot.x,slot.y,slot.width,slot.height,PANEL,0.95).setStrokeStyle(3,FLASH).setDepth(170)
    const text=this.add.text(slot.x,slot.y,label,{fontFamily:'Arial, sans-serif',fontSize:'14px',color:TEXT,fontStyle:'bold',align:'center'}).setOrigin(0.5).setDepth(171)
    body.setScale(0.94)
    text.setScale(0.94)
    return new Promise<void>(resolve=>{
      this.tweens.add({targets:[body,text],scaleX:1.07,scaleY:1.07,alpha:0.15,duration:duration/2,yoyo:true,
        onComplete:()=>{body.destroy();text.destroy();resolve()},
      })
    })
  }

  private zonePoint(player:0|1,zone:'VS'|'EFFECT'|'HAND',cardId:number|null,layout:ArenaPrototypeLayout){
    if(zone==='VS')return layout.vs[player]
    if(zone==='EFFECT'){
      const index=Math.max(0,this.currentState?.players[player].effects.findIndex(effect=>effect?.card.id===cardId)??0)
      return layout.effectSlots[player][index]??layout.effectSlots[player][0]
    }
    const hand=this.currentState?.players[player].hand??[]
    const index=Math.max(0,hand.findIndex(card=>card.id===cardId))
    return this.handPoint(index,Math.max(1,hand.length),layout)
  }

  private layout(){return createDesktopPrototypeLayout(this.scale.width,this.scale.height)}

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
    return `CARD ${cardId}`
  }

  private drawHand(root:Phaser.GameObjects.Container,layout:ArenaPrototypeLayout,state:ArenaState){
    const local=state.identity.localPlayerIndex
    const cards=state.players[local].hand??[]
    cards.forEach((card,index)=>{
      const point=this.handPoint(index,Math.max(1,cards.length),layout)
      const width=Math.max(72,Math.min(112,layout.handBand.width/5.6))
      const height=width*1.42
      const slot={x:point.x,y:point.y,width,height}
      this.drawCardSlot(root,slot,card.name)
    })
    const caption=this.add.text(layout.handBand.x,layout.handBand.y-layout.handBand.height*0.65,`HAND · ${state.players[local].handCount}`,{fontFamily:'Arial, sans-serif',fontSize:'18px',color:TEXT,fontStyle:'bold'}).setOrigin(0.5)
    root.add(caption)
  }

  private handPoint(index:number,count:number,layout:ArenaPrototypeLayout){
    const spacing=Math.min(118,layout.handBand.width/Math.max(1,count))
    return {x:layout.handBand.x+(index-(count-1)/2)*spacing,y:layout.handBand.y}
  }

  private drawVs(root:Phaser.GameObjects.Container,slot:ArenaPrototypeRect,card:ArenaCardState|null,position:'ATK'|'DEF'|null){
    this.drawCardSlot(root,slot,card?`${card.name}\n${position??''}`:'VS')
  }

  private drawStats(root:Phaser.GameObjects.Container,slot:ArenaPrototypeRect,stats:ArenaStats|null){
    this.drawPanel(root,slot,stats?`ATK ${stats.atk}   DEF ${stats.def}   STA ${stats.sta}`:'ATK —   DEF —   STA —')
  }

  private drawZone(root:Phaser.GameObjects.Container,slot:ArenaPrototypeRect,label:string){
    const body=this.add.rectangle(slot.x,slot.y,slot.width,slot.height,PANEL_DARK,0.55).setStrokeStyle(2,LINE,0.8)
    const text=this.add.text(slot.x,slot.y,label,{fontFamily:'Arial, sans-serif',fontSize:'15px',color:TEXT,align:'center'}).setOrigin(0.5)
    root.add([body,text])
  }

  private drawPanel(root:Phaser.GameObjects.Container,slot:ArenaPrototypeRect,label:string){
    const body=this.add.rectangle(slot.x,slot.y,slot.width,slot.height,PANEL,0.92).setStrokeStyle(2,LINE)
    const text=this.add.text(slot.x,slot.y,label,{fontFamily:'Arial, sans-serif',fontSize:'17px',color:TEXT,fontStyle:'bold',align:'center'}).setOrigin(0.5)
    root.add([body,text])
  }

  private drawCardSlot(root:Phaser.GameObjects.Container,slot:ArenaPrototypeRect,label:string){
    const body=this.add.rectangle(slot.x,slot.y,slot.width,slot.height,PANEL_DARK,0.9).setStrokeStyle(2,LINE)
    const text=this.add.text(slot.x,slot.y,label,{fontFamily:'Arial, sans-serif',fontSize:'13px',color:TEXT,align:'center',wordWrap:{width:slot.width*0.82}}).setOrigin(0.5)
    root.add([body,text])
  }
}
