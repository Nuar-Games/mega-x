import { test, expect, type BrowserContext, type Page } from 'playwright/test'
import { arenaStatus, driveOneHumanAction, waitForArenaReady, waitForVersionChange } from './helpers/arenaDriver'

type Credentials={email:string;password:string;handle:string}

const SYNC_TIMEOUT=12_000
const STEP_TIMEOUT=3_000

function generatedCredentials(slot:1|2):Credentials{
  const nonce=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`
  return {
    email:`mega-x-e2e-${slot}-${nonce}@example.com`,
    password:`MxE2E!${nonce}Aa9`,
    handle:`E2E${slot}${nonce.replace(/[^a-z0-9]/gi,'').slice(-8).toUpperCase()}`,
  }
}

function credentials(slot:1|2):Credentials{
  const prefix=`MEGA_X_E2E_P${slot}_`
  const email=process.env[`${prefix}EMAIL`]
  const password=process.env[`${prefix}PASSWORD`]
  const handle=process.env[`${prefix}HANDLE`]
  if(email&&password&&handle)return {email,password,handle}
  return generatedCredentials(slot)
}

async function establishOnlineSession(page:Page,account:Credentials){
  await page.goto('/')
  return page.evaluate(async(account)=>{
    const auth=await import('/src/onlineAuth.ts')
    let session
    try{session=await auth.signInWithEmail(account.email,account.password)}
    catch{
      const created=await auth.signUpWithEmail(account.email,account.password)
      session=created.session
      await auth.claimFighterHandle(session,account.handle)
    }
    const profile=await auth.loadProfile(session)
    if(!profile?.fighter_handle)await auth.claimFighterHandle(session,account.handle)
    return {userId:session.userId,handle:(await auth.loadProfile(session))?.fighter_handle??account.handle}
  },account)
}

async function joinRealMatch(page:Page){
  return page.evaluate(async()=>{
    const auth=await import('/src/onlineAuth.ts')
    const intro=await import('/src/VsIntro.tsx')
    const session=auth.getSavedSession()
    if(!session)throw new Error('E2E_NO_SAVED_SESSION')
    return intro.joinMatchmakingVsIntro(session)
  })
}

async function activeMatch(page:Page){
  return page.evaluate(async()=>{
    const auth=await import('/src/onlineAuth.ts')
    const intro=await import('/src/VsIntro.tsx')
    const session=auth.getSavedSession()
    if(!session)throw new Error('E2E_NO_SAVED_SESSION')
    const match=await intro.getMyActiveMatchVsIntro(session)
    return match?{id:match.id,status:match.status,stateVersion:Number(match.state_version),phase:String(match.state?.phase??match.phase),round:Number(match.state?.round??0)}:null
  })
}

async function startRealMatch(page:Page,matchId:string){
  await page.evaluate(async(matchId)=>{
    const auth=await import('/src/onlineAuth.ts')
    const intro=await import('/src/VsIntro.tsx')
    const session=auth.getSavedSession()
    if(!session)throw new Error('E2E_NO_SAVED_SESSION')
    await intro.startVsIntroMatch(session,matchId)
  },matchId)
}

async function waitForSameMatch(page1:Page,page2:Page){
  let sharedId=''
  await expect.poll(async()=>{
    const [one,two]=await Promise.all([activeMatch(page1),activeMatch(page2)])
    if(one&&two&&one.id===two.id){sharedId=one.id;return one.id}
    return ''
  },{timeout:20_000,intervals:[250,500,750]}).not.toBe('')
  return sharedId
}

async function waitForPeerVersion(page:Page,version:number){
  await expect.poll(async()=> (await arenaStatus(page)).version,{timeout:SYNC_TIMEOUT,intervals:[100,200,400]}).toBeGreaterThanOrEqual(version)
}

async function driveNextAction(pages:[Page,Page]){
  for(const page of pages){
    const status=await arenaStatus(page)
    if(status.phase==='GAME_OVER')return {acted:false,status}
    if(status.legalActions.length===0)continue
    const result=await driveOneHumanAction(page)
    if(!result.advanced)throw new Error(`online action stuck in ${status.phase} at V${status.version}; legal=${status.legalActions.join('|')}`)
    const after=await arenaStatus(page)
    const peer=pages[0]===page?pages[1]:pages[0]
    await waitForPeerVersion(peer,after.version)
    return {acted:true,status:after}
  }
  const before=await Promise.all(pages.map(arenaStatus))
  const version=Math.max(...before.map(status=>status.version))
  const advanced=await Promise.all(pages.map(page=>waitForVersionChange(page,version,STEP_TIMEOUT)))
  if(!advanced.some(Boolean))throw new Error(`online match has no legal actor at V${version}: ${before.map(s=>`${s.phase}[${s.legalActions.join('|')}]`).join(' / ')}`)
  return {acted:false,status:await arenaStatus(pages[0])}
}

async function playUntil(pages:[Page,Page],predicate:(statuses:[Awaited<ReturnType<typeof arenaStatus>>,Awaited<ReturnType<typeof arenaStatus>>])=>boolean,maxSteps=120){
  for(let step=0;step<maxSteps;step+=1){
    const statuses=await Promise.all(pages.map(arenaStatus)) as [Awaited<ReturnType<typeof arenaStatus>>,Awaited<ReturnType<typeof arenaStatus>>]
    if(predicate(statuses))return statuses
    if(statuses.every(status=>status.phase==='GAME_OVER'))return statuses
    await driveNextAction(pages)
  }
  throw new Error('online match exceeded action budget')
}

async function pageErrors(page:Page){
  const errors:string[]=[]
  page.on('pageerror',error=>errors.push(error.message))
  return errors
}

async function reopenArena(page:Page){
  await page.reload()
  const status=await waitForArenaReady(page,30_000)
  expect(status.mode).toBe('ONLINE')
  return status
}

test('two real online players finish a match and one reconciles after reconnect',async({browser})=>{
  test.setTimeout(300_000)
  const context1=await browser.newContext({viewport:{width:1440,height:1000}})
  const context2=await browser.newContext({viewport:{width:1440,height:1000}})
  const page1=await context1.newPage()
  const page2=await context2.newPage()
  const errors1=await pageErrors(page1)
  const errors2=await pageErrors(page2)

  try{
    const [player1,player2]=await Promise.all([
      establishOnlineSession(page1,credentials(1)),
      establishOnlineSession(page2,credentials(2)),
    ])
    expect(player1.userId).not.toBe(player2.userId)

    await joinRealMatch(page1)
    await joinRealMatch(page2)
    const matchId=await waitForSameMatch(page1,page2)
    expect(matchId).toBeTruthy()

    await startRealMatch(page1,matchId)
    await expect.poll(async()=> (await activeMatch(page1))?.status,{timeout:15_000}).toBe('ACTIVE')
    await expect.poll(async()=> (await activeMatch(page2))?.status,{timeout:15_000}).toBe('ACTIVE')

    await Promise.all([reopenArena(page1),reopenArena(page2)])
    const pages:[Page,Page]=[page1,page2]

    const preReconnect=await playUntil(pages,statuses=>statuses.every(status=>status.round>=2))
    expect(preReconnect.every(status=>status.round>=2),'both clients must complete at least one normal round before reconnect').toBe(true)

    let offlineIndex:0|1=0
    let onlineIndex:0|1=1
    if(preReconnect[0].legalActions.length>0&&preReconnect[1].legalActions.length===0){offlineIndex=1;onlineIndex=0}
    else if(preReconnect[1].legalActions.length>0&&preReconnect[0].legalActions.length===0){offlineIndex=0;onlineIndex=1}
    else{
      await driveNextAction(pages)
      const now=await Promise.all(pages.map(arenaStatus))
      if(now[0].legalActions.length>0){offlineIndex=1;onlineIndex=0}
      else {offlineIndex=0;onlineIndex=1}
    }

    const offlineContext:[BrowserContext,BrowserContext]=[context1,context2]
    const stale=await arenaStatus(pages[offlineIndex])
    await offlineContext[offlineIndex].setOffline(true)
    await pages[offlineIndex].waitForTimeout(2_500)

    const actorBefore=await arenaStatus(pages[onlineIndex])
    if(actorBefore.legalActions.length>0){
      const result=await driveOneHumanAction(pages[onlineIndex])
      expect(result.advanced,'authoritative online peer must advance while the other client is offline').toBe(true)
    }
    const authoritative=await arenaStatus(pages[onlineIndex])
    expect(authoritative.version).toBeGreaterThan(stale.version)

    await offlineContext[offlineIndex].setOffline(false)
    await expect.poll(async()=>{
      const recovered=await arenaStatus(pages[offlineIndex])
      return `${recovered.version}:${recovered.round}:${recovered.phase}`
    },{timeout:15_000,intervals:[250,500,1000]}).toBe(`${authoritative.version}:${authoritative.round}:${authoritative.phase}`)

    expect(errors1,`player 1 page errors: ${errors1.join(' | ')}`).toEqual([])
    expect(errors2,`player 2 page errors: ${errors2.join(' | ')}`).toEqual([])

    const finished=await playUntil(pages,statuses=>statuses.every(status=>status.phase==='GAME_OVER'),180)
    expect(finished[0].phase).toBe('GAME_OVER')
    expect(finished[1].phase).toBe('GAME_OVER')
    expect(finished[0].version).toBe(finished[1].version)
    expect(errors1,`player 1 page errors: ${errors1.join(' | ')}`).toEqual([])
    expect(errors2,`player 2 page errors: ${errors2.join(' | ')}`).toEqual([])
  }finally{
    await context1.close()
    await context2.close()
  }
})
