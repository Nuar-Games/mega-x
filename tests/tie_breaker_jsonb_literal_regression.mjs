import { readdirSync, readFileSync } from 'node:fs'
import { basename, extname, join, relative } from 'node:path'

const migrationsDir='supabase/migrations'
const malformedJsonbLiteral=/'[^'\r\n]*\\\"[^'\r\n]*'::jsonb/g
// This fix migration intentionally stores the malformed literal inside $lit$ quoting so it can replace that exact text in the live function body.
const allowlistedMigration='20260925131205_fix_tie_breaker_game_over_jsonb_literal.sql'

function sqlFiles(dir){
  const files=[]
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    const path=join(dir,entry.name)
    if(entry.isDirectory())files.push(...sqlFiles(path))
    else if(entry.isFile()&&extname(entry.name)==='.sql')files.push(path)
  }
  return files
}

const failures=[]
for(const file of sqlFiles(migrationsDir)){
  if(basename(file)===allowlistedMigration)continue
  const sql=readFileSync(file,'utf8')
  const matches=[...sql.matchAll(malformedJsonbLiteral)]
  for(const match of matches)failures.push(`${relative('.',file)}: ${match[0]}`)
}

if(failures.length){
  console.error('MALFORMED_JSONB_LITERAL_FOUND')
  for(const failure of failures)console.error(`- ${failure}`)
  process.exit(1)
}

console.log('TIE_BREAKER_JSONB_LITERAL_REGRESSION_PASS')
