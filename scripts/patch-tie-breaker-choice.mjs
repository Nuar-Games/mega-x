import fs from 'node:fs'

const appPath='src/App.tsx'
const cssPath='src/arena-stage.css'
let app=fs.readFileSync(appPath,'utf8')
let css=fs.readFileSync(cssPath,'utf8')

const onlineNeedle="if (!activeOnlineMatch || !onlineSession || game.phase !== 'TIE_BREAKER' || localViewer !== 0 || matchNetworkBusy) return"
const onlineAt=app.indexOf(onlineNeedle)
if(onlineAt<0) throw new Error('online tie-breaker auto-reveal hook missing')
const onlineStart=app.lastIndexOf('  useEffect(() => {',onlineAt)
const onlineEndNeedle="  }, [activeOnlineMatch?.id, activeOnlineMatch?.state_version, game.phase, game.tieBreaker?.status, localViewer])"
const onlineEndAt=app.indexOf(onlineEndNeedle,onlineAt)
if(onlineStart<0||onlineEndAt<0) throw new Error('online tie-breaker effect bounds missing')
const onlineEnd=onlineEndAt+onlineEndNeedle.length
const chooseFn=`  async function chooseTieBreakerCard(cardId: number) {
    if (!activeOnlineMatch || !onlineSession || game.phase !== 'TIE_BREAKER' || matchNetworkBusyRef.current) return
    const tieChoice = activeOnlineMatch.state?.tieChoice
    if (!tieChoice || tieChoice.picked || !Array.isArray(tieChoice.hand) || !tieChoice.hand.map(Number).includes(cardId)) return
    matchNetworkBusyRef.current = true
    setMatchNetworkBusy(true)
    try {
      const result = await submitMatchSpecialAction(onlineSession, activeOnlineMatch.id, activeOnlineMatch.state_version, 'TIE_PICK', { cardId })
      applyOnlineMatchView({ ...activeOnlineMatch, state: result.state, state_version: Number(result.state_version), phase: result.phase, status: result.status })
      setOnlineMessage('')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'TIE BREAKER FAILED'
      setOnlineMessage(message.replaceAll('_',' '))
      if (message.includes('STALE_MATCH_STATE')) await refreshActiveMatch().catch(() => undefined)
    } finally {
      matchNetworkBusyRef.current = false
      setMatchNetworkBusy(false)
    }
  }`
app=app.slice(0,onlineStart)+chooseFn+app.slice(onlineEnd)

const stageStartNeedle="            {game.phase === 'TIE_BREAKER' && game.tieBreaker && ("
const stageStart=app.indexOf(stageStartNeedle)
const gameOverNeedle="            {game.phase === 'GAME_OVER' && ("
const gameOverAt=app.indexOf(gameOverNeedle,stageStart)
if(stageStart<0||gameOverAt<0) throw new Error('tie-breaker stage bounds missing')
const stage=`            {game.phase === 'TIE_BREAKER' && game.tieBreaker && (
              <div className="tie-breaker-stage tie-breaker-choice-stage" role="status" aria-live="polite">
                <div className="tie-breaker-stage-energy" aria-hidden="true" />
                <div className="tie-breaker-stage-title">PENENTUAN SERI</div>
                {activeOnlineMatch ? (() => {
                  const tieChoice = activeOnlineMatch.state?.tieChoice as { hand?: number[]; picked?: boolean; opponentPicked?: boolean; pair?: number } | undefined
                  const tiePublic = activeOnlineMatch.state?.tiePublic as { left?: number; right?: number; pair?: number; status?: string } | undefined
                  const hand = Array.isArray(tieChoice?.hand) ? tieChoice!.hand!.map(Number) : []
                  const locked = Boolean(tieChoice?.picked)
                  return <>
                    {tiePublic?.left && tiePublic?.right && <div className="tie-breaker-last-reveal">
                      <div><CardView card={cardById(Number(tiePublic.left))}/><strong>ATK {cardById(Number(tiePublic.left)).atk}</strong></div>
                      <b>{tiePublic.status === 'TIED' ? 'SERI' : 'VS'}</b>
                      <div><CardView card={cardById(Number(tiePublic.right))}/><strong>ATK {cardById(Number(tiePublic.right)).atk}</strong></div>
                    </div>}
                    <div className="tie-breaker-choice-copy">
                      <strong>PILIH 1 KAD ANDA</strong>
                      <span>PUSINGAN PENENTUAN {Number(tieChoice?.pair ?? 1)}</span>
                      <em>{locked ? (tieChoice?.opponentPicked ? 'KEDUA-DUA KAD DIKUNCI — MEMBUKA…' : 'KAD ANDA DIKUNCI · MENUNGGU LAWAN') : 'LAWAN TIDAK DAPAT MELIHAT PILIHAN ANDA'}</em>
                    </div>
                    <div className="tie-breaker-choice-hand">
                      {hand.map((id) => <button key={id} type="button" disabled={locked || matchNetworkBusy} onClick={() => { void chooseTieBreakerCard(id) }} aria-label={\`Pilih \${cardById(id).name}\`}><CardView card={cardById(id)}/><span>ATK {cardById(id).atk}</span></button>)}
                    </div>
                    {hand.length === 0 && <div className="tie-breaker-choice-wait">MENYEDIAKAN 5 KAD PENENTUAN…</div>}
                  </>
                })() : <>
                  <div className="tie-breaker-pair" key={\`tie-pair-\${game.tieBreaker.pair}-\${game.tieBreaker.index}\`}>
                    <div className="tie-breaker-card tie-breaker-card-left"><span>X Fighter 1</span>{game.tieBreaker.left ? <CardView card={game.tieBreaker.left} /> : <div className="tie-breaker-card-back"><img src="/cards/back-game.webp" alt="" /></div>}{game.tieBreaker.left && <strong>ATK {game.tieBreaker.left.atk}</strong>}</div>
                    <div className="tie-breaker-vs">VS</div>
                    <div className="tie-breaker-card tie-breaker-card-right"><span>X Fighter 2</span>{game.tieBreaker.right ? <CardView card={game.tieBreaker.right} /> : <div className="tie-breaker-card-back"><img src="/cards/back-game.webp" alt="" /></div>}{game.tieBreaker.right && <strong>ATK {game.tieBreaker.right.atk}</strong>}</div>
                  </div>
                  {game.tieBreaker.status === 'TIED' && <div className="tie-breaker-tied">SERI</div>}
                </>}
              </div>
            )}
`
app=app.slice(0,stageStart)+stage+app.slice(gameOverAt)

if(app.includes("'TIE_REVEAL'")) throw new Error('legacy online TIE_REVEAL survived')
if(!app.includes("'TIE_PICK'")) throw new Error('TIE_PICK action missing')
if(!app.includes('activeOnlineMatch.state?.tieChoice')) throw new Error('viewer-private tieChoice UI missing')

const marker='/* Player-selected tie breaker */'
if(!css.includes(marker)) css+=`\n${marker}\n.tie-breaker-choice-stage{padding:clamp(14px,2.2vw,28px)!important}.tie-breaker-choice-copy{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;gap:4px;margin:8px auto 14px;text-align:center}.tie-breaker-choice-copy strong{font:1000 clamp(22px,4vw,46px)/1 Barlow Condensed,Impact,sans-serif;letter-spacing:.05em;color:#fff}.tie-breaker-choice-copy span{font:900 12px/1.1 Oxanium,sans-serif;color:#ffd95d;letter-spacing:.12em}.tie-breaker-choice-copy em{font:800 11px/1.2 Oxanium,sans-serif;font-style:normal;color:#b9c6d8}.tie-breaker-choice-hand{position:relative;z-index:4;display:flex;justify-content:center;align-items:end;gap:clamp(5px,1vw,12px);width:min(96vw,860px);margin:0 auto}.tie-breaker-choice-hand button{appearance:none;border:1px solid rgba(255,220,92,.5);border-radius:8px;background:rgba(5,8,15,.88);padding:5px;cursor:pointer;transition:transform .14s ease,filter .14s ease,box-shadow .14s ease;width:clamp(72px,14vw,138px);box-shadow:0 10px 24px rgba(0,0,0,.55)}.tie-breaker-choice-hand button:hover:not(:disabled),.tie-breaker-choice-hand button:focus-visible:not(:disabled){transform:translateY(-9px) scale(1.035);filter:brightness(1.13);box-shadow:0 0 28px rgba(255,204,45,.52)}.tie-breaker-choice-hand button:disabled{cursor:default;opacity:.72}.tie-breaker-choice-hand .digital-card{width:100%!important;height:auto!important}.tie-breaker-choice-hand button>span{display:block;margin-top:4px;font:1000 12px/1 Oxanium,sans-serif;color:#ffe070}.tie-breaker-last-reveal{position:relative;z-index:3;display:flex;justify-content:center;align-items:center;gap:14px;margin:4px auto 8px}.tie-breaker-last-reveal>div{display:flex;align-items:center;gap:5px;width:72px}.tie-breaker-last-reveal .digital-card{width:46px!important;height:auto!important}.tie-breaker-last-reveal strong{font:900 9px/1 Oxanium,sans-serif;color:#fff}.tie-breaker-last-reveal>b{font:1000 17px/1 Barlow Condensed,Impact,sans-serif;color:#ffcf42}.tie-breaker-choice-wait{position:relative;z-index:3;text-align:center;color:#fff;font:900 15px/1.2 Oxanium,sans-serif;letter-spacing:.08em}@media(max-width:560px){.tie-breaker-choice-hand{gap:3px}.tie-breaker-choice-hand button{width:18.2vw;padding:3px}.tie-breaker-choice-copy{margin-bottom:8px}.tie-breaker-choice-copy strong{font-size:25px}.tie-breaker-choice-copy em{font-size:9px}}\n`

fs.writeFileSync(appPath,app)
fs.writeFileSync(cssPath,css)
console.log('Patched tie breaker: five private cards, local player chooses one, simultaneous reveal after both lock')
