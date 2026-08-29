import fs from 'node:fs'
const app=fs.readFileSync('src/App.tsx','utf8')
const css=fs.readFileSync('src/Online.css','utf8')
for(const needle of ['ONLINE X FIGHTER','mx-lobby-player','challengeFighter']){
 const i=app.indexOf(needle); if(i>=0) console.log(`APP ${needle}\n${app.slice(Math.max(0,i-1800),Math.min(app.length,i+3200))}\n---`)
}
for(const needle of ['.mx-online-screen','.mx-lobby{','.mx-lobby-grid','.mx-lobby-player','.mx-online-list','.mx-lobby-side']){
 let i=0; while((i=css.indexOf(needle,i))>=0){console.log(`CSS ${needle}\n${css.slice(Math.max(0,i-1400),Math.min(css.length,i+3600))}\n---`);i+=needle.length}
}
