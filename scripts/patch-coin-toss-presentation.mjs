import fs from 'node:fs'

const appPath='src/App.tsx'
const cssPath='src/V24.css'
let app=fs.readFileSync(appPath,'utf8')
let css=fs.readFileSync(cssPath,'utf8')

const oldTransition=`      if (enteringArenaFromCoin) {
        setCoinFace(coinResult)
        setCoinStage('FIGHT')
        setOnlineScreen('GAME')
        if (coinArenaTransitionRef.current !== match.id) {
          coinArenaTransitionRef.current = match.id
          window.setTimeout(() => {
            if (latestMatchIdRef.current !== match.id) return
            setStarted(true)
            setCoinStage('CHOOSE')
          }, 900)
        }
        return
      }`
const newTransition=`      if (enteringArenaFromCoin) {
        setCoinFace(coinResult)
        setOnlineScreen('GAME')
        if (coinArenaTransitionRef.current !== match.id) {
          coinArenaTransitionRef.current = match.id
          setCoinStage('RESULT')
          window.setTimeout(() => {
            if (latestMatchIdRef.current !== match.id) return
            setCoinStage('FIGHT')
          }, 1400)
          window.setTimeout(() => {
            if (latestMatchIdRef.current !== match.id) return
            setStarted(true)
            setCoinStage('CHOOSE')
          }, 2300)
        }
        return
      }`
if(!app.includes(oldTransition)) throw new Error('coin ACTIVE transition block missing')
app=app.replace(oldTransition,newTransition)

const oldWait=`<p>WAITING FOR X ATAU KOSONG.</p>`
if(!app.includes(oldWait)) throw new Error('coin waiting copy missing')
app=app.replace(oldWait,`<p>WAITING FOR X FIGHTER 1.</p>`)

const oldBanner=`<div className="coin-result-banner">{playerLabel(coinResultStarter).toUpperCase()} START!</div>`
if(!app.includes(oldBanner)) throw new Error('coin result banner missing')
app=app.replace(oldBanner,`<div className="coin-result-banner">{playerLabel(coinResultStarter).toUpperCase()} WINS THE TOSS!</div>`)

const marker='/* Coin toss mobile presentation contract */'
if(!css.includes(marker)) css += `
${marker}
.coin-panel-shell .coin-choice-panel{box-sizing:border-box!important;max-width:min(92vw,520px)!important;width:min(92vw,520px)!important;padding-inline:clamp(16px,5vw,34px)!important;overflow:hidden!important}
.coin-panel-shell .mx-coin-waiting h2{max-width:100%!important;margin-inline:auto!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;text-align:center!important;line-height:1.02!important;font-size:clamp(20px,6.8vw,38px)!important;letter-spacing:.01em!important}
.coin-panel-shell .mx-coin-waiting p{max-width:100%!important;margin:12px auto 0!important;white-space:normal!important;text-align:center!important;line-height:1.25!important;font-size:clamp(12px,3.6vw,18px)!important;letter-spacing:.08em!important}
.coin-stage-result .coin-result-banner{box-sizing:border-box!important;max-width:min(92vw,620px)!important;margin-inline:auto!important;padding:10px 16px!important;text-align:center!important;white-space:normal!important;line-height:1.05!important;font-size:clamp(20px,6vw,42px)!important;overflow-wrap:anywhere!important}
@media(max-width:560px){
  .coin-panel-shell .coin-choice-panel{width:min(90vw,430px)!important;max-width:min(90vw,430px)!important;padding-inline:18px!important}
  .coin-panel-shell .mx-coin-waiting h2{font-size:clamp(22px,7vw,32px)!important}
  .coin-stage-result .coin-result-banner{font-size:clamp(22px,7vw,34px)!important;padding:9px 12px!important}
}
`

fs.writeFileSync(appPath,app)
fs.writeFileSync(cssPath,css)
console.log('Applied complete coin toss presentation: readable waiting copy and held winner reveal')
