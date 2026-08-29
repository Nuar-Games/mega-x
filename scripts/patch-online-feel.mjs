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
    "  const preMutationRectsRef = useRef<Map<number, RectSnapshot>>(new Map())",
    "  const preMutationRectsRef = useRef<Map<number, RectSnapshot>>(new Map())\n  const optimisticMotionIdsRef = useRef<Set<number>>(new Set())",
  ],
  [
    "    if (activeOnlineMatch) { if (player === localViewer) void dispatchOnlineAction('SET_VS', { cardId, position }); return }",
    `    if (activeOnlineMatch) {
      if (player === localViewer && !matchNetworkBusy) {
        snapshotVisibleCardRects()
        const card = game.players[player].hand.find((entry) => entry.id === cardId)
        if (card) {
          optimisticMotionIdsRef.current.add(cardId)
          setMotionQueue((queue) => [...queue, {
            card,
            from: \`p\${player + 1}-hand\`,
            to: \`p\${player + 1}-vs\`,
            kind: 'ENTER_VS',
            fromRect: readCardRect(cardId),
            toRect: readAnchorRect(\`p\${player + 1}-vs\`),
          }])
        }
        void dispatchOnlineAction('SET_VS', { cardId, position })
      }
      return
    }`,
  ],
  [
    "    if (activeOnlineMatch) { if (player === localViewer) void dispatchOnlineAction('PLAY_EFFECT', { cardId }); return }",
    `    if (activeOnlineMatch) {
      if (player === localViewer && !matchNetworkBusy) {
        snapshotVisibleCardRects()
        const card = game.players[player].hand.find((entry) => entry.id === cardId)
        if (card) {
          optimisticMotionIdsRef.current.add(cardId)
          setMotionQueue((queue) => [...queue, {
            card,
            from: \`p\${player + 1}-hand\`,
            to: \`p\${player + 1}-effect\`,
            kind: 'SUPPORT',
            fromRect: readCardRect(cardId),
            toRect: readAnchorRect(\`p\${player + 1}-effect\`),
          }])
        }
        void dispatchOnlineAction('PLAY_EFFECT', { cardId })
      }
      return
    }`,
  ],
  [
    "      events.push({\n        card,\n        from,\n        to,\n        kind,",
    "      if (optimisticMotionIdsRef.current.delete(id)) continue\n\n      events.push({\n        card,\n        from,\n        to,\n        kind,",
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
      if (player !== localViewer || impactFx || matchNetworkBusy) return
      const defender = other(player)
      snapshotVisibleCardRects()
      setImpactFx({ attacker: player, defender, stage: 'WINDUP' })
      void dispatchOnlineAttack()
      window.setTimeout(() => setImpactFx({ attacker: player, defender, stage: 'IMPACT' }), 180)
      window.setTimeout(() => setImpactFx({ attacker: player, defender, stage: 'RESOLVE' }), 430)
      window.setTimeout(() => setImpactFx(null), 820); return
    }
`,
  ],
]

for (const [from, to] of replacements) {
  if (!app.includes(from)) throw new Error(`online-feel patch target missing: ${String(from).slice(0, 100)}`)
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

const impactMarker = '/* Recovery stronger arena impact */'
if (!css.includes(impactMarker)) {
  css += `\n${impactMarker}\n.duel-shell .motion-card-fx{filter:drop-shadow(0 10px 18px rgba(0,0,0,.72))!important;z-index:160!important}.duel-shell .center-clash.is-combat.stage-impact{transform:translate(-50%,-50%) scale(1.16)!important;filter:brightness(1.35) drop-shadow(0 0 22px rgba(255,220,90,.85))!important}.duel-shell .combat-screen-fx.stage-impact{animation-duration:.34s!important}.duel-shell .fighter-field .v9-vs-card.is-hit.stage-impact{animation:mxImpactHit .34s cubic-bezier(.2,.9,.3,1)!important}@keyframes mxImpactHit{0%,100%{transform:translateX(0)}25%{transform:translateX(-10px) rotate(-1.5deg)}52%{transform:translateX(9px) rotate(1.2deg)}75%{transform:translateX(-4px)}}\n`
}

fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
console.log('Restored immediate online card motion, attack timing, impact, portrait hand scale, and offline portrait VS scale')
