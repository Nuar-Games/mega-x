import fs from 'node:fs'
import path from 'node:path'

const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const root='src/game/arena-next'
const files=['ArenaState.ts','ArenaEvents.ts','ArenaEventQueue.ts']

for(const file of files){
  const full=path.join(root,file)
  must(fs.existsSync(full),`next arena contract file missing: ${full}`)
}

const state=fs.readFileSync(path.join(root,'ArenaState.ts'),'utf8')
const events=fs.readFileSync(path.join(root,'ArenaEvents.ts'),'utf8')
const queue=fs.readFileSync(path.join(root,'ArenaEventQueue.ts'),'utf8')
const all=`${state}\n${events}\n${queue}`

for(const symbol of [
  'ArenaState','ArenaPlayerState','ArenaCardState','ArenaVsState','ArenaEffectState',
  'ArenaStats','ArenaPendingChoice','ArenaConnectionState','ArenaMatchIdentity'
]) must(state.includes(`export type ${symbol}`)||state.includes(`export interface ${symbol}`),`ArenaState contract missing ${symbol}`)

for(const symbol of ['ArenaEventType','ArenaEvent','ArenaEventEnvelope'])
  must(events.includes(`export type ${symbol}`)||events.includes(`export interface ${symbol}`),`Arena event contract missing ${symbol}`)

for(const method of ['enqueue(','peek(','shift(','clear(','resetForState(','size'])
  must(queue.includes(method),`ArenaEventQueue missing ${method}`)

must(events.includes('fromVersion'),'arena events must record fromVersion')
must(events.includes('toVersion'),'arena events must record toVersion')
must(events.includes('sequence'),'arena events must record ordered sequence')
must(events.includes('matchId'),'arena events must be scoped to a match')

must(state.includes('handCount'),'hidden opponent hand identities must be representable as a count')
must(state.includes('deckCount'),'Master Deck hidden identities must be represented as a count')
must(state.includes("localPlayerIndex: 0 | 1"),'arena state must identify local player without DOM inference')
must(state.includes('ArenaEffectSlots'),'arena state must expose fixed five-slot Effect rails')

for(const forbidden of ['MutationObserver','querySelector','document.','.click()'])
  must(!all.includes(forbidden),`new arena contract must not depend on DOM bridge primitive: ${forbidden}`)

console.log('PASS next arena state/event contract boundary')
