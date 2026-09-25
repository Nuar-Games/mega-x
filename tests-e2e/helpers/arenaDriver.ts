import { expect, type Page } from 'playwright/test'

const STATUS=/^ARENA NEXT · (PRACTICE|ONLINE) · V(\d+) · ROUND (\d+) · (SET_VS|EFFECT|ATTACK|TIE_BREAKER|GAME_OVER)$/
export const COMMAND_WAIT_MS=8_000

type PointerTarget={
  key:string
  kind:'HAND_CARD'|'TIE_CARD'|'BOARD_CARD'|'SELF_DISCARD_CARD'|'ACTION'
  action:string
  label:string
  x:number
  y:number
  cardId?:number
  position?:'ATK'|'DEF'
  slot?:number
}

export type ArenaStatus={
  text:string
  mode:'PRACTICE'|'ONLINE'|'LOADING'
  version:number
  round:number
  phase:'LOADING'|'SET_VS'|'EFFECT'|'ATTACK'|'TIE_BREAKER'|'GAME_OVER'
  position:string
  legalActions:string[]
  connectionStatus:string
  networkBusy:boolean
  pointerTargetVersion:number
  pointerTargets:PointerTarget[]
}

function parseTargets(raw:string|null):PointerTarget[]{
  if(!raw)return []
  try{
    const value=JSON.parse(raw)
    if(!Array.isArray(value))return []
    return value.filter((target):target is PointerTarget=>
      Boolean(target&&typeof target==='object'&&typeof target.action==='string'&&Number.isFinite(target.x)&&Number.isFinite(target.y)),
    )
  }catch{return []}
}

export async function arenaStatus(page:Page):Promise<ArenaStatus>{
  const locator=page.locator('[data-arena-status="true"]').first()
  const text=(await locator.textContent())?.trim()??''
  const position=(await locator.getAttribute('data-local-vs-position'))??''
  const legalActions=((await locator.getAttribute('data-local-legal-actions'))??'').split(',').filter(Boolean)
  const connectionStatus=(await locator.getAttribute('data-connection-status'))??''
  const networkBusy=(await locator.getAttribute('data-network-busy'))==='true'
  const pointerTargetVersion=Number((await locator.getAttribute('data-legal-target-version'))??'-1')
  const pointerTargets=parseTargets(await locator.getAttribute('data-legal-targets'))
  if(text==='ARENA NEXT · LOADING')return {text,mode:'LOADING',version:-1,round:0,phase:'LOADING',position,legalActions,connectionStatus,networkBusy,pointerTargetVersion,pointerTargets}
  const match=text.match(STATUS)
  expect(match,`arena status became an error or invalid state: ${text}`).toBeTruthy()
  return {text,mode:match![1] as 'PRACTICE'|'ONLINE',version:Number(match![2]),round:Number(match![3]),phase:match![4] as ArenaStatus['phase'],position,legalActions,connectionStatus,networkBusy,pointerTargetVersion,pointerTargets}
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

async function waitForSettledTargets(page:Page,version:number){
  await expect.poll(async()=>{
    const status=await arenaStatus(page)
    return status.pointerTargetVersion===version&&!status.networkBusy
  },{timeout:COMMAND_WAIT_MS,intervals:[50,75,100,200,400]}).toBe(true)
  return arenaStatus(page)
}

export async function waitForArenaReady(page:Page,timeout=20_000){
  await expect(page.locator('#arena-next-runtime-host canvas')).toBeVisible({timeout})
  await expect.poll(async()=> (await arenaStatus(page)).phase,{timeout}).not.toBe('LOADING')
  const status=await arenaStatus(page)
  await expect.poll(async()=> (await arenaStatus(page)).pointerTargetVersion,{timeout}).toBe(status.version)
  return arenaStatus(page)
}

async function clickTarget(page:Page,target:PointerTarget){
  const box=await page.locator('#arena-next-runtime-host canvas').boundingBox()
  expect(box,'arena canvas is missing').toBeTruthy()
  await page.mouse.click(box!.x+target.x,box!.y+target.y)
}

function chooseTarget(status:ArenaStatus){
  const targets=status.pointerTargets
  if(status.phase==='SET_VS'){
    const setVs=targets.filter(target=>target.action==='SET_VS')
    return setVs.find(target=>target.cardId!==26&&target.position==='ATK')
      ??setVs.find(target=>target.cardId!==26)
      ??setVs.find(target=>target.position==='ATK')
      ??setVs[0]
  }
  if(status.phase==='EFFECT'){
    return targets.find(target=>target.action==='END_EFFECT_TURN')
      ??targets.find(target=>target.action==='BEGIN_ROUND')
      ??targets.find(target=>target.action!=='PLAY_EFFECT'&&target.action!=='SWITCH_POSITION'&&target.action!=='SELECT_SELF_DISCARD')
  }
  if(status.phase==='ATTACK'){
    if(status.position!=='DEF')return targets.find(target=>target.action==='ATTACK')??targets.find(target=>target.action==='PASS_ATTACK')
    return targets.find(target=>target.action==='PASS_ATTACK')
  }
  if(status.phase==='TIE_BREAKER')return targets.find(target=>target.action==='TIE_PICK')
  return targets.find(target=>target.action!=='SELECT_SELF_DISCARD')
}

export async function driveOneHumanAction(page:Page){
  const before=await arenaStatus(page)
  if(before.phase==='GAME_OVER')return {advanced:true,action:'GAME_OVER'}

  const settled=await waitForSettledTargets(page,before.version)
  let target=chooseTarget(settled)

  // Self-discard is a two-stage UI action: select the exact card targets first,
  // then press the exposed confirmation target. No guessed canvas positions are used.
  if(!target&&settled.pointerTargets.some(candidate=>candidate.action==='SELECT_SELF_DISCARD')){
    const selectable=settled.pointerTargets.filter(candidate=>candidate.action==='SELECT_SELF_DISCARD')
    for(const candidate of selectable){
      await clickTarget(page,candidate)
      await page.waitForTimeout(25)
      const current=await arenaStatus(page)
      target=current.pointerTargets.find(item=>item.action==='RESOLVE_SELF_DISCARD')
      if(target){
        await clickTarget(page,target)
        if(await waitForVersionChange(page,before.version))return {advanced:true,action:'RESOLVE_SELF_DISCARD'}
      }
    }
    return {advanced:false,action:'RESOLVE_SELF_DISCARD'}
  }

  if(!target)return {advanced:false,action:'NO_EXACT_TARGET'}
  await clickTarget(page,target)
  const advanced=await waitForVersionChange(page,before.version)
  return {advanced,action:target.action}
}
