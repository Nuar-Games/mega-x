import fs from 'node:fs'

const appPath = 'src/App.tsx'
const cssPath = 'src/V24.css'
let app = fs.readFileSync(appPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')

const roundSlam = `              <div className="round-slam" key={\`round-\${game.round}\`}>PUSINGAN {game.round}</div>`
if (!app.includes(roundSlam)) throw new Error('attack-block feedback target missing')

const blockSlam = `${roundSlam}
              {game.message.includes('peluang serangan') && game.message.includes('disekat') && (
                <div className="mx-attack-blocked-slam" role="status" aria-live="assertive">
                  <strong>SERANGAN DISEKAT</strong>
                  <span>EFFECT AKTIF — GILIRAN SERANGAN DILANGKAU</span>
                </div>
              )}`
app = app.replace(roundSlam, blockSlam)

const marker = '/* Attack-block feedback */'
if (!css.includes(marker)) {
  css += `\n${marker}\n.mx-attack-blocked-slam{position:fixed;left:50%;top:32%;transform:translate(-50%,-50%) scale(.82);z-index:920;pointer-events:none;display:grid;gap:4px;min-width:min(86vw,360px);padding:14px 18px 13px;border:2px solid rgba(255,226,95,.98);border-radius:12px;background:linear-gradient(180deg,rgba(112,7,13,.98),rgba(25,2,7,.98));box-shadow:0 14px 46px rgba(0,0,0,.82),0 0 38px rgba(255,47,31,.72),inset 0 0 20px rgba(255,218,78,.12);text-align:center;animation:mxAttackBlockedSlam 1.65s cubic-bezier(.16,.84,.24,1) forwards}.mx-attack-blocked-slam strong{font:1000 clamp(26px,5vw,44px)/.92 Barlow Condensed,Impact,sans-serif;letter-spacing:.055em;color:#fff4a8;text-shadow:0 2px 0 #6a0000,0 0 16px rgba(255,230,96,.75)}.mx-attack-blocked-slam span{font:900 clamp(11px,2.2vw,15px)/1.05 Barlow Condensed,Impact,sans-serif;letter-spacing:.12em;color:#fff}@keyframes mxAttackBlockedSlam{0%{opacity:0;transform:translate(-50%,-50%) scale(.62)}10%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}18%{transform:translate(-50%,-50%) scale(.98)}72%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.04)}}@media(max-width:700px){.mx-attack-blocked-slam{top:28%;min-width:min(90vw,330px);padding:12px 14px}.mx-attack-blocked-slam strong{font-size:clamp(25px,8vw,38px)}}\n`
}

fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
console.log('Added explicit arena feedback when an Effect blocks an attack turn')
