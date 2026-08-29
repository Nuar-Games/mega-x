const cssParts=["/chunks/css-00.txt", "/chunks/css-01.txt", "/chunks/css-02.txt", "/chunks/css-03.txt", "/chunks/css-04.txt", "/chunks/css-05.txt", "/chunks/css-06.txt", "/chunks/css-07.txt", "/chunks/css-08.txt", "/chunks/css-09.txt", "/chunks/css-10.txt", "/chunks/css-11.txt", "/chunks/css-12.txt"];
const appParts=["/chunks/app-00.txt", "/chunks/app-01.txt", "/chunks/app-02.txt", "/chunks/app-03.txt"];
const fetchText=async(paths)=>{const r=await Promise.all(paths.map(async p=>{const x=await fetch(p,{cache:'no-store'});if(!x.ok)throw new Error(`LOAD_${x.status}_${p}`);return x.text()}));return r.join('')};
const css=await fetchText(cssParts);const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
const appCode=await fetchText(appParts);const appUrl=URL.createObjectURL(new Blob([appCode],{type:'text/javascript'}));
const [appMod,domMod,jsxMod]=await Promise.all([import(appUrl),import('react-dom/client'),import('react/jsx-runtime')]);
domMod.default.createRoot(document.getElementById('root')).render(jsxMod.jsx(appMod.default,{}));
