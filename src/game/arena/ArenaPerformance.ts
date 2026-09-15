export type ArenaQuality='low'|'balanced'|'high'
export type ArenaPerformanceProfile={
  quality:ArenaQuality
  resolution:number
  targetFps:number
  antialias:boolean
  maxParticles:number
  cameraShake:boolean
}

type NavigatorHints=Navigator & {deviceMemory?:number}

const QUALITY_KEY='mxQuality'

function requestedQuality():ArenaQuality|'auto'{
  const query=new URLSearchParams(location.search).get(QUALITY_KEY)
  if(query==='low'||query==='balanced'||query==='high')return query
  try{
    const saved=localStorage.getItem(QUALITY_KEY)
    if(saved==='low'||saved==='balanced'||saved==='high')return saved
  }catch{}
  return 'auto'
}

export function chooseArenaPerformanceProfile():ArenaPerformanceProfile{
  const nav=navigator as NavigatorHints
  const cores=Math.max(1,Number(nav.hardwareConcurrency||4))
  const memory=Number(nav.deviceMemory||4)
  const requested=requestedQuality()
  let quality:ArenaQuality

  if(requested!=='auto')quality=requested
  else if(cores<=4||memory<=4)quality='low'
  else if(cores<=8||memory<=8)quality='balanced'
  else quality='high'

  if(quality==='low')return {quality,resolution:0.72,targetFps:30,antialias:false,maxParticles:4,cameraShake:false}
  if(quality==='balanced')return {quality,resolution:0.9,targetFps:45,antialias:true,maxParticles:7,cameraShake:true}
  return {quality,resolution:1,targetFps:60,antialias:true,maxParticles:10,cameraShake:true}
}

export function saveArenaQuality(quality:ArenaQuality){
  try{localStorage.setItem(QUALITY_KEY,quality)}catch{}
}
