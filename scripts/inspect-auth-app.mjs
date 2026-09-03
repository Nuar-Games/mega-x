import fs from 'node:fs'

const source = fs.readFileSync('src/App.tsx', 'utf8')
const needles = ['signInWithEmail', 'setOnlineSession', 'getSavedSession', 'onlineSession', 'loadProfile']
for (const needle of needles) {
  let from = 0
  let count = 0
  while (count < 8) {
    const index = source.indexOf(needle, from)
    if (index < 0) break
    const start = Math.max(0, index - 700)
    const end = Math.min(source.length, index + 1200)
    console.log(`\n--- AUTH APP EXCERPT ${needle} #${count + 1} ---\n${source.slice(start, end)}\n--- END EXCERPT ---`)
    from = index + needle.length
    count += 1
  }
}
