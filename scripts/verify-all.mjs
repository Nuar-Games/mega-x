import { existsSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const testsOnly = process.argv.includes('--tests-only')
const run=(command,args=[])=>{
  console.log(`RUN ${command} ${args.join(' ')}`)
  const result=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32'})
  if(result.status!==0){
    console.error(`FAILED ${command} ${args.join(' ')}`)
    process.exit(result.status??1)
  }
}

if(testsOnly&&!existsSync('src/App.tsx')){
  console.log('Generated source missing; materializing once before regression discovery.')
  run('node',['scripts/build-clean.mjs','--prepare-only'])
}

const regressionFiles = readdirSync('tests', { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('_regression.mjs'))
  .map(entry => `tests/${entry.name}`)
  .sort()

if (testsOnly && regressionFiles.length === 0) {
  console.error('NO_REGRESSION_TESTS_FOUND')
  process.exit(1)
}

if(testsOnly){
  for(const file of regressionFiles)run('node',[file])
  console.log(`ALL_REGRESSION_TESTS_PASS count=${regressionFiles.length}`)
}else{
  run('npm',['run','build'])
  console.log('FULL_VERIFY_PASS')
}
