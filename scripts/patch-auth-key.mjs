import fs from 'node:fs'

const path = 'src/onlineAuth.ts'
let source = fs.readFileSync(path, 'utf8')
const stale = 'sb_publishable_EMVTyrv3gGmmouCiVix4dg__W3zuzMc'
const active = 'sb_publishable_fXF7LXgKXeH4p5_Bwai0nQ_d-NWdOk_'
if (!source.includes(stale) && !source.includes(active)) throw new Error('Supabase publishable key marker not found')
source = source.replaceAll(stale, active)
fs.writeFileSync(path, source)
console.log('Patched Supabase publishable key')
