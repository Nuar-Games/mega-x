export type Arena3DQualityName='high'|'medium'|'low'
export type Arena3DQualityProfile={name:Arena3DQualityName;dpr:number;shadows:boolean;bloom:boolean;particles:number;trails:boolean;shake:number}

export const ARENA_3D_QUALITY:Record<Arena3DQualityName,Arena3DQualityProfile>={
  high:{name:'high',dpr:1.75,shadows:true,bloom:true,particles:22,trails:true,shake:1},
  medium:{name:'medium',dpr:1.25,shadows:true,bloom:true,particles:10,trails:true,shake:.72},
  low:{name:'low',dpr:1,shadows:false,bloom:false,particles:0,trails:false,shake:.25},
}

export function chooseArena3DQuality():Arena3DQualityName{
  const saved=localStorage.getItem('mega-x-arena3d-quality') as Arena3DQualityName|null
  if(saved&&saved in ARENA_3D_QUALITY)return saved
  const memory=(navigator as Navigator & {deviceMemory?:number}).deviceMemory??4
  const cores=navigator.hardwareConcurrency??4
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false
  if(reduced||memory<=2||cores<=2)return 'low'
  if(memory<=4||cores<=4)return 'medium'
  return 'high'
}

export function saveArena3DQuality(name:Arena3DQualityName){
  localStorage.setItem('mega-x-arena3d-quality',name)
}

export function canUseWebGL(){
  try{
    const canvas=document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2')||canvas.getContext('webgl'))
  }catch{return false}
}
