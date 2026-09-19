import { readFileSync, writeFileSync } from 'node:fs'

const file='src/App.tsx'
let text=readFileSync(file,'utf8')

const importLine="import { ArenaNextRuntime } from './game/arena-next/ArenaNextRuntime'\n"
if(!text.includes(importLine)){
  const anchor="import { AppOpenHook, shouldShowAppOpenHook } from './AppOpenHook'\n"
  if(!text.includes(anchor))throw new Error('Arena-next route import anchor missing')
  text=text.replace(anchor,anchor+importLine)
}
text=text.replace("import { CARD_INFO } from './arena-card-info.ts'\n",'')

const renderStart='\n  return (\n    <main className="app">'
const renderEnd='\n}\n\nfunction resolveEffect'
const start=text.indexOf(renderStart)
const end=text.indexOf(renderEnd,start)
if(start<0||end<0)throw new Error('Legacy arena render block not found')
const replacement=`\n  return <ArenaNextRuntime\n    allowPracticeBootstrap={onlineSession?.accessToken === 'practice-local'}\n    session={onlineSession}\n    match={activeOnlineMatch}\n  />`
text=text.slice(0,start)+replacement+text.slice(end)

const helperStart=text.indexOf('\nfunction LiveStats(')
const exportMarker='\nexport default App\n'
const exportIndex=text.indexOf(exportMarker)
if(helperStart>=0&&exportIndex>helperStart){
  text=text.slice(0,helperStart)+exportMarker
}

writeFileSync(file,text)
console.log('ARENA_NEXT_ONLY_ROUTE_APPLIED')
