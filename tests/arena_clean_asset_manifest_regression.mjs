import fs from 'node:fs'

const source = fs.readFileSync('src/game/arena/ArenaAssets.ts', 'utf8')
const theme = fs.readFileSync('src/game/arena/arena-theme.ts', 'utf8')
const scene = fs.readFileSync('src/game/arena/ArenaScene.ts', 'utf8')
const must = (ok, message) => { if (!ok) throw new Error(message) }

must(source.includes('Array.from({ length: 30 }'), 'Clean arena must expose all 30 gameplay cards')
must(source.includes("'/cards/back-game.webp'") && source.includes("'/cards/back-inspect.webp'"), 'Both Mega X card backs must be mapped')
must(source.includes("'/ui/landing/logo.avif'") && source.includes("'/ui/landing/main-background.webp'"), 'Mega X logo/background must be mapped')
must(source.includes("'/ui/vs-blue.webp'") && source.includes("'/ui/vs-red.webp'") && source.includes("'/ui/vs.webp'"), 'Mega X VS artwork must be mapped')
for (const audio of ['card-draw','card-selected','card-enter-vs','card-attacking','card-destroyed','card-goes-to-zon-x','effect-enter-field','prompt-needed','win-lose-screen']) {
  must(source.includes(audio), `Missing arena audio mapping: ${audio}`)
}

const paths=[...source.matchAll(/'\/ui\/arena\/v3\/([^']+\.svg)'/g)].map(match=>match[1])
must(paths.length>=20,'Reference arena requires a substantial v3 UI asset pack')
for(const asset of paths){
  const file=`public/ui/arena/v3/${asset}`
  must(fs.existsSync(file),`Arena UI asset file missing ${asset}`)
  const svg=fs.readFileSync(file,'utf8')
  must(svg.includes('<svg'),`${asset} must be SVG`)
  must(!svg.includes('<rect width="100%" height="100%"'),`${asset} must remain an isolated transparent asset`)
}

must(source.includes('cardGameUrl') && source.includes('cardInspectUrl'), 'Gameplay and inspection card helpers are required')
must(theme.includes('player: 0x2f8cff') && theme.includes('opponent: 0xff3b4f'), 'Player/opponent identity colors are required')
must(theme.includes('decisive: 0xd7b35a'), 'Gold must be reserved as the decisive accent')
must(scene.includes('fieldBlue') && scene.includes('fieldRed'), 'Live arena must render authored battlefield frames')
must(scene.includes('deckFixture') && scene.includes('discardFixture') && scene.includes('zonXFixture'), 'Live arena must render deck/discard/Zon X hardware')

console.log('PASS clean Mega X arena v3 asset manifest')
