import fs from 'node:fs'

const source = fs.readFileSync('src/landing-ui.ts', 'utf8')
const failures = []

if (!source.includes("landing-main-hq.webp")) failures.push('landing must use full-resolution artwork')
if (!source.includes('html.mx-main-active #mx-audio-controls')) failures.push('landing must scope audio control removal')
if (!/html\.mx-main-active #mx-audio-controls\s*\{[^}]*display:\s*none/s.test(source)) failures.push('audio control must be hidden on landing')
if (!source.includes('@keyframes mxMainElectricPulse')) failures.push('CTA must have electric pulse animation')
if (!source.includes('@keyframes mxMainArcFlicker')) failures.push('CTA must have electric arc animation')

if (failures.length) {
  console.error('LANDING MAIN REGRESSION FAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('LANDING MAIN REGRESSION PASS')
