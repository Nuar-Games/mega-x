import { test, expect } from 'playwright/test'
import { arenaStatus, driveOneHumanAction, waitForArenaReady, waitForVersionChange } from './helpers/arenaDriver'

const BOT_WAIT_MS=4_000
const PRODUCTION_SUPABASE_URL='https://mmtorfzxnidsczcdygbp.supabase.co'
const E2E_SUPABASE_ENV=process.env.VITE_SUPABASE_ENV
const E2E_SUPABASE_URL=process.env.VITE_SUPABASE_URL

if(E2E_SUPABASE_ENV!=='test'||!E2E_SUPABASE_URL||E2E_SUPABASE_URL===PRODUCTION_SUPABASE_URL){
  throw new Error('Practice E2E refused to run against production: VITE_SUPABASE_ENV must be test and VITE_SUPABASE_URL must be set to a non-production Supabase project.')
}

test('signed-in practice match runs through ArenaNextRuntime from SET_VS to GAME_OVER',async({page})=>{
  test.setTimeout(300_000)
  await page.setViewportSize({width:1440,height:1000})

  const pageErrors:string[]=[]
  page.on('pageerror',(error)=>pageErrors.push(error.message))

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
  await expect(page.locator('.mx-lobby-shell')).toBeVisible({timeout:15_000})
  await expect(page.getByText(handle,{exact:true})).toBeVisible({timeout:15_000})
  const practiceEntry=page.locator('.mx-practice-entry[data-practice-entry="true"]')
  await expect(practiceEntry).toBeVisible({timeout:15_000})
  await practiceEntry.click()

  const ready=await waitForArenaReady(page)
  expect(ready.mode).toBe('PRACTICE')

  let sawSetVs=false
  let sawAttackPhase=false

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
    if(result.action==='SET_VS'&&result.advanced)sawSetVs=true

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
  expect(sawAttackPhase,'practice match never reached a real ATTACK phase').toBe(true)
  expect(pageErrors,`browser page errors: ${pageErrors.join(' | ')}`).toEqual([])
  await expect(page.getByText('LEADERBOARD POINTS WERE NOT RECORDED')).toBeVisible({timeout:10_000})
})
