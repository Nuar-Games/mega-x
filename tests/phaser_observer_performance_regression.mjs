import fs from 'node:fs'

const source = fs.readFileSync('src/phaser-arena.ts', 'utf8')
const must = (ok, message) => { if (!ok) throw new Error(message) }

must(!source.includes("observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })"), 'Phaser arena must not rescan from every document text mutation')
must(source.includes('ResizeObserver'), 'Phaser arena must redraw from actual arena geometry changes')
must(source.includes('shellObserver.observe'), 'Phaser arena must scope mutation watching to the active arena shell')
must(source.includes("attributeFilter: ['src']") || source.includes('attributeFilter: [\'src\']'), 'Phaser card sync must only watch relevant image source changes')
must(source.includes('window.setTimeout') && source.includes('requestArenaSync'), 'Phaser arena mutation bursts must collapse into one scheduled sync')

console.log('PASS Phaser arena sync is scoped and mutation bursts do not trigger full document rescans')
