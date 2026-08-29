import fs from 'node:fs'

const cssPath = 'src/Online.css'
let css = fs.readFileSync(cssPath, 'utf8')

const marker = '/* First-place champion glow */'
if (!css.includes(marker)) {
  css += `\n${marker}\n.mx-rank-card.rank-1{position:relative!important;isolation:isolate!important;border:2px solid #ffe36a!important;background:linear-gradient(180deg,#443006 0%,#201704 58%,#100d08 100%)!important;box-shadow:0 0 0 1px rgba(255,229,112,.38),0 0 16px rgba(255,215,65,.76),0 0 38px rgba(255,184,21,.55),0 0 70px rgba(255,149,0,.28),inset 0 0 24px rgba(255,206,55,.14)!important;animation:mxFirstPlaceGlow 1.25s ease-in-out infinite alternate!important}.mx-rank-card.rank-1::before{content:'';position:absolute;inset:-2px;z-index:-1;border-radius:2px;background:linear-gradient(115deg,transparent 15%,rgba(255,246,185,.72) 45%,transparent 65%);filter:blur(9px);opacity:.5;animation:mxFirstPlaceShimmer 2.2s ease-in-out infinite!important;pointer-events:none}.mx-rank-card.rank-1 b{color:#fff2a1!important;text-shadow:0 0 9px rgba(255,226,96,.9),0 0 20px rgba(255,183,25,.65)!important}.mx-rank-card.rank-1 strong,.mx-rank-card.rank-1 span{text-shadow:0 0 12px rgba(255,215,90,.32)!important}@keyframes mxFirstPlaceGlow{from{box-shadow:0 0 0 1px rgba(255,229,112,.3),0 0 13px rgba(255,215,65,.56),0 0 30px rgba(255,184,21,.38),0 0 54px rgba(255,149,0,.18),inset 0 0 18px rgba(255,206,55,.1)}to{box-shadow:0 0 0 1px rgba(255,241,160,.62),0 0 23px rgba(255,226,91,.96),0 0 52px rgba(255,187,24,.72),0 0 86px rgba(255,142,0,.4),inset 0 0 30px rgba(255,215,75,.2)}}@keyframes mxFirstPlaceShimmer{0%,100%{opacity:.28;transform:translateX(-8%)}50%{opacity:.72;transform:translateX(8%)}}\n`
}

fs.writeFileSync(cssPath, css)
console.log('Applied animated champion glow to first-place leaderboard card')
