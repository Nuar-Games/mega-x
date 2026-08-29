import fs from 'node:fs';
import path from 'node:path';

const gameSrc = 'recovery/cards/game';
const inspectSrc = 'recovery/cards/inspect';
const gameOut = 'public/cards/game';
const inspectOut = 'public/cards/inspect';

if (!fs.existsSync(gameSrc)) throw new Error('Missing high-resolution gameplay cards: recovery/cards/game');
if (!fs.existsSync(inspectSrc)) throw new Error('Missing high-resolution inspect cards: recovery/cards/inspect');

const gameFiles = fs.readdirSync(gameSrc).filter(name => name.endsWith('.webp')).sort();
const inspectFiles = fs.readdirSync(inspectSrc).filter(name => name.endsWith('.webp')).sort();

if (gameFiles.length !== 30) throw new Error(`Expected 30 gameplay cards, got ${gameFiles.length}`);
if (inspectFiles.length !== 30) throw new Error(`Expected 30 inspect cards, got ${inspectFiles.length}`);

for (let i = 1; i <= 30; i += 1) {
  const name = String(i).padStart(2, '0') + '.webp';
  if (!gameFiles.includes(name)) throw new Error(`Missing gameplay card ${name}`);
  if (!inspectFiles.includes(name)) throw new Error(`Missing inspect card ${name}`);
}

fs.mkdirSync(gameOut, { recursive: true });
fs.mkdirSync(inspectOut, { recursive: true });

for (const name of gameFiles) fs.copyFileSync(path.join(gameSrc, name), path.join(gameOut, name));
for (const name of inspectFiles) fs.copyFileSync(path.join(inspectSrc, name), path.join(inspectOut, name));

const backGameSrc = 'recovery/cards/back-game.webp';
const backInspectSrc = 'recovery/cards/back-inspect.webp';
if (!fs.existsSync(backGameSrc)) throw new Error('Missing recovery/cards/back-game.webp');
fs.mkdirSync('public/cards', { recursive: true });
fs.copyFileSync(backGameSrc, 'public/cards/back-game.webp');
if (fs.existsSync(backInspectSrc)) fs.copyFileSync(backInspectSrc, 'public/cards/back-inspect.webp');

const minGameBytes = Math.min(...gameFiles.map(name => fs.statSync(path.join(gameSrc, name)).size));
const minInspectBytes = Math.min(...inspectFiles.map(name => fs.statSync(path.join(inspectSrc, name)).size));
if (minGameBytes < 50000) throw new Error(`Gameplay card asset unexpectedly small: ${minGameBytes} bytes`);
if (minInspectBytes < 150000) throw new Error(`Inspect card asset unexpectedly small: ${minInspectBytes} bytes`);

console.log(`Copied 30 high-resolution gameplay cards and 30 inspect cards (min ${minGameBytes}/${minInspectBytes} bytes)`);
