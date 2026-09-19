import fs from 'node:fs'
import path from 'node:path'

const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const root='src/game/arena-next/prototype'
const files=['ArenaPrototypeLayout.ts','prototypeFixture.ts','ArenaPrototypeScene.ts','ArenaPrototypeGame.ts','main.ts']
for(const file of files){
  const full=path.join(root,file)
  must(fs.existsSync(full),`Phase 3 prototype file missing: ${full}`)
}
must(fs.existsSync('arena-next-prototype.html'),'isolated prototype HTML entry missing')

const layout=fs.readFileSync(path.join(root,'ArenaPrototypeLayout.ts'),'utf8')
const fixture=fs.readFileSync(path.join(root,'prototypeFixture.ts'),'utf8')
const scene=fs.readFileSync(path.join(root,'ArenaPrototypeScene.ts'),'utf8')
const game=fs.readFileSync(path.join(root,'ArenaPrototypeGame.ts'),'utf8')
const main=fs.readFileSync(path.join(root,'main.ts'),'utf8')
const html=fs.readFileSync('arena-next-prototype.html','utf8')
const all=`${layout}\n${fixture}\n${scene}\n${game}\n${main}\n${html}`

must(game.includes('Phaser.WEBGL'),'prototype must explicitly use Phaser WebGL')
must(game.includes('Phaser.Scale.RESIZE'),'prototype must use RESIZE instead of page scaling')
must(scene.includes('rebuildFromState('),'scene must rebuild entirely from ArenaState')
must(scene.includes('consumeEvent('),'scene must consume presentation events separately from state')
must(scene.includes("event.type === 'VS_SET'")||scene.includes("case 'VS_SET'"),'prototype must animate a VS_SET vertical slice')
must(scene.includes('rebuildFromState(nextState)'),'event animation must settle to authoritative next state')
must(fixture.includes('prototypeStateBefore'),'fixture must provide before state')
must(fixture.includes('prototypeStateAfter'),'fixture must provide after state')
must(fixture.includes('prototypeVsSetEvent'),'fixture must provide versioned event')
must(layout.includes('effectSlots'),'desktop layout must expose effect slot anchors')
must(layout.includes('Array.from({ length: 5 }'),'each effect rail must define exactly five slots')
must(layout.includes('masterDeck'),'desktop layout must expose one master deck anchor')
must(layout.includes('zonTepi'),'desktop layout must expose Zon Tepi anchors')
must(layout.includes('zonX'),'desktop layout must expose Zon X anchors')
must(layout.includes('captured'),'desktop layout must expose captured counters')
must(main.includes('ArenaEventQueue'),'prototype must exercise the engine-independent event queue')

for(const forbidden of ['from \'react\'','from "react"','MutationObserver','querySelector','button.click','transform: scale','transform:scale'])
  must(!all.includes(forbidden),`Phase 3 prototype must not depend on forbidden legacy/page primitive: ${forbidden}`)

console.log('PASS isolated next-arena Phaser desktop prototype boundary')
