import fs from 'node:fs'
import crypto from 'node:crypto'
const appPath=process.argv[2]||'src/App.tsx';let app=fs.readFileSync(appPath,'utf8')
const authPath='src/onlineAuth.ts';let auth=fs.readFileSync(authPath,'utf8')
if(!auth.includes('player1_start_place?: number | null')){
  const activeTypeAnchor="  status: 'COIN_TOSS' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED'\n  phase: string"
  if(!auth.includes(activeTypeAnchor))throw new Error('VS intro ActiveOnlineMatch type anchor missing')
  auth=auth.replace(activeTypeAnchor,"  status: 'VS_INTRO' | 'COIN_TOSS' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED'\n  player1_start_place?: number | null\n  player2_start_place?: number | null\n  phase: string")
  fs.writeFileSync(authPath,auth)
}
const arenaBlock=(source)=>{const start=source.indexOf('<section className="duel-shell">');if(start<0)throw new Error('Recovered Arena root missing before VS intro patch');const end=source.indexOf('\n      )}',start);if(end<0)throw new Error('Recovered Arena closing anchor missing before VS intro patch');return source.slice(start,end)}
const arenaHashBefore=crypto.createHash('sha256').update(arenaBlock(app)).digest('hex')
const mustReplace=(label,pattern,replacement)=>{const before=app;app=app.replace(pattern,replacement);if(app===before)throw new Error(`VS intro patch anchor missing: ${label}`)}
const replaceAllLiteral=(label,from,to)=>{if(!app.includes(from))throw new Error(`VS intro patch anchor missing: ${label}`);app=app.split(from).join(to)}
if(app.includes("from './VsIntro'")){console.log('VS intro flow already patched');process.exit(0)}
for(const token of ['chooseMatchCoin, ','getMyActiveMatch, ','joinMatchmaking, ','respondToChallenge, ','startMatchAfterCoinSafe, '])app=app.replace(token,'')
const onlineAuthImport=app.match(/import \{[^\n]+\} from '\.\/onlineAuth'\n/);if(!onlineAuthImport)throw new Error('VS intro patch anchor missing: onlineAuth import');app=app.replace(onlineAuthImport[0],`${onlineAuthImport[0]}import { VsIntroScreen, getMyActiveMatchVsIntro, joinMatchmakingVsIntro, respondToChallengeVsIntro } from './VsIntro'\n`)
app=app.replace(/\n\s*const \[coinChoice, setCoinChoice\][^\n]*\n\s*const \[coinStage, setCoinStage\][^\n]*\n\s*const \[coinFace, setCoinFace\][^\n]*/,'');app=app.replace(/\n\s*const coinArenaTransitionRef = useRef<[^\n]+/,'')
if(/coinChoice|coinStage|coinFace|coinArenaTransitionRef/.test(app.slice(0,app.indexOf('function applyOnlineMatchView'))))throw new Error('Coin Toss state survived VS intro patch')
replaceAllLiteral('getMyActiveMatch calls','getMyActiveMatch(','getMyActiveMatchVsIntro(');replaceAllLiteral('joinMatchmaking calls','joinMatchmaking(','joinMatchmakingVsIntro(')
mustReplace('VS_INTRO status gate',/(\s+const me: PlayerIndex = match\.player1_id === onlineSession\.userId \? 0 : 1\n\s+setLocalViewer\(me\)\n)/,`$1\n    if ((match.status as string) === 'VS_INTRO') {\n      setStarted(false)\n      return\n    }\n`)
app=app.replace(/\n\s*const coinResult = match\.state\?\.coinResult[\s\S]*?\n\s*setStarted\(true\)\n\s*setOnlineScreen\('GAME'\)/,`\n      setStarted(true)\n      setOnlineScreen('GAME')`)
app=app.replace(/\n\s*} else if \(match\.status === 'COIN_TOSS'\) \{[\s\S]*?\n\s*}\n\s*}\n\n\s*async function refreshActiveMatch/,`\n    }\n  }\n\n  async function refreshActiveMatch`)
app=app.replace(/\n\s*setCoinStage\('CHOOSE'\)/g,'');app=app.replace(/\n\s*setCoinFace\(null\)/g,'')
app=app.replace(/\n\s*useEffect\(\(\) => \{\n\s*if \(!onlineSession \|\| !activeOnlineMatch\) return\n\s*if \(activeOnlineMatch\.status !== 'COIN_TOSS'[\s\S]*?\n\s*}\, \[onlineSession\?\.accessToken, activeOnlineMatch\?\.id, activeOnlineMatch\?\.status, activeOnlineMatch\?\.phase, activeOnlineMatch\?\.player1_id\]\)\n/,'\n')
mustReplace('challenge response flow',/const result = await respondToChallenge\(onlineSession, activeChallenge\.id, accept\)\n\s*setActiveChallenge\(result\.status === 'ACCEPTED' \? result : null\)\n\s*setOnlineMessage\(result\.status === 'ACCEPTED' \? 'CHALLENGE ACCEPTED\.' : 'CHALLENGE DECLINED\.'\)/,`const result = await respondToChallengeVsIntro(onlineSession, activeChallenge.id, accept)\n      setActiveChallenge(null)\n      setOnlineMessage(result.status === 'ACCEPTED' ? '' : 'CHALLENGE DECLINED.')\n      if (result.status === 'ACCEPTED') {\n        const match = await getMyActiveMatchVsIntro(onlineSession)\n        if (match) applyOnlineMatchView(match)\n      }`)
mustReplace('coin sequence deletion',/\n\s*async function startCoinSequence\(\) \{[\s\S]*?\n\s*function setVS\(/,`\n\n  function resetToCoin() {\n    setStarted(false)\n    setArenaIntro(false)\n    setFocusedCard(null)\n    setPileView(null)\n    initializeMatch(0)\n  }\n\n  function setVS(`)
app=app.replace(/\n\s*const coinResultStarter: PlayerIndex \| null = activeOnlineMatch[\s\S]*?\n\s*: coinFace === null \? null : \(coinFace === coinChoice \? 0 : 1\)\n/,'\n')
mustReplace('top-level VS intro screen',/\n\s*if \(onlineScreen === 'LANDING'\) \{/,`\n\n  if (activeOnlineMatch && onlineSession && (activeOnlineMatch.status as string) === 'VS_INTRO') {\n    return (\n      <VsIntroScreen key={activeOnlineMatch.id} session={onlineSession} match={activeOnlineMatch} onComplete={(nextMatch) => applyOnlineMatchView(nextMatch)} onError={setOnlineMessage} />\n    )\n  }\n\n  if (onlineScreen === 'LANDING') {`)
mustReplace('Coin Toss JSX deletion',/\{!started \? \(\n\s*<section className=\{`start-screen arcade-opening coin-screen-v1[\s\S]*?\n\s*\) : \(\n(?=\s*<section className="duel-shell">)/,`{started && (\n`)
for(const token of ['COIN_TOSS','coin-screen-v1','startCoinSequence','chooseMatchCoin','startMatchAfterCoinSafe','coinChoice','coinStage','coinFace','coinArenaTransitionRef'])if(app.includes(token))throw new Error(`Deleted Coin Toss token survived: ${token}`)
for(const required of ['VsIntroScreen',"status as string) === 'VS_INTRO'",'respondToChallengeVsIntro','joinMatchmakingVsIntro','getMyActiveMatchVsIntro','<section className="duel-shell">'])if(!app.includes(required))throw new Error(`VS intro integration missing required token: ${required}`)
const arenaHashAfter=crypto.createHash('sha256').update(arenaBlock(app)).digest('hex');if(arenaHashAfter!==arenaHashBefore)throw new Error(`Arena markup changed during VS intro patch: ${arenaHashBefore} -> ${arenaHashAfter}`)
fs.writeFileSync(appPath,app);console.log(`Applied isolated VS_INTRO flow with real-rank type support; Coin Toss deleted; Arena markup preserved (${arenaHashAfter})`)
