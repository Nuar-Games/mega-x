import { spawnSync } from 'node:child_process'

const run=(command,args=[])=>{
  const result=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32'})
  if(result.status!==0)process.exit(result.status??1)
}

run('node',['scripts/verify-all.mjs','--tests-only'])
run('node',['scripts/verify-gate1.mjs'])
run('npx',['tsc'])
run('npx',['vite','build'])
