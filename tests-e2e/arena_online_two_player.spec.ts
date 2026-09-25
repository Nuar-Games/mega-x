import { test, expect, type BrowserContext, type Page } from 'playwright/test'
import { arenaStatus, driveOneHumanAction, waitForArenaReady } from './helpers/arenaDriver'

type Credentials={email:string;password:string;handle:string}

const SYNC_TIMEOUT=12_000
const PRODUCTION_SUPABASE_URL='https://mmtorfzxnidsczcdygbp.supabase.co'
const E2E_SUPABASE_ENV=process.env.VITE_SUPABASE_ENV
const E2E_SUPABASE_URL=process.env.VITE_SUPABASE_URL

if(E2E_SUPABASE_ENV!=='test'||!E2E_SUPABASE_URL||E2E_SUPABASE_URL===PRODUCTION_SUPABASE_URL){
  throw new Error('Online E2E refused to run against production: VITE_SUPABASE_ENV must be test and VITE_SUPABASE_URL must be set to a non-production Supabase project.')
}

function credentials(slot:1|2):Credentials{
  const prefix=`MEGA_X_E2E_P${slot}_`
  const email=process.env[`${prefix}EMAIL`]
  const password=process.env[`${prefix}PASSWORD`]
  const handle=process.env[`${prefix}HANDLE`]
  if(!email||!password||!handle){
    throw new Error(`${prefix}EMAIL, ${prefix}PASSWORD and ${prefix}HANDLE are required fixed E2E credentials`)
  }
  return {email,password,handle}
}

async function establishOnlineSession(page:Page,account:Credentials){
  await page.goto('/')
  return page.evaluate(async(account)=>{
    const auth=await import('/src/onlineAuth.ts')
    const session=await auth.signInWithEmail(account.email,account.password)
    const profile=await auth.loadProfile(session)
    if(!profile?.fighter_handle)throw new Error('E2E_FIXED_ACCOUNT_HANDLE_MISSING')
    if(profile.fighter_handle!==account.handle)throw new Error(`E2E_FIXED_ACCOUNT_HANDLE_MISMATCH:${profile.fighter_handle}`)
    return {userId:session.userId,handle:profile.fighter_handle}
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
  await expect.poll(async()=>{
    const current=await Promise.all(pages.map(arenaStatus))
    return current.some((status,index)=>
      status.version!==before[index].version||
      status.connectionStatus!==before[index].connectionStatus||
      status.legalActions.length>0||
      status.phase==='GAME_OVER',
    )
  },{timeout:SYNC_TIMEOUT,intervals:[100,200,400]}).toBe(true)
  return {acted:false,status:await arenaStatus(pages[0])}
}

async function playUntil(pages:[Page,Page],predicate:(statuses:[Awaited<ReturnType<typeof arenaStatus>>,Awaited<ReturnType<typeof arenaStatus>>])=>boolean,maxSteps=60){
  for(let step=0;step<maxSteps;step+=1){
    const statuses=await Promise.all(pages.map(arenaStatus)) as [Awaited<ReturnType<typeof arenaStatus>>,Awaited<ReturnType<typeof arenaStatus>>]
    if(predicate(statuses))return statuses
    if(statuses.every(status=>status.phase==='GAME_OVER'))return statuses
    await driveNextAction(pages)
  }
  throw new Error('online browser smoke test exceeded action budget before round 2')
}

function collectPageErrors(page:Page){
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

test('two real online players reach round 2 and reconcile exactly after reconnect',async({browser})=>{
  test.setTimeout(180_000)
  const context1=await browser.newContext({viewport:{width:1440,height:1000}})
  const context2=await browser.newContext({viewport:{width:1440,height:1000}})
  const page1=await context1.newPage()
  const page2=await context2.newPage()
  const errors1=collectPageErrors(page1)
  const errors2=collectPageErrors(page2)

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
      else if(now[1].legalActions.length>0){offlineIndex=0;onlineIndex=1}
      else throw new Error('no authoritative actor available for reconnect proof')
    }

    const contexts:[BrowserContext,BrowserContext]=[context1,context2]
    const stale=await arenaStatus(pages[offlineIndex])
    await contexts[offlineIndex].setOffline(true)
    await pages[offlineIndex].waitForTimeout(2_500)

    const actorBefore=await arenaStatus(pages[onlineIndex])
    expect(actorBefore.legalActions.length,'online peer must own a legal action while the other client is offline').toBeGreaterThan(0)
    const result=await driveOneHumanAction(pages[onlineIndex])
    expect(result.advanced,'authoritative online peer must advance while the other client is offline').toBe(true)
    const authoritative=await arenaStatus(pages[onlineIndex])
    expect(authoritative.version).toBeGreaterThan(stale.version)

    await contexts[offlineIndex].setOffline(false)
    await expect.poll(async()=>{
      const [recovered,peer,server]=await Promise.all([
        arenaStatus(pages[offlineIndex]),
        arenaStatus(pages[onlineIndex]),
        activeMatch(pages[onlineIndex]),
      ])
      return Boolean(server&&
        server.status==='ACTIVE'&&
        recovered.connectionStatus==='online'&&
        peer.connectionStatus==='online'&&
        recovered.version===server.stateVersion&&
        peer.version===server.stateVersion&&
        recovered.round===server.round&&
        peer.round===server.round&&
        recovered.phase===server.phase&&
        peer.phase===server.phase)
    },{timeout:20_000,intervals:[250,500,1000]}).toBe(true)

    expect(errors1,`player 1 page errors: ${errors1.join(' | ')}`).toEqual([])
    expect(errors2,`player 2 page errors: ${errors2.join(' | ')}`).toEqual([])
  }finally{
    await context1.close()
    await context2.close()
  }
})
