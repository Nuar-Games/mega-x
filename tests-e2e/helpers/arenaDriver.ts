import { expect, type Page } from 'playwright/test'
import { createDesktopPrototypeLayout, type ArenaPrototypeRect } from '../../src/game/arena-next/prototype/ArenaPrototypeLayout'

const STATUS=/^ARENA NEXT · (PRACTICE|ONLINE) · V(\d+) · ROUND (\d+) · (SET_VS|EFFECT|ATTACK|TIE_BREAKER|GAME_OVER)$/
export const COMMAND_WAIT_MS=4_000

export type ArenaStatus={
  text:string
  mode:'PRACTICE'|'ONLINE'|'LOADING'
  version:number
  round:number
  phase:'LOADING'|'SET_VS'|'EFFECT'|'ATTACK'|'TIE_BREAKER'|'GAME_OVER'
  position:string
  legalActions:string[]
}

export async function arenaStatus(page:Page):Promise<ArenaStatus>{
  const locator=page.locator('[data-arena-status="true"]').first()
  const text=(await locator.textContent())?.trim()??''
  const position=(await locator.getAttribute('data-local-vs-position'))??''
  const legalActions=((await locator.getAttribute('data-local-legal-actions'))??'').split(',').filter(Boolean)
  if(text==='ARENA NEXT · LOADING')return {text,mode:'LOADING',version:-1,round:0,phase:'LOADING',position,legalActions}
  const match=text.match(STATUS)
  expect(match,`arena status became an error or invalid state: ${text}`).toBeTruthy()
  return {text,mode:match![1] as 'PRACTICE'|'ONLINE',version:Number(match![2]),round:Number(match![3]),phase:match![4] as ArenaStatus['phase'],position,legalActions}
}

async function arenaVersion(page:Page){
  const text=(await page.locator('[data-arena-status="true"]').first().textContent())?.trim()??''
  if(text==='ARENA NEXT · LOADING')return -1
  const match=text.match(STATUS)
  expect(match,`arena status became an error or invalid state: ${text}`).toBeTruthy()
  return Number(match![2])
}

export async function waitForVersionChange(page:Page,version:number,timeout=COMMAND_WAIT_MS){
  try{
    await expect.poll(()=>arenaVersion(page),{timeout,intervals:[50,75,100,200,400]}).not.toBe(version)
    return true
  }catch{return false}
}

export async function waitForArenaReady(page:Page,timeout=20_000){
  await expect(page.locator('#arena-next-runtime-host canvas')).toBeVisible({timeout})
  await expect.poll(async()=> (await arenaStatus(page)).phase,{timeout}).not.toBe('LOADING')
  return arenaStatus(page)
}

async function canvasBox(page:Page){
  const box=await page.locator('#arena-next-runtime-host canvas').boundingBox()
  expect(box,'arena canvas is missing').toBeTruthy()
  return box!
}

async function clickCanvas(page:Page,box:{x:number;y:number},x:number,y:number){
  await page.mouse.click(box.x+x,box.y+y)
}

function actionPoint(layout:{viewport:{width:number;height:number}},index:number){
  return {x:layout.viewport.width/2+(index-0.5)*118,y:layout.viewport.height*0.72}
}

function handPoint(layout:{handBand:ArenaPrototypeRect},index:number,count:number){
  const spacing=Math.min(118,layout.handBand.width/Math.max(1,count))
  return {x:layout.handBand.x+(index-(count-1)/2)*spacing,y:layout.handBand.y}
}

async function tryPoint(page:Page,box:{x:number;y:number},version:number,point:{x:number;y:number}){
  await clickCanvas(page,box,point.x,point.y)
  return waitForVersionChange(page,version)
}

export async function driveOneHumanAction(page:Page){
  const box=await canvasBox(page)
  const layout=createDesktopPrototypeLayout(box.width,box.height)
  const before=await arenaStatus(page)

  if(before.phase==='GAME_OVER')return {advanced:true,action:'GAME_OVER'}

  if(before.phase==='SET_VS'&&before.legalActions.includes('SET_VS')){
    for(let i=0;i<5;i+=1){
      const card=handPoint(layout,i,5)
      if(await tryPoint(page,box,before.version,{x:card.x-23,y:card.y+94}))return {advanced:true,action:'SET_VS'}
    }
    return {advanced:false,action:'SET_VS'}
  }

  if(before.phase==='ATTACK'){
    if(await tryPoint(page,box,before.version,actionPoint(layout,0))){
      return {advanced:true,action:before.position==='DEF'?'PASS':'ATTACK'}
    }
    if(before.position!=='DEF'&&await tryPoint(page,box,before.version,actionPoint(layout,1))){
      return {advanced:true,action:'PASS'}
    }
    return {advanced:false,action:before.position==='DEF'?'PASS':'ATTACK'}
  }

  if(before.phase==='TIE_BREAKER'){
    for(let i=0;i<5;i+=1){
      if(await tryPoint(page,box,before.version,handPoint(layout,i,5)))return {advanced:true,action:'TIE_PICK'}
    }
    return {advanced:false,action:'TIE_PICK'}
  }

  if(before.legalActions.includes('RESOLVE_BOARD_CHOICE')){
    const boardSlots=[...layout.vs,...layout.effectSlots[0],...layout.effectSlots[1]]
    for(const slot of boardSlots){
      if(await tryPoint(page,box,before.version,slot))return {advanced:true,action:'BOARD_CHOICE'}
    }
    return {advanced:false,action:'BOARD_CHOICE'}
  }

  if(before.legalActions.includes('RESOLVE_SELF_DISCARD')){
    for(const count of [5,4,3,2,1,6]){
      for(let i=0;i<count;i+=1){
        const point=handPoint(layout,i,count)
        await clickCanvas(page,box,point.x,point.y)
        await page.waitForTimeout(40)
        if(await tryPoint(page,box,before.version,actionPoint(layout,0)))return {advanced:true,action:'SELF_DISCARD'}
      }
    }
    return {advanced:false,action:'SELF_DISCARD'}
  }

  const actionCount=Math.max(1,before.legalActions.length)
  for(let index=0;index<actionCount;index+=1){
    const point=actionPoint(layout,index)
    if(point.x<0||point.x>layout.viewport.width)continue
    if(await tryPoint(page,box,before.version,point))return {advanced:true,action:before.legalActions[index]??'EFFECT_ACTION'}
  }

  return {advanced:false,action:'NO_ACTION'}
}
