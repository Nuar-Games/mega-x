import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const source = fs.readFileSync('src/beginner-bot.ts', 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const temp = path.join(os.tmpdir(), `beginner-bot-${process.pid}-${Date.now()}.mjs`)
fs.writeFileSync(temp, compiled)
const { beginnerBotCandidates, runBeginnerBotActions } = await import(`${pathToFileURL(temp).href}?v=${Date.now()}`)
fs.unlinkSync(temp)

const P1='human', P2='beginner-bot', meta={player1_id:P1,player2_id:P2}
const base=()=>({
 player1:{hand:[1,2,3,4,5],vs:null,effects:[],discard:[],x:[],attackBlocks:0},
 player2:{hand:[24,2,16,20,1],vs:null,effects:[],discard:[],x:[],attackBlocks:0},
 round:1,phase:'SET_VS',firstPlayer:P1,effectTurn:null,attackTurn:null,needsVS:[true,true],effectActionTaken:[false,false],pendingSelfDiscard:null,pendingBoardChoice:null,pendingChoice:null
})
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)}

{
 const s=base(); const a=beginnerBotCandidates(s,meta,P2)
 assert(a[0].action==='SET_VS','bot should set VS')
 assert(a[0].payload.cardId===2,'bot should prefer strongest beginner VS')
 assert(a[0].payload.position==='ATK','strong attacker should use ATK')
}
{
 const s=base(); s.needsVS=[false,false]; s.player1.vs={card:1,position:'ATK'}; s.player2.vs={card:24,position:'DEF'}; s.firstPlayer=P2
 const a=beginnerBotCandidates(s,meta,P2)
 assert(a[0].action==='BEGIN_ROUND','bot should begin round when it starts')
}
{
 const s=base(); s.phase='EFFECT'; s.needsVS=[false,false]; s.player2.vs={card:2,position:'ATK'}; s.effectTurn=P2
 const a=beginnerBotCandidates(s,meta,P2)
 assert(a[0].action==='PLAY_EFFECT' && a.at(-1).action==='END_EFFECT_TURN','bot should try simple effect then end turn fallback')
 assert(a[0].payload.cardId===1,'draw-one card should be preferred for beginner clarity')
}
{
 const s=base(); s.phase='ATTACK'; s.needsVS=[false,false]; s.player2.vs={card:2,position:'ATK'}; s.attackTurn=P2
 const a=beginnerBotCandidates(s,meta,P2)
 assert(a[0].action==='ATTACK','ATK-position bot should attack')
}
{
 const s=base(); s.phase='ATTACK'; s.needsVS=[false,false]; s.player2.vs={card:24,position:'DEF'}; s.attackTurn=P2
 const a=beginnerBotCandidates(s,meta,P2)
 assert(a[0].action==='PASS_ATTACK','DEF-position bot should pass')
}
{
 const s=base(); s.pendingBoardChoice={chooser:1,cardIds:[9,10]}
 const a=beginnerBotCandidates(s,meta,P2)
 assert(a[0].action==='RESOLVE_BOARD_CHOICE' && a[0].payload.cardId===9,'bot should resolve board choice predictably')
}
{
 const s=base(); s.pendingSelfDiscard={player:1,count:2};
 const a=beginnerBotCandidates(s,meta,P2)
 assert(a[0].action==='RESOLVE_SELF_DISCARD' && a[0].payload.cardIds.length===2,'bot should satisfy mandatory discard')
}
{
 const s=base(); s.phase='EFFECT'; s.needsVS=[false,false]; s.player2.vs={card:2,position:'ATK'}; s.effectTurn=P2
 const applied=[]
 const fakeApply=(state,actor,action)=>{
   applied.push(action.action + ':' + String(action.payload?.cardId ?? ''))
   if(action.action==='PLAY_EFFECT') throw new Error('EFFECT_CAPACITY_REACHED')
   if(action.action==='END_EFFECT_TURN') return {...state,effectTurn:P1}
   return state
 }
 const out=runBeginnerBotActions(s,meta,P2,fakeApply)
 assert(out.actions.length===1 && out.actions[0].action==='END_EFFECT_TURN','bot runner should fall back from illegal effects to end turn')
 assert(applied.some(x=>x.startsWith('PLAY_EFFECT')),'runner should probe a legal effect candidate first')
}
{
 const s=base(); s.pendingBoardChoice={chooser:1,cardIds:[9]}; s.needsVS=[false,false]
 const fakeApply=(state,actor,action)=>{
   if(action.action==='RESOLVE_BOARD_CHOICE') return {...state,pendingBoardChoice:null,phase:'ATTACK',attackTurn:P2,player2:{...state.player2,vs:{card:2,position:'ATK'}}}
   if(action.action==='ATTACK') return {...state,phase:'GAME_OVER',attackTurn:null}
   throw new Error('unexpected')
 }
 const out=runBeginnerBotActions(s,meta,P2,fakeApply)
 assert(out.actions.map(x=>x.action).join(',')==='RESOLVE_BOARD_CHOICE,ATTACK','bot runner should continue through its mandatory choice into its next legal action')
}

console.log('BEGINNER_BOT_REGRESSION_PASS')
