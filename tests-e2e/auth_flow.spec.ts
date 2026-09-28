import { expect, test, type Page, type TestInfo } from 'playwright/test'

const PRODUCTION_SUPABASE_URL='https://mmtorfzxnidsczcdygbp.supabase.co'
const E2E_SUPABASE_ENV=process.env.VITE_SUPABASE_ENV
const E2E_SUPABASE_URL=process.env.VITE_SUPABASE_URL
const E2E_P1_EMAIL=process.env.MEGA_X_E2E_P1_EMAIL
const E2E_P1_PASSWORD=process.env.MEGA_X_E2E_P1_PASSWORD
const E2E_P1_HANDLE=process.env.MEGA_X_E2E_P1_HANDLE

if(E2E_SUPABASE_ENV!=='test'||!E2E_SUPABASE_URL||E2E_SUPABASE_URL===PRODUCTION_SUPABASE_URL){
  throw new Error('Auth E2E refused to run against production: VITE_SUPABASE_ENV must be test and VITE_SUPABASE_URL must be set to a non-production Supabase project.')
}
if(!E2E_P1_EMAIL||!E2E_P1_PASSWORD||!E2E_P1_HANDLE){
  throw new Error('MEGA_X_E2E_P1_EMAIL, MEGA_X_E2E_P1_PASSWORD and MEGA_X_E2E_P1_HANDLE are required fixed E2E credentials')
}

function collectConsoleErrors(page:Page){
  const lines:string[]=[]
  page.on('console',(message)=>{
    if(message.type()==='error')lines.push(message.text())
  })
  page.on('pageerror',(error)=>lines.push(`pageerror: ${error.message}`))
  return lines
}

function collectAuthResponses(page:Page){
  page.on('response',async(response)=>{
    const url=response.url()
    if(!url.includes('/auth/v1/signup')&&!url.includes('/auth/v1/token')&&!url.includes('/rest/v1/profiles'))return
    try{
      const body=await response.text()
      console.log(`[AUTH_FLOW_RESPONSE] ${response.status()} ${url} BODY=${body}`)
    }catch(error){
      console.log(`[AUTH_FLOW_RESPONSE] ${response.status()} ${url} BODY_READ_ERROR=${error instanceof Error?error.message:String(error)}`)
    }
  })
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

async function nonBlockingOnlineMessage(page:Page){
  const locator=page.locator('.mx-online-message')
  return await locator.count()>0?(await locator.first().textContent())?.trim()??'':''
}

async function captureFailureEvidence(page:Page,testInfo:TestInfo,consoleErrors:string[],reloadNavigations:string[]){
  const screen=await renderedOnlineScreen(page)
  const landing=await landingOverlayState(page)
  const onlineMessage=await nonBlockingOnlineMessage(page)
  const dom=await page.evaluate(()=>{
    const bodyText=document.body?.innerText??''
    const root=document.querySelector('#root')
    const onlineScreens=Array.from(document.querySelectorAll<HTMLElement>('.mx-online-screen')).map((element)=>element.className)
    return {
      bodyInnerTextLength:bodyText.length,
      bodyInnerTextFirst300:bodyText.slice(0,300),
      rootChildCount:root?.children.length??0,
      onlineScreenClasses:onlineScreens,
      documentElementClassName:document.documentElement.className,
      currentUrl:window.location.href,
    }
  })
  const screenshotPath=testInfo.outputPath('signup-failure.png')
  await page.screenshot({path:screenshotPath,fullPage:true})
  await testInfo.attach('signup-failure',{path:screenshotPath,contentType:'image/png'})
  console.log(`[AUTH_FLOW_DIAGNOSTIC] onlineScreen=${screen}`)
  console.log(`[AUTH_FLOW_DIAGNOSTIC] landing=${JSON.stringify(landing)}`)
  console.log(`[AUTH_FLOW_DIAGNOSTIC] onlineMessage=${JSON.stringify(onlineMessage)}`)
  console.log(`[AUTH_FLOW_DIAGNOSTIC] dom=${JSON.stringify(dom)}`)
  console.log(`[AUTH_FLOW_DIAGNOSTIC] reloadOccurred=${reloadNavigations.length>0}`)
  console.log(`[AUTH_FLOW_DIAGNOSTIC] framenavigated=${JSON.stringify(reloadNavigations)}`)
  console.log(`[AUTH_FLOW_DIAGNOSTIC] consoleErrors=${JSON.stringify(consoleErrors)}`)
  return {screen,landing}
}

test('new email signup reaches Claim X Fighter Name without reload',async({page},testInfo)=>{
  const consoleErrors=collectConsoleErrors(page)
  collectAuthResponses(page)
  const reloadNavigations:string[]=[]
  const unique=`mx-auth-e2e-${Date.now()}-${Math.random().toString(36).slice(2,10)}@example.com`
  const password='MegaX-E2E-2026!'

  await page.goto('/')
  await page.locator('#mx-main-practice-cta').click()
  await expect(page.locator('.mx-online-screen.mx-auth')).toBeVisible()
  await page.getByRole('button',{name:'SIGN UP',exact:true}).click()
  await page.getByPlaceholder('EMAIL').fill(unique)
  await page.getByPlaceholder('PASSWORD').fill(password)
  page.on('framenavigated',(frame)=>{
    if(frame===page.mainFrame())reloadNavigations.push(frame.url())
  })
  await page.getByRole('button',{name:'CREATE ACCOUNT',exact:true}).click()

  await page.waitForTimeout(4000)

  const confirmationMessage=await nonBlockingOnlineMessage(page)
  if(confirmationMessage?.toUpperCase().includes('CONFIRM')){
    throw new Error(`E2E_SIGNUP_REQUIRES_EMAIL_CONFIRMATION:${confirmationMessage.trim()}`)
  }

  const evidence=await captureFailureEvidence(page,testInfo,consoleErrors,reloadNavigations)
  expect(evidence.screen,'successful signup must render the handle-claim screen').toBe('HANDLE')
  expect(evidence.landing.visible,'landing overlay must not remain visible over the handle-claim screen').toBe(false)
  await expect(page.getByRole('heading',{name:'CREATE X FIGHTER NAME'})).toBeVisible()
})

test('sign out removes lobby-only injected extras before returning to sign in',async({page})=>{
  await page.goto('/')
  await page.locator('#mx-main-practice-cta').click()
  await expect(page.locator('.mx-online-screen.mx-auth')).toBeVisible()
  await page.getByPlaceholder('EMAIL').fill(E2E_P1_EMAIL)
  await page.getByPlaceholder('PASSWORD').fill(E2E_P1_PASSWORD)
  await page.locator('.mx-online-primary').click()
  await expect(page.locator('.mx-online-screen.mx-lobby-shell')).toBeVisible({timeout:15_000})
  await expect(page.locator('header.mx-lobby-player strong').first()).toHaveText(E2E_P1_HANDLE,{timeout:15_000})
  await expect(page.locator('[data-mx-metrics]')).toBeVisible({timeout:15_000})
  await expect(page.locator('[data-mx-banner-slot]')).toBeVisible({timeout:15_000})

  await page.getByRole('button',{name:'SIGN OUT',exact:true}).click()
  await expect(page.locator('.mx-online-screen.mx-landing')).toBeVisible({timeout:15_000})
  await page.locator('#mx-main-practice-cta').click()
  await expect(page.locator('.mx-online-screen.mx-auth')).toBeVisible({timeout:15_000})

  for(const selector of ['[data-mx-metrics]','[data-mx-banner-slot]','[data-mx-sponsor]','[data-mx-news]','.mx-practice-entry[data-practice-entry="true"]']){
    await expect(page.locator(selector),`${selector} must not survive lobby -> sign-out -> AUTH`).toHaveCount(0)
  }
})
