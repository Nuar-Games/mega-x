import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')

for (const marker of [
  "import { startPracticeMatch, tickPracticeBot } from './practice-match'",
  "activeOnlineMatch?.id?.startsWith('practice-local:')",
  'const next = tickPracticeBot(onlineSession.userId, activeOnlineMatch.id)',
  '// mega-x:practice-bot-paced-turn',
]) {
  if (!app.includes(marker)) throw new Error(`missing Practice bot pacing hook: ${marker}`)
}

console.log('PASS Practice bot has a paced UI caller after human actions')
