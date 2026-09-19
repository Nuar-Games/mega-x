import fs from 'node:fs'
import path from 'node:path'

const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const root='src/game/arena-next/live'
const files=['ArenaStateProjection.ts','ArenaEventDiff.ts','ArenaLiveController.ts']
for(const file of files) must(fs.existsSync(path.join(root,file)),`Phase 5 live file missing: ${file}`)
must(fs.existsSync('src/game/arena-next/prototype/live-main.ts'),'live prototype entry missing')
must(fs.existsSync('arena-next-live.html'),'isolated live arena HTML missing')

const projection=fs.readFileSync(path.join(root,'ArenaStateProjection.ts'),'utf8')
const diff=fs.readFileSync(path.join(root,'ArenaEventDiff.ts'),'utf8')
const controller=fs.readFileSync(path.join(root,'ArenaLiveController.ts'),'utf8')
const liveMain=fs.readFileSync('src/game/arena-next/prototype/live-main.ts','utf8')
const vite=fs.readFileSync('vite.config.ts','utf8')
const all=`${projection}\n${diff}\n${controller}\n${liveMain}`

must(projection.includes('projectActiveMatchToArenaState'),'real match projector missing')
must(projection.includes('computeArenaStats'),'authoritative arena stat projection missing')
must(projection.includes('hand:isLocal ? visibleHand : null'),'local hand identities must be viewer-relative and opponent identities hidden')
must(projection.includes('handCount:isLocal?visibleHand.length:Number(p.handCount'),'opponent hidden hand must use server count')
must(projection.includes('deckCount'),'Master Deck must remain count-only')
must(diff.includes('deriveArenaEvents'),'state-to-event derivation missing')
must(diff.includes('STATE_RECONCILED'),'unsafe diffs must have reconciliation fallback')
must(controller.includes('getMyActiveMatch'),'controller must load the existing active match')
must(controller.includes('submitMatchEngineAction'),'controller must use authoritative engine action RPC')
must(controller.includes('submitMatchSpecialAction'),'controller must use authoritative special action RPC')
must(controller.includes('STALE_MATCH_STATE'),'controller must explicitly reconcile stale writes')
must(controller.includes('subscribeToMatchChanges'),'controller must preserve realtime refresh signaling')
must(controller.includes('heartbeatMatch'),'controller must preserve match heartbeat')
must(liveMain.includes("action:'SET_VS'"),'live vertical slice must submit real SET_VS command')
must(vite.includes('arena-next-live.html'),'Vite must emit isolated live arena page')

for(const forbidden of ['MutationObserver','querySelector','button.click','transform: scale','transform:scale'])
  must(!all.includes(forbidden),`Phase 5 live bridge contains forbidden primitive: ${forbidden}`)

console.log('PASS next arena real match bridge boundary')
