import fs from 'node:fs'

const source = fs.readFileSync('src/App.tsx', 'utf8')
const needles = [
  "onlineScreen === 'AUTH'",
  "onlineScreen === 'LOBBY'",
  "onlineScreen === 'LANDING'",
  "onlineScreen === 'HANDLE'",
  "setOnlineScreen('LOBBY')",
  "return (",
]
for (const needle of needles) {
  let from = 0
  let count = 0
  while (count < 12) {
    const index = source.indexOf(needle, from)
    if (index < 0) break
    const start = Math.max(0, index - 1000)
    const end = Math.min(source.length, index + 1800)
    console.log(`\n--- AUTH RENDER EXCERPT ${needle} #${count + 1} ---\n${source.slice(start, end)}\n--- END EXCERPT ---`)
    from = index + needle.length
    count += 1
  }
}
