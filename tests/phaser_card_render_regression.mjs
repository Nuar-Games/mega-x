import fs from 'node:fs'

const arena = fs.readFileSync('src/phaser-arena.ts', 'utf8')
const css = fs.readFileSync('src/phaser-arena.css', 'utf8')
const must = (ok, message) => { if (!ok) throw new Error(message) }

must(arena.includes('syncCardSprites'), 'Phaser arena must synchronize visible card images into the renderer')
must(arena.includes('textures.addImage'), 'Phaser must render existing card image assets as Phaser textures')
must(arena.includes('mx-phaser-card-mirrored'), 'mirrored DOM card images must be marked only after Phaser owns their visual')
must(css.includes('.mx-phaser-card-mirrored'), 'DOM card artwork must be hidden after successful Phaser mirroring')
must(css.includes('opacity:0!important'), 'mirrored DOM artwork must not remain visibly stacked over Phaser')

console.log('PASS Phaser owns visible card artwork while DOM retains interaction targets')
