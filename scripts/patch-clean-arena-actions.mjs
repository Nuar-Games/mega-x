import fs from 'node:fs'

const path='src/App.tsx'
let app=fs.readFileSync(path,'utf8')

const from=`        return <button key={card.id} className={\`mx3-hand-card \${arriving ? 'is-arrival-hidden' : ''} \${canSet || canEffect ? 'is-playable' : ''}\`} onClick={() => setFocusedCard(card)}><CardView card={card}/></button>`
const to=`        return <div key={card.id} className="mx3-hand-slot" data-arena-card-id={card.id}>
          <button className={\`mx3-hand-card \${arriving ? 'is-arrival-hidden' : ''} \${canSet || canEffect ? 'is-playable' : ''}\`} onClick={() => setFocusedCard(card)}><CardView card={card}/></button>
          {canSet && <>
            <button type="button" style={{display:'none'}} data-arena-card-action="SET VS · ATK" onClick={() => setVS(bottomPlayer, card.id, 'ATK')}>SET VS · ATK</button>
            <button type="button" style={{display:'none'}} data-arena-card-action="SET VS · DEF" onClick={() => setVS(bottomPlayer, card.id, 'DEF')}>SET VS · DEF</button>
          </>}
          {canEffect && <button type="button" style={{display:'none'}} data-arena-card-action="PLAY EFFECT" onClick={() => playEffect(bottomPlayer, card.id)}>PLAY EFFECT</button>}
        </div>`

if(!app.includes(from))throw new Error('clean arena card-action hand anchor missing')
app=app.replace(from,to)
fs.writeFileSync(path,app)
console.log('Exposed direct SET VS / PLAY EFFECT actions for Phaser hand cards')
