import { test, expect, type Page } from 'playwright/test'

const STATUS=/^ARENA NEXT · PRACTICE · V(\d+) · ROUND (\d+) · (SET_VS|EFFECT|ATTACK|TIE_BREAKER|GAME_OVER)$/

async function arenaStatus(page:Page){
  const locator=page.locator('[data-arena-status="true"]').first()
  const text=(await locator.textContent())?.trim()??''
  const position=(await locator.getAttribute('data-local-vs-position'))??''
  if(text==='ARENA NEXT · LOADING')return {text,version:-1,phase:'LOADING',position}
  const match=text.match(STATUS)
  expect(match,`arena status became an error or invalid state: ${text}`).toBeTruthy()
  return {text,version:Number(match![1]),phase:match![3],position}
}

async function waitForVersionChange(page:Page,version:number,timeout=4_000){
  try{
    await expect.poll(async()=>{
      const current=await arenaStatus(page)
      return current.version
    },{timeout}).not.toBe(version)
    return true
  }catch{return false}
}

async function clickCanvas(page:Page,x:number,y:number){
  const canvas=page.locator('#arena-next-runtime-host canvas')
  const box=await canvas.boundingBox()
  expect(box,'arena canvas is missing').toBeTruthy()
  await page.mouse.click(box!.x+x,box!.y+y)
}

async function driveOneHumanAction(page:Page){
  const canvas=page.locator('#arena-next-runtime-host canvas')
  const box=await canvas.boundingBox()
  expect(box,'arena canvas is missing').toBeTruthy()
  const width=box!.width
  const height=box!.height
  const before=await arenaStatus(page)

  if(before.phase==='GAME_OVER')return {advanced:true,action:'GAME_OVER'}

  if(before.phase==='SET_VS'){
    const spacing=Math.min(118,(width*0.47)/5)
    for(let i=0;i<5;i+=1){
      const x=width*0.5+(i-2)*spacing-23
      const y=Math.min(height-16,height*0.89+94)
      await clickCanvas(page,x,y)
      if(await waitForVersionChange(page,before.version))return {advanced:true,action:'SET_VS'}
    }
    return {advanced:false,action:'SET_VS'}
  }

  if(before.phase==='ATTACK'){
    if(before.position==='DEF'){
      await clickCanvas(page,width*0.5-59,height*0.72)
      return {advanced:await waitForVersionChange(page,before.version),action:'PASS'}
    }
    await clickCanvas(page,width*0.5-59,height*0.72)
    if(await waitForVersionChange(page,before.version))return {advanced:true,action:'ATTACK'}
    await clickCanvas(page,width*0.5+59,height*0.72)
    return {advanced:await waitForVersionChange(page,before.version),action:'PASS'}
  }

  if(before.phase==='TIE_BREAKER'){
    const spacing=Math.min(118,(width*0.47)/5)
    for(let i=0;i<5;i+=1){
      await clickCanvas(page,width*0.5+(i-2)*spacing,height*0.89)
      if(await waitForVersionChange(page,before.version))return {advanced:true,action:'TIE_PICK'}
    }
    return {advanced:false,action:'TIE_PICK'}
  }

  // EFFECT can contain a normal turn action or a board/self-discard choice.
  // Try the command buttons first, then the visible hand/board targets.
  for(const x of [width*0.5-59,width*0.5+59]){
    await clickCanvas(page,x,height*0.72)
    if(await waitForVersionChange(page,before.version))return {advanced:true,action:'EFFECT_ACTION'}
  }

  const handSpacing=Math.min(118,(width*0.47)/5)
  for(let i=0;i<5;i+=1){
    await clickCanvas(page,width*0.5+(i-2)*handSpacing,height*0.89)
    await clickCanvas(page,width*0.5-59,height*0.72)
    if(await waitForVersionChange(page,before.version))return {advanced:true,action:'EFFECT_CHOICE'}
  }

  const boardTargets:[number,number][]=[
    [width*0.405,height*0.45],[width*0.595,height*0.45],
    [width*0.105,height*0.26],[width*0.895,height*0.26],
  ]
  for(const [x,y] of boardTargets){
    await clickCanvas(page,x,y)
    if(await waitForVersionChange(page,before.version))return {advanced:true,action:'BOARD_CHOICE'}
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
