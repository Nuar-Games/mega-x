import { readFileSync, writeFileSync } from 'node:fs'

const file='src/App.tsx'
let text=readFileSync(file,'utf8')

const importNeedle="import { VsIntroScreen, getMyActiveMatchVsIntro, joinMatchmakingVsIntro, respondToChallengeVsIntro } from './VsIntro'\n"
const importLine="import { ArenaNextRuntime } from './game/arena-next/ArenaNextRuntime'\n"
if(!text.includes(importLine)){
  if(!text.includes(importNeedle))throw new Error('ARENA_NEXT_IMPORT_ANCHOR_MISSING')
  text=text.replace(importNeedle,importNeedle+importLine)
}

const introBlock=`  if (activeOnlineMatch && onlineSession && (activeOnlineMatch.status as string) === 'VS_INTRO') {\n    return (\n      <VsIntroScreen key={activeOnlineMatch.id} session={onlineSession} match={activeOnlineMatch} onComplete={(nextMatch) => applyOnlineMatchView(nextMatch)} onError={setOnlineMessage} />\n    )\n  }\n`
const cutover=`${introBlock}\n  // arena-total-rewrite hard cutover: once a match starts, the legacy arena is never mounted.\n  if (started) {\n    return <ArenaNextRuntime allowPracticeBootstrap={!activeOnlineMatch} />\n  }\n`
if(!text.includes('arena-total-rewrite hard cutover')){
  if(!text.includes(introBlock))throw new Error('ARENA_NEXT_CUTOVER_ANCHOR_MISSING')
  text=text.replace(introBlock,cutover)
}

writeFileSync(file,text)
console.log('ARENA_NEXT_RUNTIME_CUTOVER_PATCHED')
