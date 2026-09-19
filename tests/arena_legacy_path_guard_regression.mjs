import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const forbiddenDirs=['src/game/arena','src/game/arena3d']
for(const dir of forbiddenDirs){
  assert.equal(fs.existsSync(dir),false,`legacy arena directory must not reappear: ${dir}`)
}

const forbidden=[
  /(?:src\/)?game\/arena3d(?:\/|['"`])/,
  /(?:src\/)?game\/arena(?:\/|['"`])/,
]

function filesUnder(root){
  if(!fs.existsSync(root))return[]
  const out=[]
  for(const entry of fs.readdirSync(root,{withFileTypes:true})){
    const full=path.join(root,entry.name)
    if(entry.isDirectory())out.push(...filesUnder(full))
    else out.push(full)
  }
  return out
}

const candidates=[...filesUnder('src'),...filesUnder('scripts')]
  .filter((file)=>/\.(?:ts|tsx|js|jsx|mjs|cjs|css|html)$/.test(file))

for(const file of candidates){
  const text=fs.readFileSync(file,'utf8')
  for(const pattern of forbidden){
    assert.equal(pattern.test(text),false,`legacy arena path reference found in ${file}: ${pattern}`)
  }
}

console.log('PASS arena legacy path guard')
