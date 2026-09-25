import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC_ROOT = 'src'
const CONFIG_FILE = 'src/supabaseConfig.ts'
const banned = [
  'https://mmtorfzxnidsczcdygbp.supabase.co',
  'sb_publishable_fXF7LXgKXeH4p5_Bwai0nQ_d-NWdOk_',
  'VITE_SUPABASE_KEY',
]

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? sourceFiles(path) : [path]
  })
}

const violations = []
for (const file of sourceFiles(SRC_ROOT)) {
  const normalized = relative('.', file).replaceAll('\\', '/')
  if (normalized === CONFIG_FILE) continue
  const source = readFileSync(file, 'utf8')
  for (const value of banned) {
    if (source.includes(value)) violations.push(`${normalized}: ${value}`)
  }
}

if (violations.length) {
  console.error('SUPABASE_CONFIG_SOURCE_OF_TRUTH_VIOLATION')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log('SUPABASE_CONFIG_SOURCE_OF_TRUTH_PASS')
