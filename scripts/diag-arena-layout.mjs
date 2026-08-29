import fs from 'node:fs'
const app=fs.readFileSync('src/App.tsx','utf8')
const cssFiles=['src/App.css','src/Online.css','src/index.css'].filter(fs.existsSync)
const css=cssFiles.map(f=>fs.readFileSync(f,'utf8')).join('\n')
for(const needle of ['PILIH KAD UNTUK DIBUANG','Pilih tepat','PILIH KAD VS','mx-quit-match','hand-area','hand-card']){
 const i=app.indexOf(needle); if(i>=0) console.log(`APP ${needle}\n${app.slice(Math.max(0,i-1200),Math.min(app.length,i+3200))}\n---`)
}
for(const needle of ['.duel-arena','.hand-area','.hand-card','.mx-quit-match','.discard','.selection','.modal']){
 let i=0,n=0; while((i=css.indexOf(needle,i))>=0&&n<5){console.log(`CSS ${needle}\n${css.slice(Math.max(0,i-1000),Math.min(css.length,i+3000))}\n---`);i+=needle.length;n++}
}
