import { test, expect, type Page } from 'playwright/test'
import { createDesktopPrototypeLayout, type ArenaPrototypeRect } from '../src/game/arena-next/prototype/ArenaPrototypeLayout'

const STATUS=/^ARENA NEXT · PRACTICE · V(\d+) · ROUND (\d+) · (SET_VS|EFFECT|ATTACK|TIE_BREAKER|GAME_OVER)$/
const COMMAND_WAIT_MS=700

async function arenaStatus(page:Page){
  const locator=page.locator('[data-arena-status="true"]').first()
  const text=(await locator.textContent())?.trim()??''
  const position=(await locator.getAttribute('data-local-vs-position'))??''
  if(text==='ARENA NEXT · LOADING')return {text,version:-1,phase:'LOADING',position}
  const match=text.match(STATUS)
  expect(match,`arena status became an error or invalid state: ${text}`).toBeTruthy()
  return {text,version:Number(match![1]),phase:match![3],position}
}

async function waitForVersionChange(page:Page,version:number,timeout=COMMAND_WAIT_MS){
  try{
    await expect.poll(async()=> (await arenaStatus(page)).version,{timeout,intervals:[50,75,100]}).not.toBe(version)
    return true
  }catch{return false}
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

async function driveOneHumanAction(page:Page){
  const box=await canvasBox(page)
  const layout=createDesktopPrototypeLayout(box.width,box.height)
  const before=await arenaStatus(page)

  if(before.phase==='GAME_OVER')return {advanced:true,action:'GAME_OVER'}

  if(before.phase==='SET_VS'){
    // Practice starts each SET_VS with five visible hand cards. Click the actual
    // ATK button position drawn beneath each real hand slot.
    for(let i=0;i<5;i+=1){
      const card=handPoint(layout,i,5)
      if(await tryPoint(page,box,before.version,{x:card.x-23,y:card.y+94}))return {advanced:true,action:'SET_VS'}
    }
    return {advanced:false,action:'SET_VS'}
  }

  if(before.phase==='ATTACK'){
    // Projection now exposes only PASS in DEF; in ATK, ATTACK is action index 0.
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

  // EFFECT command buttons are laid out by ArenaPrototypeScene with the same
  // actionPoint formula. Try every on-canvas action position quickly rather
  // than burning four seconds on guessed coordinates. This covers normal
  // effect play/end-turn plus hidden/visible effect choices.
  for(let index=0;index<7;index+=1){
    const point=actionPoint(layout,index)
    if(point.x<0||point.x>layout.viewport.width)continue
    if(await tryPoint(page,box,before.version,point))return {advanced:true,action:'EFFECT_ACTION'}
  }

  // Board choices use the real VS/effect-slot rectangles from the shared layout.
  const boardSlots=[...layout.vs,...layout.effectSlots[0],...layout.effectSlots[1]]
  for(const slot of boardSlots){
    if(await tryPoint(page,box,before.version,slot))return {advanced:true,action:'BOARD_CHOICE'}
  }

  // SELF_DISCARD selection does not advance the state version until confirmed.
  // Toggle visible hand cards using the real hand geometry, then retry the
  // confirmation action after each selection.
  for(const count of [5,4,3,2,1,6]){
    for(let i=0;i<count;i+=1){
      const point=handPoint(layout,i,count)
      await clickCanvas(page,box,point.x,point.y)
      await page.waitForTimeout(40)
      if(await tryPoint(page,box,before.version,actionPoint(layout,0)))return {advanced:true,action:'SELF_DISCARD'}
    }
  }

  return {advanced:false,action:'EFFECT'}
}

test('guest practice match runs through ArenaNextRuntime from SET_VS to GAME_OVER',async({page})=>{
  test.setTimeout(180_000)
  await page.setViewportSize({width:1440,height:1000})

  const pageErrors:string[]=[]
  page.on('pageerror',(error)=>pageErrors.push(error.message))

  await page.goto('/')
  await page.locator('#mx-main-practice-cta').click()
  const practiceEntry=page.locator('.mx-practice-entry[data-practice-entry="true"]')
  await expect(practiceEntry).toBeVisible({timeout:15_000})
  await practiceEntry.click()

  await expect(page.locator('#arena-next-runtime-host canvas')).toBeVisible({timeout:20_000})
  await expect.poll(async()=> (await arenaStatus(page)).phase,{timeout:20_000}).not.toBe('LOADING')

  let sawSetVs=false
  let sawAttackOrPass=false

  for(let step=0;step<80;step+=1){
    expect(pageErrors,`browser page errors: ${pageErrors.join(' | ')}`).toEqual([])
    const status=await arenaStatus(page)
    if(status.phase==='GAME_OVER')break

    const result=await driveOneHumanAction(page)
    if(result.action==='SET_VS'&&result.advanced)sawSetVs=true
    if((result.action==='ATTACK'||result.action==='PASS')&&result.advanced)sawAttackOrPass=true

    if(!result.advanced){
      // Give the beginner bot one scheduling window before deciding the match is stuck.
      await page.waitForTimeout(2_400)
      const afterBot=await arenaStatus(page)
      if(afterBot.version===status.version){
        throw new Error(`practice match stuck in ${status.phase} at V${status.version}`)
      }
    }
  }

  const finalStatus=await arenaStatus(page)
  expect(finalStatus.phase).toBe('GAME_OVER')
  expect(sawSetVs,'practice match never completed a real SET_VS action').toBe(true)
  expect(sawAttackOrPass,'practice match never completed a real ATTACK/PASS action').toBe(true)
  expect(pageErrors,`browser page errors: ${pageErrors.join(' | ')}`).toEqual([])
  await expect(page.getByText('LEADERBOARD POINTS WERE NOT RECORDED')).toBeVisible({timeout:10_000})
})
