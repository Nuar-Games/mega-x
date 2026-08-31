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
.coin-panel-shell,.coin-panel-shell .coin-stage,.coin-stage-result,.coin-stage-fight{box-sizing:border-box!important;overflow:visible!important}
.coin-panel-shell .coin-choice-panel{box-sizing:border-box!important;width:min(94vw,520px)!important;max-width:min(94vw,520px)!important;min-height:0!important;padding:22px 18px!important;overflow:visible!important}
.coin-panel-shell .coin-choice-panel.mx-coin-waiting{padding:22px 16px!important}
.coin-panel-shell .mx-coin-waiting h2{display:block!important;max-width:100%!important;margin:0 auto!important;padding:.16em .08em!important;white-space:normal!important;overflow:visible!important;overflow-wrap:anywhere!important;text-align:center!important;line-height:1.22!important;font-size:clamp(20px,6.2vw,36px)!important;letter-spacing:0!important}
.coin-panel-shell .mx-coin-waiting p{max-width:100%!important;margin:12px auto 0!important;padding:.08em!important;white-space:normal!important;overflow:visible!important;text-align:center!important;line-height:1.32!important;font-size:clamp(12px,3.6vw,18px)!important;letter-spacing:.06em!important}
.coin-stage-result .coin-result-banner,.coin-stage-fight .coin-result-banner{box-sizing:border-box!important;width:min(94vw,620px)!important;max-width:min(94vw,620px)!important;margin-inline:auto!important;padding:14px 18px!important;text-align:center!important;white-space:normal!important;line-height:1.22!important;font-size:clamp(20px,5.8vw,40px)!important;overflow:visible!important;overflow-wrap:anywhere!important}
@media(max-width:560px){
  .coin-panel-shell{padding-inline:3vw!important;overflow:visible!important}
  .coin-panel-shell .coin-choice-panel{width:94vw!important;max-width:94vw!important;padding:20px 16px!important;overflow:visible!important}
  .coin-panel-shell .mx-coin-waiting h2{font-size:clamp(20px,6.3vw,30px)!important;line-height:1.22!important}
  .coin-stage-result .coin-result-banner,.coin-stage-fight .coin-result-banner{width:94vw!important;max-width:94vw!important;font-size:clamp(20px,6.2vw,32px)!important;line-height:1.22!important;padding:13px 14px!important;overflow:visible!important}
}
`

fs.writeFileSync(appPath,app)
fs.writeFileSync(cssPath,css)
console.log('Applied unclipped coin toss presentation and held winner reveal')
