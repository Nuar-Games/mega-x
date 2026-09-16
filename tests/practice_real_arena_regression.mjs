import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const auth = fs.readFileSync('src/onlineAuth.ts', 'utf8')
const vs = fs.readFileSync('src/VsIntro.tsx', 'utf8')
const entry = fs.readFileSync('src/practice-mode.ts', 'utf8')
const css = fs.readFileSync('src/practice-mode.css', 'utf8')
const runtime = fs.readFileSync('src/practice-match.ts', 'utf8')
const must = (ok, message) => { if (!ok) throw new Error(message) }

must(entry.includes("mega-x:start-practice-match"), 'practice button must start the real-Arena practice match')
must(!entry.includes('renderPractice') && !entry.includes('PANDUAN'), 'separate tutorial renderer must be gone')
must(!css.includes('[data-practice-root]') && !css.includes('.mx-practice-shell'), 'separate practice screen CSS must be gone')
const entersArena = app.includes('applyOnlineMatchView(match as any)') || app.includes('applyOnlineMatchView(match as any, practiceSession)')
must(app.includes("from './practice-match'") && app.includes("mega-x:start-practice-match") && entersArena, 'practice must enter the existing ActiveOnlineMatch -> Arena rendering path')
must(runtime.includes("from '../supabase/functions/match-action/engine.ts'") && runtime.includes('runBeginnerBotActions'), 'practice must use the authoritative engine and Beginner Bot')
must(auth.includes('isPracticeMatchId(matchId)') && auth.includes('submitPracticeAction') && auth.includes('submitPracticeSpecialAction'), 'practice actions must route locally instead of Supabase')
must(vs.includes('getPracticeMatchForUser(session.userId)'), 'active-match refresh must preserve a local practice match')
must(!runtime.includes('tutorial') && !runtime.includes('PANDUAN'), 'practice runtime must not contain tutorial flow')

console.log('PASS practice mode uses the real Arena as a regular unranked match against Beginner Bot')
