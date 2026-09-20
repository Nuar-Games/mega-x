import { test, expect } from 'playwright/test'
import { arenaStatus, driveOneHumanAction, waitForArenaReady, waitForVersionChange } from './helpers/arenaDriver'

const BOT_WAIT_MS=4_000

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

  const ready=await waitForArenaReady(page)
  expect(ready.mode).toBe('PRACTICE')

  let sawSetVs=false
  let sawAttackOrPass=false

  for(let step=0;step<80;step+=1){
    expect(pageErrors,`browser page errors: ${pageErrors.join(' | ')}`).toEqual([])
    const status=await arenaStatus(page)
    if(status.phase==='GAME_OVER')break

    if(status.legalActions.length===0){
      const advanced=await waitForVersionChange(page,status.version,BOT_WAIT_MS)
      if(!advanced)throw new Error(`practice bot turn stuck in ${status.phase} at V${status.version}`)
      continue
    }

    const result=await driveOneHumanAction(page)
    if(result.action==='SET_VS'&&result.advanced)sawSetVs=true
    if((result.action==='ATTACK'||result.action==='PASS'||result.action==='PASS_ATTACK')&&result.advanced)sawAttackOrPass=true

    if(!result.advanced){
      const after=await arenaStatus(page)
      if(after.version===status.version){
        throw new Error(`practice match stuck in ${status.phase} at V${status.version}; legal=${status.legalActions.join('|')}`)
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
