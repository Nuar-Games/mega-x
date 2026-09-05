import { ARENA_TRACKS, LOBBY_TRACK, MUSIC_ASSETS, SFX_ASSETS, type MegaXSfx } from './audio-assets.ts'

type AudioSettings = { muted: boolean; music: number; sfx: number }
type Scene = 'silent' | 'lobby' | 'coinToss' | 'match'
const SETTINGS_KEY = 'mega-x-audio-v8'
const ARENA_BAG_KEY = 'mega-x-arena-bag-v1'
const ARENA_LAST_KEY = 'mega-x-arena-last-v1'
const COIN_TOSS_GAIN = 0.78
const ARENA_GAIN = 0.58
const RESULT_GAIN = 0.9
const SFX_DUCK_GAIN = 0.56
const SFX_LIGHT_DUCK_GAIN = 0.72
const SFX_BASE_GAIN = 0.9
const COIN_FADE_MS = 700
const ARENA_FADE_IN_MS = 900
const ARENA_FADE_OUT_MS = 600

const SFX_GAIN: Partial<Record<MegaXSfx, number>> = {
  card: 0.95,
  draw: 1.25,
  enter: 1.0,
  vsEnter: 1.25,
  attack: 1.2,
  destroy: 1.0,
  zonX: 1.05,
  prompt: 1.0,
}

function clamp01(value: number) { return Math.max(0, Math.min(1, value)) }
function loadSettings(): AudioSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<AudioSettings>
    return { muted: Boolean(parsed.muted), music: clamp01(Number(parsed.music ?? 0.34)), sfx: clamp01(Number(parsed.sfx ?? 0.78)) }
  } catch { return { muted: false, music: 0.34, sfx: 0.78 } }
}

class MegaXAudio {
  private unlocked = false
  private settings = loadSettings()
  private sfxPool = new Map<MegaXSfx, HTMLAudioElement[]>()
  private music: HTMLAudioElement | null = null
  private scene: Scene = 'silent'
  private fadeTimer: number | null = null
  private duckTimer: number | null = null
  private arenaDuckGain = 1
  private arenaTrack: string | null = null
  private lastPrompt = ''
  private lastPromptAt = 0
  private resultPlayed = false

  start() {
    this.mountControls()
    document.addEventListener('pointerdown', () => this.unlock(), { once: true, capture: true })
    document.addEventListener('keydown', () => this.unlock(), { once: true, capture: true })
    document.addEventListener('click', this.onClick, true)
    window.addEventListener('mega-x:motion', this.onMotionSfx as EventListener)
    const observer = new MutationObserver(this.onMutations)
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
    this.syncScene()
  }

  private unlock() {
    if (this.unlocked) return
    this.unlocked = true
    this.syncScene(true)
  }

  private coinTossVisible() {
    if (document.querySelector('[class*="coin" i], [class*="toss" i], [data-screen*="coin" i], [data-screen*="toss" i]')) return true
    const text = (document.body?.textContent ?? '').replace(/\s+/g, ' ').toUpperCase()
    return /COIN\s*TOSS|TOSS\s*COIN|LAMBUNGAN\s*SYILING|BALING\s*SYILING|SYILING\s*DILAMBUNG/.test(text)
  }

  private detectScene(): Scene {
    if (document.querySelector('.duel-shell')) return 'match'
    if (this.coinTossVisible()) return 'coinToss'
    if (document.querySelector('.mx-online-screen, .online-lobby, .mx-lobby, [data-screen="online"]')) return 'lobby'
    return 'silent'
  }

  private syncScene(force = false) {
    const next = this.detectScene()
    if (!force && next === this.scene) return
    const previous = this.scene
    this.scene = next

    if (previous === 'match' && next !== 'match') this.resultPlayed = false

    if (previous === 'coinToss' && next === 'match' && this.music) {
      this.fadeOutMusic(COIN_FADE_MS, () => {
        if (this.scene !== 'match') return
        this.startSceneMusic('match')
      })
      return
    }

    if (previous === 'match' && next !== 'match' && this.music) {
      this.fadeOutMusic(ARENA_FADE_OUT_MS, () => {
        this.arenaTrack = null
        this.arenaDuckGain = 1
        if (this.scene === next) this.startSceneMusic(next)
      })
      return
    }

    this.stopMusic()
    if (previous === 'match' && next !== 'match') this.arenaTrack = null
    this.startSceneMusic(next)
  }

  private baseMusicVolume(scene = this.scene) {
    if (scene === 'coinToss') return this.settings.music * COIN_TOSS_GAIN
    if (scene === 'match') return this.settings.music * ARENA_GAIN
    return this.settings.music
  }

  private targetMusicVolume() { return this.baseMusicVolume() * (this.scene === 'match' ? this.arenaDuckGain : 1) }

  private startSceneMusic(scene: Scene) {
    if (!this.unlocked || this.settings.muted || scene === 'silent') return
    if (scene === 'match' && this.resultPlayed) return
    if (scene === 'lobby') {
      const audio = new Audio(LOBBY_TRACK); audio.loop = true; audio.preload = 'auto'; audio.volume = this.settings.music; this.music = audio; void audio.play().catch(() => undefined); return
    }
    if (scene === 'coinToss') {
      const audio = new Audio(MUSIC_ASSETS.coinToss); audio.loop = true; audio.preload = 'auto'; audio.volume = this.baseMusicVolume('coinToss'); this.music = audio; void audio.play().catch(() => undefined); return
    }
    if (!this.arenaTrack) this.arenaTrack = this.pickArenaTrack()
    const audio = new Audio(this.arenaTrack); audio.loop = true; audio.preload = 'auto'; audio.volume = 0; this.music = audio
    void audio.play().then(() => this.fadeInMusic(ARENA_FADE_IN_MS)).catch(() => undefined)
  }

  private playResultMusic() {
    if (this.resultPlayed || !this.unlocked || this.settings.muted) return
    this.resultPlayed = true
    this.stopMusic()
    const audio = new Audio(MUSIC_ASSETS.winLose)
    audio.loop = false
    audio.preload = 'auto'
    audio.volume = Math.min(1, this.settings.music * RESULT_GAIN)
    this.music = audio
    void audio.play().catch(() => undefined)
  }

  private pickArenaTrack() {
    const valid = ARENA_TRACKS.map((_, index) => index)
    let bag: number[] = []
    try { const parsed = JSON.parse(localStorage.getItem(ARENA_BAG_KEY) ?? '[]') as number[]; bag = parsed.filter((index) => Number.isInteger(index) && index >= 0 && index < ARENA_TRACKS.length) } catch { bag = [] }
    if (bag.length === 0) {
      bag = [...valid]
      for (let i = bag.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]] }
      const last = Number(localStorage.getItem(ARENA_LAST_KEY) ?? '-1')
      if (bag.length > 1 && bag[0] === last) [bag[0], bag[1]] = [bag[1], bag[0]]
    }
    const chosen = bag.shift() ?? 0
    localStorage.setItem(ARENA_BAG_KEY, JSON.stringify(bag)); localStorage.setItem(ARENA_LAST_KEY, String(chosen))
    return ARENA_TRACKS[chosen] ?? ARENA_TRACKS[0]
  }

  private fadeInMusic(duration: number) {
    const audio = this.music; if (!audio) return
    if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer)
    const started = performance.now()
    this.fadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / duration); audio.volume = Math.max(0, this.targetMusicVolume() * progress)
      if (progress >= 1) { if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer); this.fadeTimer = null }
    }, 40)
  }

  private fadeOutMusic(duration: number, done: () => void) {
    const audio = this.music; if (!audio) { done(); return }
    if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer)
    const started = performance.now(); const startVolume = audio.volume
    this.fadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / duration); audio.volume = Math.max(0, startVolume * (1 - progress))
      if (progress < 1) return
      if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer); this.fadeTimer = null
      try { audio.pause(); audio.currentTime = 0 } catch {}
      if (this.music === audio) this.music = null
      done()
    }, 40)
  }

  private duckArenaMusic(gain: number, durationMs = 0) {
    if (this.scene !== 'match' || !this.music || this.resultPlayed) return
    this.arenaDuckGain = Math.min(this.arenaDuckGain, gain); this.music.volume = this.targetMusicVolume()
    if (durationMs <= 0) return
    if (this.duckTimer !== null) window.clearTimeout(this.duckTimer)
    this.duckTimer = window.setTimeout(() => this.restoreArenaMusic(), durationMs)
  }

  private restoreArenaMusic() {
    if (this.duckTimer !== null) { window.clearTimeout(this.duckTimer); this.duckTimer = null }
    this.arenaDuckGain = 1
    if (this.scene === 'match' && this.music && !this.resultPlayed) this.music.volume = this.targetMusicVolume()
  }

  private stopMusic() {
    if (this.fadeTimer !== null) { window.clearInterval(this.fadeTimer); this.fadeTimer = null }
    if (this.duckTimer !== null) { window.clearTimeout(this.duckTimer); this.duckTimer = null }
    this.arenaDuckGain = 1
    if (!this.music) return
    try { this.music.pause(); this.music.currentTime = 0 } catch {}
    this.music = null
  }

  private preloadSfx(kind: MegaXSfx) {
    if (this.sfxPool.has(kind)) return
    this.sfxPool.set(kind, Array.from({ length: 3 }, () => { const audio = new Audio(SFX_ASSETS[kind]); audio.preload = 'auto'; return audio }))
  }

  private playSfx(kind: MegaXSfx) {
    if (!this.unlocked || this.settings.muted || this.settings.sfx <= 0) return
    if (this.scene === 'match') {
      if (kind === 'attack' || kind === 'destroy' || kind === 'zonX') this.duckArenaMusic(SFX_DUCK_GAIN, 650)
      else if (kind === 'draw' || kind === 'vsEnter' || kind === 'prompt') this.duckArenaMusic(SFX_LIGHT_DUCK_GAIN, 420)
    }
    this.preloadSfx(kind)
    const pool = this.sfxPool.get(kind) ?? []; const audio = pool.find((item) => item.paused || item.ended) ?? pool[0]; if (!audio) return
    const eventGain = SFX_GAIN[kind] ?? 1
    try { audio.pause(); audio.currentTime = 0; audio.volume = Math.min(1, this.settings.sfx * SFX_BASE_GAIN * eventGain); void audio.play().catch(() => undefined) } catch {}
  }

  private onMotionSfx = (event: Event) => {
    const kind = (event as CustomEvent<{ kind?: string }>).detail?.kind
    if (kind === 'DRAW') this.playSfx('draw')
    else if (kind === 'ENTER_VS') this.playSfx('vsEnter')
    else if (kind === 'SUPPORT') this.playSfx('enter')
    else if (kind === 'DESTROY') this.playSfx('destroy')
    else if (kind === 'CAPTURE') this.playSfx('zonX')
  }

  private onClick = (event: Event) => {
    if (!this.unlocked) this.unlock()
    else if (!this.settings.muted && !this.resultPlayed && this.scene !== 'silent' && (!this.music || this.music.paused)) { if (this.music?.paused) this.stopMusic(); this.startSceneMusic(this.scene) }
    const target = event.target instanceof Element ? event.target.closest('button, .digital-card, .mx3-effect, .mx3-hand-card') : null
    if (!target) return
    const label = (target.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase()
    if (label.includes('ATTACK') || /^SERANG!?$/.test(label)) { this.playSfx('attack'); return }
    if (target.matches('.digital-card, .mx3-effect, .mx3-hand-card') || target.querySelector('.digital-card')) this.playSfx('card')
  }

  private maybePlayPrompt(text: string) {
    const match = text.match(/PILIH\s+(?:KAD|VS|SASARAN|TARGET)|SELECT\s+(?:CARD|TARGET)|CHOOSE\s+(?:CARD|TARGET)/)
    if (!match) return
    const prompt = match[0]; const now = performance.now()
    if (prompt === this.lastPrompt && now - this.lastPromptAt < 1200) return
    this.lastPrompt = prompt; this.lastPromptAt = now; this.playSfx('prompt')
  }

  private maybePlayResult(text: string) {
    if (this.resultPlayed) return
    if (/PERLAWANAN\s+TAMAT|MENANG!?|KALAH|YOU\s+WIN|YOU\s+LOSE|ANDA\s+MENANG/.test(text)) this.playResultMusic()
  }

  private onMutations = (mutations: MutationRecord[]) => {
    if (mutations.some((mutation) => mutation.type === 'childList')) this.syncScene()
    for (const mutation of mutations) {
      const nodes = mutation.type === 'childList' ? Array.from(mutation.addedNodes) : [mutation.target]
      for (const node of nodes) {
        const text = (node.textContent ?? '').replace(/\s+/g, ' ').toUpperCase(); if (!text) continue
        this.maybePlayPrompt(text)
        this.maybePlayResult(text)
      }
    }
  }

  private saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)) }

  private mountControls() {
    if (document.getElementById('mx-audio-controls')) return
    const root = document.createElement('div'); root.id = 'mx-audio-controls'
    root.innerHTML = `<button type="button" data-audio-toggle aria-label="Audio settings">🔊</button><div data-audio-panel hidden><label>MUSIC <input data-audio-music type="range" min="0" max="100"></label><label>SFX <input data-audio-sfx type="range" min="0" max="100"></label><button type="button" data-audio-mute>MUTE</button></div>`
    Object.assign(root.style, { position: 'fixed', top: '10px', right: '10px', zIndex: '1500', fontFamily: 'Barlow Condensed, Impact, sans-serif' })
    const toggle = root.querySelector<HTMLButtonElement>('[data-audio-toggle]')!; const panel = root.querySelector<HTMLElement>('[data-audio-panel]')!; const mute = root.querySelector<HTMLButtonElement>('[data-audio-mute]')!
    const ranges = { music: root.querySelector<HTMLInputElement>('[data-audio-music]')!, sfx: root.querySelector<HTMLInputElement>('[data-audio-sfx]')! }
    for (const key of Object.keys(ranges) as Array<keyof typeof ranges>) {
      const input = ranges[key]; input.value = String(Math.round(this.settings[key] * 100))
      input.addEventListener('input', () => { this.settings[key] = Number(input.value) / 100; this.saveSettings(); if (key === 'music' && this.music) this.music.volume = this.resultPlayed ? Math.min(1, this.settings.music * RESULT_GAIN) : this.targetMusicVolume() })
    }
    const refresh = () => { toggle.textContent = this.settings.muted ? '🔇' : '🔊'; mute.textContent = this.settings.muted ? 'UNMUTE' : 'MUTE' }
    toggle.addEventListener('click', (event) => { event.stopPropagation(); panel.hidden = !panel.hidden; this.unlock() })
    mute.addEventListener('click', (event) => { event.stopPropagation(); this.settings.muted = !this.settings.muted; this.saveSettings(); refresh(); this.syncScene(true) })
    root.addEventListener('click', (event) => event.stopPropagation())
    panel.style.cssText = 'margin-top:6px;display:grid;gap:6px;padding:10px;background:rgba(7,8,14,.94);border:1px solid rgba(255,255,255,.2);border-radius:10px;color:#fff;font-size:12px;min-width:170px;box-shadow:0 8px 28px rgba(0,0,0,.5)'
    toggle.style.cssText = 'width:38px;height:38px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(7,8,14,.9);color:#fff;cursor:pointer'
    mute.style.cssText = 'min-height:32px;border:1px solid rgba(255,255,255,.2);background:#171923;color:#fff;border-radius:7px;font-weight:800;cursor:pointer'
    refresh(); document.body.appendChild(root)
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const boot = () => new MegaXAudio().start()
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
}
