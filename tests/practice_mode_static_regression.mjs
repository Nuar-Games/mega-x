import fs from 'node:fs'
import ts from 'typescript'
const source=fs.readFileSync('src/practice-mode.ts','utf8')
const css=fs.readFileSync('src/practice-mode.css','utf8')
const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true})
if(out.diagnostics?.some(d=>d.category===ts.DiagnosticCategory.Error)) throw new Error('practice-mode TS syntax diagnostics')
for(const text of ['applyEngineAction','runBeginnerBotActions','BEGINNER BOT','SET_VS','PLAY_EFFECT','ATTACK','PASS_ATTACK','RESOLVE_SELF_DISCARD','RESOLVE_BOARD_CHOICE','RESOLVE_HIDDEN_CHOICE']) if(!source.includes(text)) throw new Error(`missing ${text}`)
for(const text of ['[data-practice-root]','.mx-practice-entry','@media(max-width:650px)']) if(!css.includes(text)) throw new Error(`missing css ${text}`)
console.log('PRACTICE_MODE_STATIC_PASS')
