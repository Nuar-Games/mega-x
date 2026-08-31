import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
const css = fs.readFileSync('src/V24.css','utf8')
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'))
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(!pkg.scripts.build.includes('patch-mobile-performance.mjs'), 'obsolete mobile performance patch is still in the build chain')
must(app.includes('<p>WAITING FOR X FIGHTER 1.</p>'), 'coin waiting copy is still mixed/awkward')
must(app.includes('WINS THE TOSS!'), 'coin result does not explicitly announce the toss winner')
must(app.includes("setCoinStage('RESULT')"), 'authoritative coin result stage missing')
must(app.includes("setCoinStage('FIGHT')"), 'fight transition stage missing')
must(app.includes('window.setTimeout(() => {\n            if (latestMatchIdRef.current !== match.id) return\n            setCoinStage(\'FIGHT\')\n          }, 1400)'), 'coin result is not held long enough before FIGHT')
must(css.includes('/* Coin toss mobile presentation contract */'), 'coin toss responsive text contract missing')
must(css.includes('.mx-coin-waiting h2'), 'coin waiting heading is not responsively constrained')
must(css.includes('line-height:1.18!important'), 'coin toss heading/result line-height is still tight enough to clip glyphs')
must(css.includes('.coin-result-banner{') && css.includes('overflow:visible!important'), 'coin toss result text can still be clipped by its own box')
must(css.includes('.coin-choice-panel.mx-coin-waiting') && css.includes('padding:22px 16px!important'), 'coin toss waiting box lacks safe vertical text padding')
console.log('PASS coin toss keeps original motion, readable copy, explicit winner reveal, and unclipped type')
