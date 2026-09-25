import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const srcRoot = 'src'
const exempt = join(srcRoot, 'supabaseConfig.ts')
const forbidden = [
  ['production Supabase URL', 'https://mmtorfzxnidsczcdygbp.supabase.co'],
  ['production Supabase key', 'sb_publishable_fXF7LXgKXeH4p5_Bwai0nQ_d-NWdOk_'],
  ['legacy VITE_SUPABASE_KEY name', 'VITE_SUPABASE_KEY'],
]

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(path) : entry.isFile() ? [path] : []
  })
}

const violations = []
for (const file of filesUnder(srcRoot)) {
  if (file === exempt) continue
  const source = readFileSync(file, 'utf8')
  for (const [label, value] of forbidden) {
    if (source.includes(value)) violations.push(`${file}: ${label}`)
  }
}

if (violations.length) {
  console.error('SUPABASE_CONFIG_SOURCE_OF_TRUTH_FAIL')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log('SUPABASE_CONFIG_SOURCE_OF_TRUTH_PASS')
