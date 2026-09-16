import fs from 'node:fs'

const path='src/App.tsx'
let app=fs.readFileSync(path,'utf8')

const marker="game.players[bottomPlayer].hand.slice(0,5).map((card) => {"
const start=app.indexOf(marker)
if(start<0)throw new Error('clean arena local-hand map missing')
const end=app.indexOf('      })}</div>',start)
if(end<0)throw new Error('clean arena local-hand map end missing')
const block=app.slice(start,end)

const returnRe=/return <button key=\{card\.id\} className=\{`mx3-hand-card \$\{arriving \? 'is-arrival-hidden' : ''\} \$\{canSet \|\| canEffect \? 'is-playable' : ''\} \$\{staExhausted \? 'is-sta-exhausted' : ''\}`\} onClick=\{\(\) => \{ if \(staExhausted\) \{ window\.dispatchEvent\(new CustomEvent\('mega-x:arena-feedback',[\s\S]*?setFocusedCard\(card\) \}\}><CardView card=\{card\}\/><\/button>/
const match=block.match(returnRe)
if(!match)throw new Error('clean arena final playable hand button missing')

const replacement=`return <div key={card.id} className="mx3-hand-slot" data-arena-card-id={card.id}>
          <button className={\`mx3-hand-card \${arriving ? 'is-arrival-hidden' : ''} \${canSet || canEffect ? 'is-playable' : ''} \${staExhausted ? 'is-sta-exhausted' : ''}\`} onClick={() => { if (staExhausted) { window.dispatchEvent(new CustomEvent('mega-x:arena-feedback', { detail: { message: \`STA HABIS — VS STA \${sta} hanya membenarkan \${staEffectLimit} kad EFFECT.\` } })); return } setFocusedCard(card) }}><CardView card={card}/></button>
          {canSet && <>
            <button type="button" style={{display:'none'}} data-arena-card-action="SET VS · ATK" onClick={() => setVS(bottomPlayer, card.id, 'ATK')}>SET VS · ATK</button>
            <button type="button" style={{display:'none'}} data-arena-card-action="SET VS · DEF" onClick={() => setVS(bottomPlayer, card.id, 'DEF')}>SET VS · DEF</button>
          </>}
          {canEffect && !staExhausted && <button type="button" style={{display:'none'}} data-arena-card-action="PLAY EFFECT" onClick={() => playEffect(bottomPlayer, card.id)}>PLAY EFFECT</button>}
        </div>`

const nextBlock=block.replace(match[0],replacement)
app=app.slice(0,start)+nextBlock+app.slice(end)
if(!app.includes('data-arena-card-action="SET VS · ATK"')||!app.includes('data-arena-card-action="PLAY EFFECT"'))throw new Error('clean arena semantic actions missing after patch')
fs.writeFileSync(path,app)
console.log('Exposed authoritative SET VS / PLAY EFFECT actions for Phaser hand cards')
