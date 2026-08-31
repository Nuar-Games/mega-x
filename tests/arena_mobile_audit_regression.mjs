import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
const audio = fs.readFileSync('src/audio.ts','utf8')
const assets = fs.readFileSync('src/audio-assets.ts','utf8')
const css = fs.readFileSync('src/V24.css','utf8') + '\n' + fs.readFileSync('src/Online.css','utf8')
const stage = fs.readFileSync('src/arena-stage.css','utf8')
const action = fs.readFileSync('src/arena-action.css','utf8')
const auditPatch = fs.readFileSync('scripts/patch-arena-mobile-audit.mjs','utf8')
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'))
const must = (ok,msg) => { if (!ok) throw new Error(msg) }

must(pkg.scripts.build.includes('patch-production-jank-hotfix.mjs'), 'production jank hotfix is not in the build chain')
must(!pkg.scripts.build.includes('patch-arena-responsive-system.mjs'), 'obsolete unified responsive Arena remains in build chain')
must(stage.includes('authoritative portrait blueprint 780 x 1110'), 'portrait coordinate Arena is not authoritative')
must(action.includes('visual feedback only. Never owns geometry'), 'motion layer is not geometry-isolated')

const requiredAssets = [
  "card: '/audio/replacements/card-selected.opus'",
  "draw: '/audio/replacements/card-draw.opus'",
  "enter: '/audio/replacements/effect-enter-field.opus'",
  "attack: '/audio/replacements/card-attacking.opus'",
  "destroy: '/audio/replacements/card-destroyed.opus'",
  "zonX: '/audio/replacements/card-goes-to-zon-x.opus'",
  "prompt: '/audio/replacements/prompt-needed.opus'",
  "arenaAppear: '/audio/replacements/arena-appear.opus'",
  "fight: '/audio/replacements/fight.opus'",
  "win: '/audio/replacements/player-win.opus'",
]
for (const asset of requiredAssets) must(assets.includes(asset), `replacement audio asset missing: ${asset}`)
must(assets.includes("export const LOBBY_TRACK = '/audio/replacements/lobby.opus'"), 'replacement lobby track missing')
must(!assets.includes('VOICE_ASSETS'), 'legacy announcer asset map remains')
must(!assets.includes('MegaXVoice'), 'legacy announcer type remains')

must(app.includes("new CustomEvent('mega-x:motion'"), 'motion state does not dispatch gameplay audio events')
must(audio.includes('private onMotionSfx'), 'state-driven motion SFX handler is missing')
must(audio.includes("kind === 'DRAW'"), 'draw event is not wired from motion state')
must(audio.includes("kind === 'ENTER_VS' || kind === 'SUPPORT'"), 'entry event is not wired from motion state')
must(audio.includes("kind === 'DESTROY'"), 'destroy event is not wired from motion state')
must(audio.includes("kind === 'CAPTURE'"), 'Zon X capture event is not wired from motion state')
must(audio.includes('private playArenaEventSfx'), 'Arena impact SFX helper is missing')
must(audio.includes("element.matches('.combat-screen-fx.stage-impact')) kind = 'attack'"), 'attack impact SFX trigger is missing')
must(audio.includes("this.playSfx('fight')"), 'fight replacement SFX trigger is missing')
must(audio.includes("this.playSfx('win')"), 'win replacement SFX trigger is missing')
must(audio.includes('SFX_BASE_GAIN = 0.64'), 'replacement SFX base gain is missing')
must(audio.includes('attack: 0.86'), 'attack SFX gain is not configured')
must(audio.includes('destroy: 0.82'), 'destroy SFX gain is not configured')
must(!audio.includes('playVoice'), 'legacy announcer playback remains')
must(!audio.includes('voicePool'), 'legacy announcer pool remains')

must(!assets.includes('sfx-select.ogg'), 'legacy card selection sound reference remains')
must(!assets.includes('sfx-card-draw.ogg'), 'legacy draw sound reference remains')
must(!assets.includes('sfx-card-play.ogg'), 'legacy card play sound reference remains')

must(!css.includes('.mega-coin{will-change:transform!important;contain:layout paint style!important;transform:translateZ(0)}'), 'mobile transform override still kills the coin keyframes')
must(css.includes('/* Production coin hotfix */'), 'coin waiting-title mobile hotfix missing')
must(css.includes('/* Arena interaction audit pass */'), 'Arena interaction audit CSS missing')
must(!auditPatch.includes('transform:scale(.72)'), 'interaction patch still owns phone HUD geometry')
must(!auditPatch.includes('.duel-shell .battlefield{top:72px'), 'interaction patch still owns battlefield geometry')
must(app.includes('CONFIRM DISCARD'), 'Spudur discard confirmation UI missing')
must(app.includes('selectedDiscardIds'), 'Spudur discard selection state missing')
must(app.includes("pending.mode === 'EXACT' && selectedDiscardIds.length !== pending.count"), 'discard count is not validated before online confirmation')
console.log('PASS Arena audit: portrait coordinate geometry, isolated motion, replacement SFX and Spudur confirmation')
