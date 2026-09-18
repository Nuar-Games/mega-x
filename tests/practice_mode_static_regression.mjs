import fs from 'node:fs'
import ts from 'typescript'
const source=fs.readFileSync('src/practice-mode.ts','utf8')
const css=fs.readFileSync('src/practice-mode.css','utf8')
const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true})
if(out.diagnostics?.some(d=>d.category===ts.DiagnosticCategory.Error)) throw new Error('practice-mode TS syntax diagnostics')
// "run Beginner Bot as a real Arena match" (same day as this test's authoring
// commit, a few hours later) split the engine-driving logic out of
// practice-mode.ts into beginner-bot.ts and practice-match.ts. Check the
// combined output of where the logic actually lives now.
const engineSource=fs.readFileSync('src/beginner-bot.ts','utf8')+fs.readFileSync('src/practice-match.ts','utf8')
for(const text of ['applyEngineAction','runBeginnerBotActions','BEGINNER BOT','SET_VS','PLAY_EFFECT','ATTACK','PASS_ATTACK','RESOLVE_SELF_DISCARD','RESOLVE_BOARD_CHOICE','RESOLVE_HIDDEN_CHOICE']) if(!engineSource.includes(text)) throw new Error(`missing ${text}`)
// The same refactor replaced the [data-practice-root]/media-query isolation
// with JS-driven sibling hiding (isolateArenaBranch) plus a universal
// (viewport-unit based, no breakpoint needed) fullscreen duel-shell rule.
for(const text of ['.mx-practice-entry','.mx-practice-active','100dvh']) if(!css.includes(text)) throw new Error(`missing css ${text}`)
if(!source.includes('isolateArenaBranch')) throw new Error('missing isolateArenaBranch')
console.log('PRACTICE_MODE_STATIC_PASS')
