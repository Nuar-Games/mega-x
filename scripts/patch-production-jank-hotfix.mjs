import fs from 'node:fs'

const appPath='src/App.tsx'
const cssPath='src/V24.css'
const audioPath='src/audio.ts'
let app=fs.readFileSync(appPath,'utf8')
let css=fs.readFileSync(cssPath,'utf8')
let audio=fs.readFileSync(audioPath,'utf8')

// Root cause: the mobile !important transform on .mega-coin overrides the transform
// animated by the original keyframes, so the coin visually stops flipping.
css=css.replace(' .mega-coin{will-change:transform!important;contain:layout paint style!important;transform:translateZ(0)}\n','')

// Keep the mobile toss title inside its frame without clipping the font metrics.
const coinMarker='/* Production coin hotfix */'
if(!css.includes(coinMarker)) css+=`\n${coinMarker}\n@media(max-width:560px){\n .coin-choice-panel.mx-coin-waiting,.coin-panel-shell .coin-choice-panel.mx-coin-waiting{box-sizing:border-box!important;width:calc(100vw - 34px)!important;max-width:430px!important;padding:22px 16px!important;overflow:hidden!important}\n .coin-choice-panel.mx-coin-waiting h2,.coin-panel-shell .mx-coin-waiting h2{display:block!important;width:100%!important;max-width:100%!important;margin:0 auto!important;padding:.08em 0!important;font-size:clamp(20px,6.1vw,27px)!important;line-height:1.18!important;letter-spacing:0!important;white-space:normal!important;overflow:visible!important;overflow-wrap:normal!important;word-break:normal!important;text-align:center!important}\n .coin-stage-result .coin-result-banner{line-height:1.18!important;padding-block:11px!important;overflow:visible!important}\n}\n`

// DOM mutation observation is unreliable for DRAW because React can reuse the motion node.
// Dispatch from the actual motionFx state after the arena-flow duration patch has run.
const durationNeedle=`    const duration =\n      motionFx.kind === 'ENTER_VS' ? 400 :`
if(!app.includes("new CustomEvent('mega-x:motion'")){
  if(!app.includes(durationNeedle)) throw new Error('motionFx duration hook missing')
  app=app.replace(durationNeedle,`    window.dispatchEvent(new CustomEvent('mega-x:motion', { detail: { kind: motionFx.kind } }))\n${durationNeedle}`)
}

// Remove draw/entry/destroy DOM guesses from the previous audit helper. Attack stays tied
// to the actual impact layer; card movement comes directly from motionFx state.
audio=audio.replace(`      if (element.matches('.motion-card-fx.draw')) kind = 'draw'\n      else if (element.matches('.motion-card-fx.enter_vs, .motion-card-fx.support')) kind = 'enter'\n      else if (element.matches('.motion-card-fx.destroy')) kind = 'destroy'\n      else if (element.matches('.combat-screen-fx.stage-impact')) kind = 'attack'`,`      if (element.matches('.combat-screen-fx.stage-impact')) kind = 'attack'`)

if(!audio.includes("window.addEventListener('mega-x:motion'")){
  const hook=`    document.addEventListener('click', this.onClick, true)\n`
  if(!audio.includes(hook)) throw new Error('audio start hook missing')
  audio=audio.replace(hook,hook+`    window.addEventListener('mega-x:motion', this.onMotionSfx as EventListener)\n`)
}
if(!audio.includes('private onMotionSfx')){
  const hook=`  private onClick = (event: Event) => {`
  if(!audio.includes(hook)) throw new Error('audio click hook missing')
  const method=`  private onMotionSfx = (event: Event) => {\n    const kind = (event as CustomEvent<{ kind?: string }>).detail?.kind\n    if (kind === 'DRAW') this.playSfx('draw')\n    else if (kind === 'ENTER_VS' || kind === 'SUPPORT') this.playSfx('enter')\n    else if (kind === 'DESTROY') this.playSfx('destroy')\n    else if (kind === 'CAPTURE') this.playSfx('zonX')\n  }\n\n`
  audio=audio.replace(hook,method+hook)
}

// Replacement audio owns its own normalized per-event gain staging. Only retain the
// legacy fallback for older branches that do not yet define SFX_BASE_GAIN.
if(!audio.includes('SFX_BASE_GAIN')){
  const oldVolume=`audio.volume = this.settings.sfx; void audio.play()`
  const newVolume=`audio.volume = Math.min(1, this.settings.sfx * (({ card: 0.52, draw: 0.62, enter: 0.58, attack: 0.34, blocked: 0.42, destroy: 0.30 } as Partial<Record<MegaXSfx, number>>)[kind] ?? 0.7)); void audio.play()`
  if(!audio.includes(newVolume)){
    if(!audio.includes(oldVolume)) throw new Error('SFX volume assignment missing')
    audio=audio.replace(oldVolume,newVolume)
  }
}

fs.writeFileSync(appPath,app)
fs.writeFileSync(cssPath,css)
fs.writeFileSync(audioPath,audio)
console.log('Applied production jank hotfix: original coin motion, state-driven replacement audio, normalized gains, unclipped toss title')
