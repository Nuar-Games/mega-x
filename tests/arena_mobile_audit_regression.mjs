import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
const audio = fs.readFileSync('src/audio.ts','utf8')
const assets = fs.readFileSync('src/audio-assets.ts','utf8')
const css = fs.readFileSync('src/V24.css','utf8') + '\n' + fs.readFileSync('src/Online.css','utf8')
const stage = fs.readFileSync('src/arena-stage.css','utf8')
const fragment = fs.readFileSync('src/arena-blueprint.fragment','utf8')
const auditPatch = fs.readFileSync('scripts/patch-arena-mobile-audit.mjs','utf8')
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'))
const must = (ok,msg) => { if (!ok) throw new Error(msg) }

must(pkg.scripts.build.includes('patch-production-jank-hotfix.mjs'), 'production motion/audio hotfix is not in build chain')
must(!pkg.scripts.build.includes('patch-single-fight.mjs'), 'obsolete FIGHT announcer patch remains')
must(stage.includes('MEGA-X ARENA 2'), 'Arena 2 stage is not authoritative')
must(fragment.includes('mx2-arena') && fragment.includes('mx2-local-hand'), 'Arena 2 fragment missing')

const requiredAssets = [
  "card: '/audio/replacements/card-selected.opus'",
  "draw: '/audio/replacements/card-draw.opus'",
  "enter: '/audio/replacements/effect-enter-field.opus'",
  "attack: '/audio/replacements/card-attacking.opus'",
  "destroy: '/audio/replacements/card-destroyed.opus'",
  "zonX: '/audio/replacements/card-goes-to-zon-x.opus'",
  "prompt: '/audio/replacements/prompt-needed.opus'",
  "arenaAppear: '/audio/replacements/arena-appear.opus'",
  "win: '/audio/replacements/player-win.opus'",
]
for (const asset of requiredAssets) must(assets.includes(asset), `replacement audio asset missing: ${asset}`)
must(!assets.includes('fight.opus'), 'FIGHT announcer asset mapping remains')
must(assets.includes("export const LOBBY_TRACK = '/audio/replacements/lobby.opus'"), 'replacement lobby track missing')
must(!assets.includes('VOICE_ASSETS'), 'legacy announcer asset map remains')

must(app.includes("new CustomEvent('mega-x:motion'"), 'motion state does not dispatch gameplay audio events')
must(audio.includes('private onMotionSfx'), 'state-driven motion SFX handler is missing')
must(audio.includes("kind === 'DRAW'"), 'draw event is not wired')
must(audio.includes("kind === 'ENTER_VS' || kind === 'SUPPORT'"), 'entry event is not wired')
must(audio.includes("kind === 'DESTROY'"), 'destroy event is not wired')
must(audio.includes("kind === 'CAPTURE'"), 'Zon X capture event is not wired')
must(audio.includes("label.includes('ATTACK') || label === 'SERANG'"), 'attack click SFX trigger is missing')
must(!audio.includes("playSfx('fight')"), 'FIGHT announcer playback remains')
must(audio.includes("this.playSfx('win')"), 'win replacement SFX trigger is missing')
must(audio.includes('SFX_BASE_GAIN = 0.64'), 'replacement SFX base gain is missing')
must(!audio.includes('playVoice'), 'legacy announcer playback remains')

must(!css.includes('.mega-coin{will-change:transform!important;contain:layout paint style!important;transform:translateZ(0)}'), 'mobile transform override still kills coin keyframes')
must(css.includes('/* Production coin hotfix */'), 'coin waiting-title mobile hotfix missing')
must(css.includes('/* Arena interaction audit pass */'), 'discard interaction audit CSS missing')
must(!auditPatch.includes('playArenaEventSfx'), 'audit patch still owns legacy Arena audio presentation detection')
must(app.includes('CONFIRM DISCARD'), 'Spudur discard confirmation UI missing')
must(app.includes('selectedDiscardIds'), 'Spudur discard selection state missing')
console.log('PASS Arena 2 audit: total new presentation, replacement SFX, no FIGHT announcer, Spudur confirmation intact')
