import fs from 'node:fs'

const runtime = fs.readFileSync('src/phaser-arena.ts', 'utf8')
const css = fs.readFileSync('src/phaser-arena.css', 'utf8')
const must = (ok, message) => { if (!ok) throw new Error(message) }

must(runtime.includes('drawArenaChrome'), 'Phaser renderer must draw the visible arena chrome')
must(runtime.includes('drawZoneFrame'), 'Phaser renderer must own visible zone frames')
must(runtime.includes('drawCombatLane'), 'Phaser renderer must draw the combat lane rather than relying on DOM backgrounds')
must(runtime.includes("shell.classList.add('mx-phaser-rendered')"), 'arena shell must explicitly enter Phaser-rendered presentation mode')
must(css.includes('.mx-phaser-rendered .mx3-zone'), 'legacy DOM zone chrome must be neutralized under Phaser presentation')
must(css.includes('background:transparent!important'), 'Phaser presentation must not leave legacy opaque arena surfaces covering the canvas')

console.log('PASS Phaser owns visible arena structure while DOM remains interaction overlay')
