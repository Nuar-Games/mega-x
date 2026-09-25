import { getPracticeMatchForUser } from './practice-match'
import { useEffect, useRef, useState } from 'react'
import type { ActiveChallenge, ActiveOnlineMatch, OnlineSession } from './onlineAuth'
import './VsIntro.css'
import './VsIntroHype.css'

const VS_INTRO_AUDIO_SRC = '/audio/coin-toss/mega-x-coin-toss-v1.opus'
const VS_INTRO_AUDIO_START = 10
const VS_SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://mmtorfzxnidsczcdygbp.supabase.co') as string
const VS_SUPABASE_KEY = ((import.meta as any).env?.VITE_SUPABASE_KEY || 'sb_publishable_fXF7LXgKXeH4p5_Bwai0nQ_d-NWdOk_') as string

type VsIntroStage = 'ENTRY' | 'VERSUS' | 'REVEAL'

function fighterNameSizeClass(name: string) {
  const length = name.trim().length
  if (length > 18) return 'mx-vs-name-size-xlong'
  if (length > 11) return 'mx-vs-name-size-long'
  return 'mx-vs-name-size-normal'
}

function rankLabel(place: number | null | undefined) {
  return Number.isFinite(place) && Number(place) > 0 ? `#${place}` : '#—'
}

async function vsIntroRpc(session: OnlineSession, name: string, body: Record<string, unknown> = {}) {
  const response = await fetch(`${VS_SUPABASE_URL}/rest/v1/rpc/${name}`, { method:'POST', headers:{ apikey:VS_SUPABASE_KEY, Authorization:`Bearer ${session.accessToken}`, 'Content-Type':'application/json' }, body:JSON.stringify(body) })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || payload?.error || `VS_INTRO_HTTP_${response.status}`)
  return payload
}
export async function respondToChallengeVsIntro(session: OnlineSession, challengeId: string, accept: boolean): Promise<ActiveChallenge> { return vsIntroRpc(session,'respond_to_challenge_vs_intro',{p_challenge:challengeId,p_accept:accept}) }
export async function getMyActiveMatchVsIntro(session: OnlineSession): Promise<ActiveOnlineMatch|null> { const practice=getPracticeMatchForUser(session.userId); if(practice)return practice as ActiveOnlineMatch; const rows=await vsIntroRpc(session,'get_my_active_match_vs_intro'); return Array.isArray(rows)&&rows.length?rows[0]:null }
export async function startVsIntroMatch(session: OnlineSession, matchId: string) { return vsIntroRpc(session,'start_vs_intro_match',{p_match:matchId}) }
export async function joinMatchmakingVsIntro(session: OnlineSession): Promise<string|null> { const result=await vsIntroRpc(session,'join_matchmaking_vs_intro'); return typeof result==='string'?result:null }

type Props={session:OnlineSession;match:ActiveOnlineMatch;onComplete:(match:ActiveOnlineMatch)=>void;onError:(message:string)=>void}
export function VsIntroScreen({session,match,onComplete,onError}:Props){
  const [stage,setStage]=useState<VsIntroStage>('ENTRY'),timersRef=useRef<number[]>([]),audioRef=useRef<HTMLAudioElement|null>(null),startedRef=useRef(false),completedRef=useRef(false),seamPacketRef=useRef<HTMLSpanElement|null>(null)
  useEffect(()=>{let disposed=false,startedMatch:ActiveOnlineMatch|null=null;const introStartedAt=performance.now();const finish=()=>{if(disposed||completedRef.current||startedMatch===null)return;completedRef.current=true;onComplete(startedMatch)};const schedule=(delay:number,action:()=>void)=>{const timer=window.setTimeout(()=>{if(!disposed)action()},delay);timersRef.current.push(timer)};const audio=new Audio(VS_INTRO_AUDIO_SRC);audio.preload='auto';audio.volume=.28;audioRef.current=audio;const playIntroSegment=()=>{if(disposed)return;audio.currentTime=VS_INTRO_AUDIO_START;void audio.play().catch(()=>undefined)};if(audio.readyState>=1)playIntroSegment();else audio.addEventListener('loadedmetadata',playIntroSegment,{once:true});audio.load();setStage('ENTRY');schedule(2500,()=>setStage('VERSUS'));schedule(8400,()=>{setStage('REVEAL');if(startedRef.current)return;startedRef.current=true;void startVsIntroMatch(session,match.id).then(()=>getMyActiveMatchVsIntro(session)).then(activeMatch=>{if(disposed)return;if(!activeMatch||activeMatch.status!=='ACTIVE')throw new Error('MATCH_START_NOT_ACTIVE');startedMatch=activeMatch;if(performance.now()-introStartedAt>=10000)finish()}).catch(error=>onError(error instanceof Error?error.message.replaceAll('_',' '):'MATCH START FAILED'))});schedule(10000,()=>{audio.pause();finish()});return()=>{disposed=true;audio.removeEventListener('loadedmetadata',playIntroSegment);timersRef.current.forEach(t=>window.clearTimeout(t));timersRef.current=[];const current=audioRef.current;if(current){current.pause();current.currentTime=0}audioRef.current=null}},[match.id,session.accessToken])
  useEffect(()=>{if(stage==='REVEAL')return;const packet=seamPacketRef.current;if(!packet)return;const animation=packet.animate([{transform:'translateY(0) scaleY(.65)',opacity:0},{transform:'translateY(-70%) scaleY(1.15)',opacity:1,offset:.12},{transform:'translateY(-560%) scaleY(1.05)',opacity:1,offset:.82},{transform:'translateY(-700%) scaleY(.7)',opacity:0}],{duration:620,iterations:Infinity,easing:'linear'});return()=>animation.cancel()},[stage])

  const p1NameClass=fighterNameSizeClass(match.player1_handle)
  const p2NameClass=fighterNameSizeClass(match.player2_handle)

  return <main className="app mx-vs-intro-root"><section className={`mx-vs-intro stage-${stage.toLowerCase()}`} aria-label="Match introduction"><div className="mx-vs-noise" aria-hidden="true"/><div className="mx-vs-flash-grid" aria-hidden="true"/><div className="mx-vs-speedlines mx-vs-speedlines-left" aria-hidden="true"/><div className="mx-vs-speedlines mx-vs-speedlines-right" aria-hidden="true"/><div className="mx-vs-half mx-vs-half-p1"><div className="mx-vs-energy mx-vs-energy-p1" aria-hidden="true"/></div><div className="mx-vs-half mx-vs-half-p2"><div className="mx-vs-energy mx-vs-energy-p2" aria-hidden="true"/></div><img className="mx-vs-logo" src="/ui/landing/logo.avif" alt="MEGA-X"/><div className="mx-vs-card mx-vs-card-p1"><h1 className={`mx-vs-name ${p1NameClass}`}>{match.player1_handle}</h1><div className="mx-vs-ranking">{rankLabel(match.player1_start_place)}</div></div><div className="mx-vs-card mx-vs-card-p2"><h1 className={`mx-vs-name ${p2NameClass}`}>{match.player2_handle}</h1><div className="mx-vs-ranking">{rankLabel(match.player2_start_place)}</div></div>{stage!=='REVEAL'&&<div className="mx-vs-seam" aria-hidden="true"><span ref={seamPacketRef}/></div>}<div className="mx-vs-impact-ring" aria-hidden="true"/><div className="mx-vs-mark" aria-hidden="true"><span>V</span><i/><span>S</span></div><div className="mx-vs-lens-flare" aria-hidden="true"/><div className="mx-vs-reveal-flash" aria-hidden="true"/></section></main>
}
