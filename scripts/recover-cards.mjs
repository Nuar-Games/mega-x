import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const parts = [
  '00a','00b','01','02','03a','03b','03c','04','05','06','07','08','09'
];
const b64 = parts.map(n => fs.readFileSync(`recovery/cards/${n}.b64`, 'utf8').trim()).join('');
const raw = zlib.gunzipSync(Buffer.from(b64, 'base64'));
const sha = crypto.createHash('sha256').update(raw).digest('hex');
const expected = 'a0d4655fde4fc2b35b9889de08ce9f7d5d1fa005c01147f86f42fea23d54c28f';
if (sha !== expected) throw new Error(`Card recovery checksum mismatch: ${sha}`);
const files = JSON.parse(raw.toString('utf8'));
if (Object.keys(files).length !== 31) throw new Error(`Expected 31 card assets, got ${Object.keys(files).length}`);
fs.mkdirSync('public/cards/game', { recursive: true });
fs.mkdirSync('public/cards/inspect', { recursive: true });
for (const [name, encoded] of Object.entries(files)) {
  const data = Buffer.from(encoded, 'base64');
  if (name === 'back-game.webp') {
    fs.writeFileSync('public/cards/back-game.webp', data);
  } else {
    fs.writeFileSync(path.join('public/cards/game', name), data);
    fs.writeFileSync(path.join('public/cards/inspect', name), data);
  }
}
console.log(`Recovered ${Object.keys(files).length} card assets (${sha})`);
