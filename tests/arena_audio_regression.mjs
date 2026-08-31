import fs from 'node:fs'
const audio = fs.readFileSync('src/audio.ts','utf8')
const assets = fs.readFileSync('src/audio-assets.ts','utf8')
const vercelText = fs.readFileSync('vercel.json','utf8')
const vercel = JSON.parse(vercelText)
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(assets.includes("'/audio/arena/arena-c2-v1.opus'"), 'arena C2 asset missing')
must(assets.includes("'/audio/arena/arena-c3-v1.opus'"), 'arena C3 asset missing')
must(assets.includes('ARENA_TRACKS'), 'extensible arena track pool missing')
must(audio.includes('ARENA_GAIN = 0.58'), 'arena background gain missing')
must(audio.includes('pickArenaTrack'), 'one-track-per-match selector missing')
must(audio.includes('audio.loop = true'), 'selected arena track must loop')
must(audio.includes('ARENA_BAG_KEY'), 'non-repeating arena shuffle bag missing')
must(audio.includes('fadeInMusic'), 'arena fade-in missing')
must(audio.includes('duckArenaMusic'), 'arena ducking missing')
must(audio.includes('SFX_DUCK_GAIN = 0.7'), 'combat SFX duck target missing')

must(assets.includes("export const LOBBY_TRACK = '/audio/replacements/lobby.opus'"), 'single replacement lobby track missing')
must(!assets.includes('soft-lights-v1.opus'), 'old soft-lights lobby track must be removed')
must(!assets.includes('high-clouds-v1.opus'), 'old high-clouds lobby track must be removed')
must(!assets.includes('wishing-star-v1.opus'), 'old wishing-star lobby track must be removed')
must(!audio.includes('playLobbyTrack'), 'old lobby playlist rotation must be removed')
must(!audio.includes('preloadNextLobbyTrack'), 'old lobby playlist preload must be removed')
must(audio.includes('new Audio(LOBBY_TRACK)'), 'lobby must use only replacement track')
must(audio.includes("scene === 'lobby'"), 'lobby scene routing missing')

for (const name of ['card-selected','card-draw','effect-enter-field','card-attacking','card-destroyed','card-goes-to-zon-x','prompt-needed','arena-appear','fight','player-win']) {
  must(assets.includes(`/audio/replacements/${name}.opus`), `replacement audio missing: ${name}`)
}
must(audio.includes('SFX_BASE_GAIN = 0.64'), 'normalized SFX playback gain missing')
must(audio.includes("playSfx('zonX')"), 'Zon X SFX trigger missing')
must(audio.includes("playSfx('prompt')"), 'prompt SFX trigger missing')
must(audio.includes("playSfx('arenaAppear')"), 'arena appearance SFX trigger missing')
must(audio.includes("playSfx('fight')"), 'replacement fight SFX trigger missing')
must(audio.includes("playSfx('win')"), 'replacement win SFX trigger missing')

must(!assets.includes('VOICE_ASSETS'), 'legacy announcer asset map must stay removed')
must(!assets.includes('MegaXVoice'), 'legacy announcer type must stay removed')
must(!audio.includes('playVoice'), 'legacy announcer playback must stay removed')
must(!audio.includes('voicePool'), 'legacy announcer pool must stay removed')
must(!audio.includes('VOICE_DUCK_GAIN'), 'legacy announcer ducking must stay removed')
must(!audio.includes('data-audio-voice'), 'legacy VOICE slider must stay removed')

const arenaHeader = (vercel.headers ?? []).find((entry) => String(entry.source ?? '').startsWith('/audio/arena/'))
must(Boolean(arenaHeader), 'arena immutable cache route missing')
must(JSON.stringify(arenaHeader).includes('max-age=31536000, immutable'), 'arena immutable cache policy missing')
console.log('PASS arena audio regression')
