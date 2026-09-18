import fs from 'node:fs'

const path='src/App.tsx'
let app=fs.readFileSync(path,'utf8')

function addPanelAttributes(blockMarker,className,attributes,label){
  const start=app.indexOf(blockMarker)
  if(start<0)throw new Error(`Hidden-choice 3D bridge block missing: ${label}`)
  const open=`<div className="${className}">`
  const panel=app.indexOf(open,start)
  if(panel<0||panel-start>12000)throw new Error(`Hidden-choice 3D bridge panel missing: ${label}`)
  const replacement=`<div className="${className}" ${attributes}>`
  app=app.slice(0,panel)+replacement+app.slice(panel+open.length)
}

addPanelAttributes(
  '{pendingChoice && passToPlayer === null && (',
  'choice-panel',
  'data-pending-choice-kind={pendingChoice.kind} data-pending-choice-remaining={pendingChoice.remaining} data-pending-choice-source={pendingChoice.sourceCardName}',
  'pendingChoice',
)

addPanelAttributes(
  '{game.pendingBoardChoice && passToPlayer === null && pendingChoice === null && (',
  'choice-panel board-choice-panel',
  'data-pending-choice-kind={game.pendingBoardChoice.purpose} data-pending-choice-remaining={game.pendingBoardChoice.cardIds.length} data-pending-choice-source={game.pendingBoardChoice.title}',
  'pendingBoardChoice',
)

fs.writeFileSync(path,app)
console.log('Patched hidden and board choice panels with authoritative 3D bridge metadata')
