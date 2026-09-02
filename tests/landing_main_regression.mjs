import fs from 'node:fs'

const source = fs.readFileSync('src/landing-ui.ts', 'utf8')
const failures = []

for (const forbidden of ['landing-main.webp', 'landing-main-hq.webp', 'mx-main-art']) {
  if (source.includes(forbidden)) failures.push(`landing must not reference flat composite ${forbidden}`)
}

for (const asset of [
  '/ui/landing/background.avif',
  '/ui/landing/logo.avif',
  '/ui/landing/left.avif',
  '/ui/landing/right.avif',
  '/ui/landing/card.avif',
]) {
  if (!source.includes(asset)) failures.push(`landing missing separate asset ${asset}`)
}

for (const animation of [
  '@keyframes mxHeroBobLeft',
  '@keyframes mxHeroBobRight',
  '@keyframes mxCardGlow',
  '@keyframes mxCtaPulse',
  '@keyframes mxArcFlicker',
]) {
  if (!source.includes(animation)) failures.push(`landing missing animation ${animation}`)
}

if (!source.includes('html.mx-main-active #mx-audio-controls')) failures.push('landing must scope audio control removal')
if (!/html\.mx-main-active #mx-audio-controls\s*\{[^}]*display:\s*none/s.test(source)) failures.push('audio control must be hidden on landing')

for (const wording of [
  'ACTION STRATEGY CARD BATTLE',
  'MAIN SEKARANG!',
  'EFFECT KAD UNIK',
  'PERTARUNGAN PANTAS',
  '1V1',
  'BE THE TOP X FIGHTER',
  '© 2025 MEGA-X. ALL RIGHTS RESERVED.',
  'Published by Sector Seven Studio',
]) {
  if (!source.includes(wording)) failures.push(`landing wording changed or missing: ${wording}`)
}

if (failures.length) {
  console.error('LANDING MAIN REGRESSION FAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('LANDING MAIN REGRESSION PASS')
