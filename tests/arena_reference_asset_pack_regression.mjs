import fs from 'node:fs'
const source=fs.readFileSync('src/game/arena/ArenaAssets.ts','utf8')
const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const required=['hudPlayer','hudOpponent','deckFixture','discardFixture','zonXFixture','fieldBlue','fieldRed','fieldNeutral','turnBanner','phaseBadge','commandAttack','commandSkill','commandZonX','commandMove','commandEnd','gameLog','messagePanel','inspectFrame','statusBadge','resultFrame','loadingMark','fxSlash','fxBurst','fxImpact','fxRing']
for(const key of required) must(source.includes(`${key}: '/ui/arena/v3/`),`missing v3 asset ${key}`)
for(const path of source.matchAll(/'\/ui\/arena\/v3\/([^']+)'/g)){
  const file=`public/ui/arena/v3/${path[1]}`
  must(fs.existsSync(file),`missing file ${file}`)
  const svg=fs.readFileSync(file,'utf8')
  must(svg.includes('<svg'),`${file} is not SVG`)
  const fills=(svg.match(/fill=/g)||[]).length
  const strokes=(svg.match(/stroke=/g)||[]).length
  const hasDepth=svg.includes('linearGradient')||svg.includes('radialGradient')||svg.includes('filter=')
  must(fills>=2 || (fills>=1&&strokes>=2),`${file} lacks substantial visible layers`)
  must(hasDepth,`${file} lacks material depth treatment`)
}
console.log('PASS reference-grade arena asset families')
