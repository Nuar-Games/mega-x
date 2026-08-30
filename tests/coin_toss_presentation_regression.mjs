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
console.log('PASS coin toss keeps original motion, readable copy, and explicit winner reveal')
