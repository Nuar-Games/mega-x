import fs from 'node:fs'

const path='src/App.tsx'
let app=fs.readFileSync(path,'utf8')

function addPanelAttributes(blockMarker,className,attributes,label){
  const start=app.indexOf(blockMarker)
  if(start<0)throw new Error(`Self-discard 3D bridge block missing: ${label}`)
  const open=`<div className="${className}">`
  const panel=app.indexOf(open,start)
  if(panel<0||panel-start>12000)throw new Error(`Self-discard 3D bridge panel missing: ${label}`)
  const replacement=`<div className="${className}" ${attributes}>`
  app=app.slice(0,panel)+replacement+app.slice(panel+open.length)
}

addPanelAttributes(
  '{game.pendingSelfDiscard && passToPlayer === null && pendingChoice === null && (',
  'choice-panel discard-panel',
  'data-pending-discard-reason={game.pendingSelfDiscard.reason} data-pending-discard-mode={game.pendingSelfDiscard.mode} data-pending-discard-count={game.pendingSelfDiscard.count}',
  'pendingSelfDiscard',
)

fs.writeFileSync(path,app)
console.log('Patched self-discard panel with authoritative 3D bridge metadata')
