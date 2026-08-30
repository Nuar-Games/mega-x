import fs from 'node:fs'
const audio = fs.readFileSync('src/audio.ts','utf8')
const assets = fs.readFileSync('src/audio-assets.ts','utf8')
const vercel = JSON.parse(fs.readFileSync('vercel.json','utf8'))
const must = (ok, msg) => { if (!ok) throw new Error(msg) }
must(assets.includes("coinToss: '/audio/coin-toss/mega-x-coin-toss-v1.opus'"), 'coin toss asset path missing')
must(audio.includes("'coinToss'"), 'coin toss scene missing')
must(audio.includes('fadeOutMusic'), 'coin toss -> fight fade missing')
must(audio.includes("previous === 'coinToss' && next === 'match'"), 'fight transition fade gate missing')
must(audio.includes('COIN_TOSS_GAIN = 0.78'), 'coin toss loudness safety gain missing')
const coinCache = vercel.headers?.find((entry) => entry.source === '/audio/coin-toss/(.*)\\.opus')
must(Boolean(coinCache), 'coin toss immutable cache route missing')
must(coinCache.headers?.some((h) => h.key === 'Cache-Control' && h.value === 'public, max-age=31536000, immutable'), 'immutable cache policy missing')
console.log('PASS coin toss audio regression')
