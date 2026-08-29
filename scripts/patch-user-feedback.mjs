import fs from 'node:fs'

const appPath = 'src/App.tsx'
const authPath = 'src/onlineAuth.ts'
const cssPath = 'src/Online.css'

let app = fs.readFileSync(appPath, 'utf8')
let auth = fs.readFileSync(authPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')

const timerOld = `{actionTimerVisible && <div className={\`mx-action-timer \${actionSecondsLeft <= 10 ? 'is-danger' : ''}\`}><span>{actionTimerIndex === localViewer ? 'YOUR TIME' : 'OPPONENT'}</span><strong>{actionSecondsLeft}</strong></div>}`
const timerNew = `{actionTimerVisible && <div className={\`mx-action-timer \${actionSecondsLeft <= 5 ? 'is-critical' : actionSecondsLeft <= 10 ? 'is-danger' : actionSecondsLeft <= 15 ? 'is-warning' : ''}\`}><span>{actionTimerIndex === localViewer ? 'YOUR TURN' : 'OPPONENT TURN'}</span><strong>{actionSecondsLeft}</strong><em>SEC</em><i aria-hidden="true"><b style={{ width: Math.max(0, Math.min(100, (actionSecondsLeft / 60) * 100)) + '%' }} /></i></div>}`
if (!app.includes(timerOld)) throw new Error('arena timer patch target missing')
app = app.replace(timerOld, timerNew)

if (!app.includes("const stack = leaderboardRows.slice(3, 10)")) throw new Error('leaderboard stack patch target missing')
app = app.replace("const stack = leaderboardRows.slice(3, 10)", "const stack = leaderboardRows.slice(3, 20)")
app = app.replace('<h1>TOP 10 X FIGHTERS</h1>', '<h1>TOP 20 X FIGHTERS</h1>')
const rankLoopOld = `Array.from({ length: 7 }, (_, index) => {`
if (!app.includes(rankLoopOld)) throw new Error('leaderboard row-count patch target missing')
app = app.replace(rankLoopOld, `Array.from({ length: 17 }, (_, index) => {`)

const rpcOld = "`${SUPABASE_URL}/rest/v1/rpc/get_top_10_leaderboard`"
const rpcNew = "`${SUPABASE_URL}/rest/v1/rpc/get_top_20_leaderboard`"
if (!auth.includes(rpcOld)) throw new Error('top-20 rpc patch target missing')
auth = auth.replace(rpcOld, rpcNew)

const marker = '/* User feedback: arena timer visibility + top-20 lobby */'
if (!css.includes(marker)) {
  css += `\n${marker}\n.mx-action-timer{position:fixed!important;top:auto!important;left:50%!important;bottom:clamp(112px,23dvh,184px)!important;transform:translateX(-50%)!important;z-index:900!important;min-width:176px!important;height:62px!important;padding:7px 12px 10px!important;border:2px solid rgba(255,222,88,.92)!important;border-radius:10px!important;background:linear-gradient(180deg,rgba(9,12,19,.98),rgba(3,5,9,.98))!important;box-shadow:0 10px 34px rgba(0,0,0,.7),0 0 22px rgba(255,204,55,.28)!important;display:grid!important;grid-template-columns:1fr auto auto!important;grid-template-rows:auto auto!important;column-gap:6px!important;align-items:center!important;pointer-events:none!important}.mx-action-timer span{font:1000 13px/1 Barlow Condensed,Impact,sans-serif!important;letter-spacing:.11em!important;color:#ffe268!important;text-align:left!important}.mx-action-timer strong{font:1000 34px/.9 Barlow Condensed,Impact,sans-serif!important;color:#fff!important;font-variant-numeric:tabular-nums!important;text-shadow:0 2px 8px #000!important}.mx-action-timer em{font:900 9px/1 Barlow Condensed,Impact,sans-serif!important;font-style:normal!important;color:#aeb7c7!important;align-self:end!important;margin-bottom:3px!important}.mx-action-timer>i{grid-column:1/4;display:block!important;height:5px!important;border-radius:999px!important;background:#202838!important;overflow:hidden!important}.mx-action-timer>i>b{display:block!important;height:100%!important;background:linear-gradient(90deg,#ffb51d,#ffe45f)!important;transition:width .2s linear!important}.mx-action-timer.is-warning{border-color:#ffbf31!important;box-shadow:0 10px 34px rgba(0,0,0,.72),0 0 28px rgba(255,170,20,.48)!important}.mx-action-timer.is-warning strong{color:#ffd34e!important}.mx-action-timer.is-danger{border-color:#ff5146!important;background:linear-gradient(180deg,rgba(37,6,8,.99),rgba(8,3,5,.99))!important;box-shadow:0 10px 34px rgba(0,0,0,.75),0 0 34px rgba(255,45,32,.68)!important;animation:mxArenaTimerDanger .48s ease-in-out infinite alternate!important}.mx-action-timer.is-danger span,.mx-action-timer.is-danger strong{color:#ff6257!important}.mx-action-timer.is-danger>i>b{background:linear-gradient(90deg,#ff1e19,#ff7569)!important}.mx-action-timer.is-critical{border-color:#fff!important;background:#9e0707!important;box-shadow:0 0 0 3px rgba(255,26,20,.35),0 0 48px rgba(255,20,12,.92)!important;animation:mxArenaTimerCritical .28s steps(2,end) infinite!important}.mx-action-timer.is-critical span,.mx-action-timer.is-critical strong,.mx-action-timer.is-critical em{color:#fff!important}.mx-action-timer.is-critical strong{font-size:39px!important}.mx-action-timer.is-critical>i>b{background:#fff!important}@keyframes mxArenaTimerDanger{from{transform:translateX(-50%) scale(1)}to{transform:translateX(-50%) scale(1.045)}}@keyframes mxArenaTimerCritical{0%{filter:brightness(1)}100%{filter:brightness(1.7)}}\n.mx-leaderboard{overflow:hidden}.mx-rank-stack{max-height:calc(100dvh - 275px);overflow-y:auto;padding-right:4px;scrollbar-width:thin}.mx-leaderboard h1{font-size:clamp(31px,3.2vw,52px)!important}.mx-lobby-player::before{content:'LIVE';display:inline-flex;align-items:center;gap:6px;color:#70ff9b;font:1000 10px/1 Barlow Condensed,Impact,sans-serif;letter-spacing:.15em;text-shadow:0 0 10px rgba(72,255,132,.5)}\n@media(max-width:700px){.mx-action-timer{bottom:clamp(128px,24dvh,170px)!important;min-width:160px!important;height:58px!important}.mx-action-timer strong{font-size:31px!important}}\n`
}

fs.writeFileSync(appPath, app)
fs.writeFileSync(authPath, auth)
fs.writeFileSync(cssPath, css)
console.log('Applied user feedback: prominent arena timer and top-20 lobby leaderboard')
