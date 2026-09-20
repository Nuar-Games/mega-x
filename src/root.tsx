import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import App from './App.tsx'
import { getMyActiveMatch, getSavedSession, type ActiveOnlineMatch, type OnlineSession } from './onlineAuth'
import { getPracticeMatchForUser, startPracticeMatch } from './practice-match'

type ArenaRoute={session:OnlineSession;match:ActiveOnlineMatch}|null

const ArenaNextRuntime=lazy(()=>
  import('./game/arena-next/ArenaNextRuntime').then((module)=>({default:module.ArenaNextRuntime})),
)
const ARENA_STATUSES=new Set<ActiveOnlineMatch['status']>(['ACTIVE','PAUSED','COMPLETED'])
const GUEST_KEY='mega-x-practice-guest-id-v1'

function guestSession():OnlineSession|null{
  try{
    const userId=window.localStorage.getItem(GUEST_KEY)
    if(!userId)return null
    return {accessToken:'practice-local',refreshToken:'practice-local',expiresAt:Number.MAX_SAFE_INTEGER,userId}
  }catch{return null}
}

function practiceRoute():ArenaRoute{
  const session=guestSession()
  if(!session)return null
  const match=getPracticeMatchForUser(session.userId) as ActiveOnlineMatch|null
  return match&&ARENA_STATUSES.has(match.status)?{session,match}:null
}

export default function Root(){
  const [arenaRoute,setArenaRoute]=useState<ArenaRoute>(practiceRoute)
  const routeRef=useRef<ArenaRoute>(arenaRoute)
  const forwardingSignIn=useRef(false)
  routeRef.current=arenaRoute

  useEffect(()=>{
    let cancelled=false

    const check=async()=>{
      const practice=practiceRoute()
      if(practice){if(!cancelled)setArenaRoute(practice);return}
      const session=getSavedSession()
      if(!session){if(!cancelled)setArenaRoute(null);return}
      try{
        const match=await getMyActiveMatch(session)
        if(cancelled)return
        setArenaRoute(match&&ARENA_STATUSES.has(match.status)?{session,match}:null)
      }catch{
        // A failed active-match poll is unknown state, not proof that the match ended.
        // Preserve any mounted arena route so transient network loss can reconcile
        // when connectivity returns instead of unmounting into App/session bootstrap.
      }
    }

    const startPractice=()=>{
      window.setTimeout(()=>{
        if(cancelled)return
        const current=practiceRoute()
        if(current){setArenaRoute(current);return}
        const session=getSavedSession()??guestSession()
        if(!session)return
        const match=startPracticeMatch(session.userId,'GUEST X FIGHTER') as ActiveOnlineMatch
        setArenaRoute({session,match})
      },0)
    }

    const openSignIn=()=>{
      if(forwardingSignIn.current){forwardingSignIn.current=false;return}
      if(!routeRef.current)return
      setArenaRoute(null)
      forwardingSignIn.current=true
      window.setTimeout(()=>window.dispatchEvent(new CustomEvent('mega-x:open-sign-in')),0)
    }

    void check()
    const poll=window.setInterval(()=>{void check()},1000)
    window.addEventListener('mega-x:start-practice-match',startPractice)
    window.addEventListener('mega-x:practice-exit',check)
    window.addEventListener('mega-x:open-sign-in',openSignIn)
    window.addEventListener('focus',check)
    return()=>{
      cancelled=true
      window.clearInterval(poll)
      window.removeEventListener('mega-x:start-practice-match',startPractice)
      window.removeEventListener('mega-x:practice-exit',check)
      window.removeEventListener('mega-x:open-sign-in',openSignIn)
      window.removeEventListener('focus',check)
    }
  },[])

  if(arenaRoute)return (
    <Suspense fallback={<div aria-label="Loading arena" style={{minHeight:'100dvh',background:'#030407'}}/>}>
      <ArenaNextRuntime allowPracticeBootstrap={false} session={arenaRoute.session} match={arenaRoute.match}/>
    </Suspense>
  )
  return <App/>
}
