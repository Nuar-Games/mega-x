import { mkdir } from 'node:fs/promises'
import { test, expect, type Page, type TestInfo } from 'playwright/test'
import { arenaStatus, assertNoArenaBoardOverlaps, driveOneHumanAction, waitForArenaReady, waitForVersionChange } from './helpers/arenaDriver'

const BOT_WAIT_MS=4_000
const PRODUCTION_SUPABASE_URL='https://mmtorfzxnidsczcdygbp.supabase.co'
const E2E_SUPABASE_ENV=process.env.VITE_SUPABASE_ENV
const E2E_SUPABASE_URL=process.env.VITE_SUPABASE_URL

if(E2E_SUPABASE_ENV!=='test'||!E2E_SUPABASE_URL||E2E_SUPABASE_URL===PRODUCTION_SUPABASE_URL){
  throw new Error('Practice E2E refused to run against production: VITE_SUPABASE_ENV must be test and VITE_SUPABASE_URL must be set to a non-production Supabase project.')
}

async function attachScreenshot(page:Page,testInfo:TestInfo,name:string){
  const dir='e2e-artifacts/arena-board-v2'
  await mkdir(dir,{recursive:true})
  const path=`${dir}/${name}.png`
  await page.screenshot({path,fullPage:true})
  await testInfo.attach(name,{path,contentType:'image/png'})
}

test('signed-in practice match runs through ArenaNextRuntime from SET_VS to GAME_OVER',async({page},testInfo:TestInfo)=>{
  test.setTimeout(300_000)
  await page.setViewportSize({width:390,height:844})

  const pageErrors:string[]=[]
  page.on('pageerror',(error)=>pageErrors.push(error.message))
  const consoleMessages:string[]=[]
  page.on('console',(message)=>consoleMessages.push(`${message.type()}: ${message.text()}`))
  const authResponses:string[]=[]
  page.on('response',(response)=>{
    const url=response.url()
    if(!url.includes('/rest/v1/profiles')&&!url.includes('/auth/v1/token'))return
    void response.text().then((body)=>{
      const line=`${response.status()} ${url} BODY=${body}`
      authResponses.push(line)
      console.log(`[PRACTICE_AUTH_RESPONSE] ${line}`)
    }).catch((error)=>{
      const line=`${response.status()} ${url} BODY_READ_ERROR=${error instanceof Error?error.message:String(error)}`
      authResponses.push(line)
      console.log(`[PRACTICE_AUTH_RESPONSE] ${line}`)
    })
  })

  const email=process.env.MEGA_X_E2E_P1_EMAIL
  const password=process.env.MEGA_X_E2E_P1_PASSWORD
  const handle=process.env.MEGA_X_E2E_P1_HANDLE
  if(!email||!password||!handle)throw new Error('MEGA_X_E2E_P1_EMAIL, MEGA_X_E2E_P1_PASSWORD and MEGA_X_E2E_P1_HANDLE are required fixed E2E credentials')

  await page.goto('/')
  await page.getByRole('button',{name:/MAIN SEKARANG/i}).click()
  await expect(page.locator('.mx-online-screen.mx-auth')).toBeVisible()
  await page.getByPlaceholder('EMAIL').fill(email)
  await page.getByPlaceholder('PASSWORD').fill(password)
  await page.locator('.mx-online-primary').click()
  try{
    await expect(page.locator('.mx-lobby-shell')).toBeVisible({timeout:15_000})
  }catch(error){
    const onlineMessage=await page.locator('.mx-online-message').textContent().catch(()=>null)
    console.log(`[PRACTICE_AUTH_DIAGNOSTIC] onlineMessage=${JSON.stringify(onlineMessage)}`)
    console.log(`[PRACTICE_AUTH_DIAGNOSTIC] responses=${JSON.stringify(authResponses)}`)
    console.log(`[PRACTICE_AUTH_DIAGNOSTIC] console=${JSON.stringify(consoleMessages)}`)
    const screenshotPath=testInfo.outputPath('practice-auth-failure.png')
    await page.screenshot({path:screenshotPath,fullPage:true})
    await testInfo.attach('practice-auth-failure',{path:screenshotPath,contentType:'image/png'})
    throw error
  }
  await expect(page.locator('header.mx-lobby-player strong').first()).toHaveText(handle,{timeout:15_000})
  await page.evaluate((expectedHandle)=>{
    const probe=document.createElement('div')
    probe.dataset.practiceRenderedName='true'
    probe.style.display='none'
    document.body.appendChild(probe)
    const contextPrototype=CanvasRenderingContext2D.prototype
    const originalFillText=contextPrototype.fillText
    const originalStrokeText=contextPrototype.strokeText
    const capture=(text:unknown)=>{
      const value=String(text)
      if(value.includes(expectedHandle))probe.textContent=value
    }
    contextPrototype.fillText=function(text:string,x:number,y:number,maxWidth?:number){
      capture(text)
      return maxWidth===undefined?originalFillText.call(this,text,x,y):originalFillText.call(this,text,x,y,maxWidth)
    }
    contextPrototype.strokeText=function(text:string,x:number,y:number,maxWidth?:number){
      capture(text)
      return maxWidth===undefined?originalStrokeText.call(this,text,x,y):originalStrokeText.call(this,text,x,y,maxWidth)
    }
  },handle)
  const practiceEntry=page.locator('.mx-practice-entry[data-practice-entry="true"]')
  await expect(practiceEntry).toBeVisible({timeout:15_000})
  await practiceEntry.click()

  const ready=await waitForArenaReady(page)
  expect(ready.mode).toBe('PRACTICE')
  const renderedPracticeName=page.locator('[data-practice-rendered-name="true"]')
  await expect(renderedPracticeName).toHaveCount(1)
  await expect(renderedPracticeName).toContainText(handle,{timeout:15_000})
  console.log(`[PRACTICE_NAME] ${await renderedPracticeName.textContent()}`)

  const beforeInspect=await arenaStatus(page)
  const setTargets=beforeInspect.pointerTargets.filter(target=>target.action==='SET_VS')
  expect(setTargets.length,'SET_VS pointer targets are required to locate a hand card').toBeGreaterThan(0)
  const firstCardId=setTargets[0].cardId
  const firstCardTargets=setTargets.filter(target=>target.cardId===firstCardId)
  const handX=firstCardTargets.reduce((sum,target)=>sum+target.x,0)/firstCardTargets.length
  const handY=Math.max(...firstCardTargets.map(target=>target.y))+74
  const canvasBox=await page.locator('#arena-next-runtime-host canvas').boundingBox()
  expect(canvasBox,'arena canvas is missing').toBeTruthy()
  await page.mouse.click(canvasBox!.x+handX,canvasBox!.y+handY)
  await expect(page.locator('[data-arena-inspect="true"]')).toBeVisible({timeout:5_000})
  expect((await arenaStatus(page)).version,'opening inspect must not play the card').toBe(beforeInspect.version)
  await attachScreenshot(page,testInfo,'practice-inspect')
  await page.locator('[data-arena-inspect-close="true"]').click()
  await expect(page.locator('[data-arena-inspect="true"]')).toHaveCount(0)
  expect((await arenaStatus(page)).version,'closing inspect must not play the card').toBe(beforeInspect.version)

  const statusProbe=page.locator('[data-arena-status="true"]').first()
  const layoutProbe=await statusProbe.evaluate((element)=>({
    localY:Number(element.getAttribute('data-local-vs-y')),
    opponentY:Number(element.getAttribute('data-opponent-vs-y')),
    viewportHeight:Number(element.getAttribute('data-arena-viewport-height')),
  }))
  expect(layoutProbe.localY,'viewer KAD VS must be in bottom half').toBeGreaterThan(layoutProbe.viewportHeight/2)
  expect(layoutProbe.opponentY,'opponent KAD VS must be in top half').toBeLessThan(layoutProbe.viewportHeight/2)
  const timerZ=Number(await page.locator('[data-arena-timer="true"]').getAttribute('data-arena-timer-layer'))
  expect(timerZ,'timer layer must be above card/canvas layer').toBeGreaterThan(20)

  let sawSetVs=false
  let sawAttackPhase=false
  let phoneBoardCaptured=false

  for(let step=0;step<80;step+=1){
    expect(pageErrors,`browser page errors: ${pageErrors.join(' | ')}`).toEqual([])
    const status=await arenaStatus(page)
    if(status.phase==='ATTACK')sawAttackPhase=true
    if(status.phase==='GAME_OVER')break

    if(status.legalActions.length===0){
      const advanced=await waitForVersionChange(page,status.version,BOT_WAIT_MS)
      if(!advanced)throw new Error(`practice bot turn stuck in ${status.phase} at V${status.version}`)
      continue
    }

    const result=await driveOneHumanAction(page)
    if(result.action==='SET_VS'&&result.advanced){
      sawSetVs=true
      if(!phoneBoardCaptured){
        await page.waitForTimeout(250)
        await assertNoArenaBoardOverlaps(page,'practice board')
        await attachScreenshot(page,testInfo,'practice-phone-board')
        phoneBoardCaptured=true
      }
    }

    if(!result.advanced){
      const after=await arenaStatus(page)
      if(after.version===status.version)throw new Error(`practice match stuck in ${status.phase} at V${status.version}; legal=${status.legalActions.join('|')}`)
    }
  }

  const finalStatus=await arenaStatus(page)
  expect(finalStatus.phase).toBe('GAME_OVER')
  expect(sawSetVs,'practice match never completed a real SET_VS action').toBe(true)
  expect(phoneBoardCaptured,'phone board screenshot was not captured after SET_VS').toBe(true)
  expect(sawAttackPhase,'practice match never reached a real ATTACK phase').toBe(true)
  expect(pageErrors,`browser page errors: ${pageErrors.join(' | ')}`).toEqual([])
  await expect(page.getByText('LEADERBOARD POINTS WERE NOT RECORDED')).toBeVisible({timeout:10_000})
})