import fs from 'node:fs'
const app=fs.readFileSync('src/App.tsx','utf8')
const cssFiles=['src/Online.css','src/V24.css','src/styles.css'].filter(p=>fs.existsSync(p))
for(const needle of ['mx-lobby-player','ONLINE X FIGHTER','challengeFighter','mx-online-screen','mx-lobby']){
 let i=0; while((i=app.indexOf(needle,i))>=0){console.log(`APP ${needle} @ ${i}\n${app.slice(Math.max(0,i-1200),Math.min(app.length,i+2200))}\n---`);i+=needle.length}
}
for(const p of cssFiles){const css=fs.readFileSync(p,'utf8');for(const needle of ['.mx-online-screen','.mx-lobby','.mx-lobby-player','overflow:hidden','100dvh','height:100']){let i=0;while((i=css.indexOf(needle,i))>=0){console.log(`CSS ${p} ${needle} @ ${i}\n${css.slice(Math.max(0,i-900),Math.min(css.length,i+1800))}\n---`);i+=needle.length}}}
