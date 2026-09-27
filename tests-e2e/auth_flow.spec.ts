import { expect, test, type Page, type TestInfo } from 'playwright/test'

const PRODUCTION_SUPABASE_URL='https://mmtorfzxnidsczcdygbp.supabase.co'
const E2E_SUPABASE_ENV=process.env.VITE_SUPABASE_ENV
const E2E_SUPABASE_URL=process.env.VITE_SUPABASE_URL

if(E2E_SUPABASE_ENV!=='test'||!E2E_SUPABASE_URL||E2E_SUPABASE_URL===PRODUCTION_SUPABASE_URL){
  throw new Error('Auth E2E refused to run against production: VITE_SUPABASE_ENV must be test and VITE_SUPABASE_URL must be set to a non-production Supabase project.')
}

function collectConsoleErrors(page:Page){
  const lines:string[]=[]
  page.on('console',(message)=>{
    if(message.type()==='error')lines.push(message.text())
  })
  page.on('pageerror',(error)=>lines.push(`pageerror: ${error.message}`))
  return lines
}

async function renderedOnlineScreen(page:Page){
  return page.evaluate(()=>{
    const visible=(selector:string)=>{
      const element=document.querySelector<HTMLElement>(selector)
      if(!element)return false
      const style=getComputedStyle(element)
      const rect=element.getBoundingClientRect()
      return !element.hidden&&style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0&&rect.width>0&&rect.height>0
    }
    if(visible('.mx-online-screen.mx-handle'))return 'HANDLE'
    if(visible('.mx-online-screen.mx-auth'))return 'AUTH'
    if(visible('.mx-online-screen.mx-lobby-shell'))return 'LOBBY'
    if(visible('.mx-online-screen.mx-landing'))return 'LANDING'
    if(visible('.duel-shell'))return 'GAME'
    return 'NONE'
  })
}

async function landingOverlayState(page:Page){
  return page.evaluate(()=>{
    const element=document.querySelector<HTMLElement>('#mx-main-landing')
    if(!element)return {exists:false,hidden:null,visible:false,display:null,zIndex:null}
    const style=getComputedStyle(element)
    const rect=element.getBoundingClientRect()
    const visible=!element.hidden&&style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0&&rect.width>0&&rect.height>0
    return {exists:true,hidden:element.hidden,visible,display:style.display,zIndex:style.zIndex}
  })
}

async function captureFailureEvidence(page:Page,testInfo:TestInfo,consoleErrors:string[]){
  const screen=await renderedOnlineScreen(page)
  const landing=await landingOverlayState(page)
  const screenshotPath=testInfo.outputPath('signup-failure.png')
  await page.screenshot({path:screenshotPath,fullPage:true})
  await testInfo.attach('signup-failure',{path:screenshotPath,contentType:'image/png'})
  console.log(`[AUTH_FLOW_DIAGNOSTIC] onlineScreen=${screen}`)
  console.log(`[AUTH_FLOW_DIAGNOSTIC] landing=${JSON.stringify(landing)}`)
  console.log(`[AUTH_FLOW_DIAGNOSTIC] consoleErrors=${JSON.stringify(consoleErrors)}`)
  return {screen,landing}
}

test('new email signup reaches Claim X Fighter Name without reload',async({page},testInfo)=>{
  const consoleErrors=collectConsoleErrors(page)
  const unique=`mx-auth-e2e-${Date.now()}-${Math.random().toString(36).slice(2,10)}@example.com`
  const password='MegaX-E2E-2026!'

  await page.goto('/')
  await page.locator('#mx-main-practice-cta').click()
  await expect(page.locator('.mx-online-screen.mx-auth')).toBeVisible()
  await page.getByRole('button',{name:'SIGN UP',exact:true}).click()
  await page.getByPlaceholder('EMAIL').fill(unique)
  await page.getByPlaceholder('PASSWORD').fill(password)
  await page.getByRole('button',{name:'CREATE ACCOUNT',exact:true}).click()

  await page.waitForTimeout(4000)

  const confirmationMessage=await page.locator('.mx-online-message').textContent().catch(()=>null)
  if(confirmationMessage?.toUpperCase().includes('CONFIRM')){
    throw new Error(`E2E_SIGNUP_REQUIRES_EMAIL_CONFIRMATION:${confirmationMessage.trim()}`)
  }

  const evidence=await captureFailureEvidence(page,testInfo,consoleErrors)
  expect(evidence.screen,'successful signup must render the handle-claim screen').toBe('HANDLE')
  expect(evidence.landing.visible,'landing overlay must not remain visible over the handle-claim screen').toBe(false)
  await expect(page.getByRole('heading',{name:'CREATE X FIGHTER NAME'})).toBeVisible()
})
