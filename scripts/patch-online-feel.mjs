import fs from 'node:fs'

const appPath = 'src/App.tsx'
const cssPath = 'src/V24.css'
let app = fs.readFileSync(appPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')

const replacements = [
  [
    "      previousGameRef.current = nextGame\n      setGame(nextGame)",
    "      setGame(nextGame)",
  ],
  [
    "    if (activeOnlineMatch) { if (player === localViewer) void dispatchOnlineAction('SET_VS', { cardId, position }); return }",
    "    if (activeOnlineMatch) { if (player === localViewer) { snapshotVisibleCardRects(); void dispatchOnlineAction('SET_VS', { cardId, position }); } return }",
  ],
  [
    "    if (activeOnlineMatch) { if (player === localViewer) void dispatchOnlineAction('PLAY_EFFECT', { cardId }); return }",
    "    if (activeOnlineMatch) { if (player === localViewer) { snapshotVisibleCardRects(); void dispatchOnlineAction('PLAY_EFFECT', { cardId }); } return }",
  ],
  [
`    if (activeOnlineMatch) {
      if (player !== localViewer || impactFx) return
      const defender = other(player); setImpactFx({ attacker: player, defender, stage: 'WINDUP' })
      window.setTimeout(() => setImpactFx({ attacker: player, defender, stage: 'IMPACT' }), 300)
      window.setTimeout(() => { void dispatchOnlineAttack(); setImpactFx({ attacker: player, defender, stage: 'RESOLVE' }) }, 650)
      window.setTimeout(() => setImpactFx(null), 1250); return
    }
`,
`    if (activeOnlineMatch) {
      if (player !== localViewer || impactFx) return
      const defender = other(player)
      snapshotVisibleCardRects()
      setImpactFx({ attacker: player, defender, stage: 'WINDUP' })
      void dispatchOnlineAttack()
      window.setTimeout(() => setImpactFx({ attacker: player, defender, stage: 'IMPACT' }), 220)
      window.setTimeout(() => setImpactFx({ attacker: player, defender, stage: 'RESOLVE' }), 520)
      window.setTimeout(() => setImpactFx(null), 980); return
    }
`,
  ],
]

for (const [from, to] of replacements) {
  if (!app.includes(from)) throw new Error(`online-feel patch target missing: ${from.slice(0, 80)}`)
  app = app.replace(from, to)
}

const marker = '/* Recovery online-feel portrait scale */'
if (!css.includes(marker)) {
  css += `\n${marker}\n@media (max-width:520px) and (orientation:portrait){\n  .duel-shell{--mx-hand:178px!important}\n  .duel-shell .player-hand:not(.opponent-hand){height:178px!important;min-height:178px!important;max-height:178px!important}\n  .duel-shell .player-hand:not(.opponent-hand) .hand-card-wrap{height:154px!important;max-height:154px!important;margin-left:-34px!important}\n}\n`
}

const vsMarker = '/* Recovery offline portrait VS scale */'
if (!css.includes(vsMarker)) {
  css += `\n${vsMarker}\n@media (max-width:520px) and (orientation:portrait){\n  .duel-shell .fighter-field{top:5%!important;bottom:31%!important;width:48%!important}\n  .duel-shell .fighter-field-left{left:1%!important}.duel-shell .fighter-field-right{right:1%!important}\n  .duel-shell .vs-battle-row{grid-template-columns:56px minmax(0,1fr)!important;gap:2px!important}\n  .duel-shell .vs-battle-row.reverse{grid-template-columns:minmax(0,1fr) 56px!important}\n  .duel-shell .live-stats{min-width:52px!important;max-width:56px!important}\n  .duel-shell .vs-inspect-button,.duel-shell .v9-vs-card .vs-zone>.card-back{height:min(28dvh,230px)!important;max-height:230px!important}\n}\n`
}

fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
console.log('Restored online responsiveness, card motion diff, attack timing, portrait hand scale, and offline portrait VS scale')
