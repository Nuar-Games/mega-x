import fs from 'node:fs'

const controller = fs.readFileSync('src/game/arena-next/live/ArenaLiveController.ts', 'utf8')

for (const marker of [
  'tickPracticeBot',
  'private practiceBotTimer=0',
  'this.schedulePracticeBot()',
  'tickPracticeBot(this.session.userId,this.match.id)',
]) {
  if (!controller.includes(marker)) throw new Error(`missing Arena Next Practice bot pacing: ${marker}`)
}

if (controller.includes("src/App.tsx")) throw new Error('Arena Next Practice bot pacing must not depend on generated App.tsx')

console.log('PASS Arena Next owns paced Practice bot progression')
