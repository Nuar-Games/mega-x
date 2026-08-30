import { ARENA_TRACKS, LOBBY_PLAYLIST, MUSIC_ASSETS, SFX_ASSETS, VOICE_ASSETS, type MegaXSfx, type MegaXVoice } from './audio-assets.ts'

type AudioSettings = { muted: boolean; music: number; sfx: number; voice: number }
type Scene = 'silent' | 'lobby' | 'coinToss' | 'match'
const SETTINGS_KEY = 'mega-x-audio-v6'
const ARENA_BAG_KEY = 'mega-x-arena-bag-v1'
const ARENA_LAST_KEY = 'mega-x-arena-last-v1'
const COIN_TOSS_GAIN = 0.78
const ARENA_GAIN = 0.58
const VOICE_DUCK_GAIN = 0.5
const SFX_DUCK_GAIN = 0.7
const COIN_FADE_MS = 700
const ARENA_FADE_IN_MS = 900
const ARENA_FADE_OUT_MS = 600

function clamp01(value: number) { return Math.max(0, Math.min(1, value)) }
function loadSettings(): AudioSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<AudioSettings>
    return { muted: Boolean(parsed.muted), music: clamp01(Number(parsed.music ?? 0.34)), sfx: clamp01(Number(parsed.sfx ?? 0.78)), voice: clamp01(Number(parsed.voice ?? 0.9)) }
  } catch { return { muted: false, music: 0.34, sfx: 0.78, voice: 0.9 } }
}

class MegaXAudio {
  private unlocked = false
  private settings = loadSettings()
  private sfxPool = new Map<MegaXSfx, HTMLAudioElement[]>()
  private voicePool = new Map<MegaXVoice, HTMLAudioElement>()
  private music: HTMLAudioElement | null = null
  private scene: Scene = 'silent'
  private lobbyTrackIndex = 0
  private lobbyPreloads = new Map<number, HTMLAudioElement>()
  private fadeTimer: number | null = null
  private duckTimer: number | null = null
  private arenaDuckGain = 1
  private arenaTrack: string | null = null
  private lastVoice = ''
  private lastVoiceAt = 0

  start() {
    this.mountControls()
    document.addEventListener('pointerdown', () => this.unlock(), { once: true, capture: true })
    document.addEventListener('keydown', () => this.unlock(), { once: true, capture: true })
    document.addEventListener('click', this.onClick, true)
    const observer = new MutationObserver(this.onMutations)
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
    this.syncScene()
  }

  private unlock() {
    if (this.unlocked) return
    this.unlocked = true
    // Mobile-first: unlock immediately, but do not create dozens of remote Audio
    // elements at once. SFX/voice are loaded lazily on first use.
    this.preloadSfx('ready')
    this.playSfx('ready')
    this.syncScene(true)
  }

  private coinTossVisible() {
    if (document.querySelector('[class*="coin" i], [class*="toss" i], [data-screen*="coin" i], [data-screen*="toss" i]')) return true
    // textContent avoids the forced layout/reflow cost of innerText during animated screens.
    const text = (document.body?.textContent ?? '').replace(/\s+/g, ' ').toUpperCase()
    return /COIN\s*TOSS|TOSS\s*COIN|LAMBUNGAN\s*SYILING|BALING\s*SYILING|SYILING\s*DILAMBUNG/.test(text)
  }

  private detectScene(): Scene {
    if (this.coinTossVisible()) return 'coinToss'
    if (document.querySelector('.duel-shell')) return 'match'
    if (document.querySelector('.mx-online-screen, .online-lobby, .mx-lobby, [data-screen="online"]')) return 'lobby'
    return 'silent'
  }

  private syncScene(force = false) {
    const next = this.detectScene()
    if (!force && next === this.scene) return
    const previous = this.scene
    this.scene = next

    if (previous === 'coinToss' && next === 'match' && this.music) {
      this.fadeOutMusic(COIN_FADE_MS, () => { if (this.scene === 'match') this.startSceneMusic('match') })
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

  private targetMusicVolume() {
    return this.baseMusicVolume() * (this.scene === 'match' ? this.arenaDuckGain : 1)
  }

  private startSceneMusic(scene: Scene) {
    if (!this.unlocked || this.settings.muted || scene === 'silent') return
    if (scene === 'lobby') { this.playLobbyTrack(this.lobbyTrackIndex); return }

    if (scene === 'coinToss') {
      const audio = new Audio(MUSIC_ASSETS.coinToss)
      audio.loop = true
      audio.preload = 'auto'
      audio.volume = this.baseMusicVolume('coinToss')
      this.music = audio
      void audio.play().catch(() => undefined)
      return
    }

    if (!this.arenaTrack) this.arenaTrack = this.pickArenaTrack()
    const audio = new Audio(this.arenaTrack)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0
    this.music = audio
    void audio.play().then(() => this.fadeInMusic(ARENA_FADE_IN_MS)).catch(() => undefined)
    this.playVoice('fight')
  }

  private pickArenaTrack() {
    const valid = ARENA_TRACKS.map((_, index) => index)
    let bag: number[] = []
    try {
      const parsed = JSON.parse(localStorage.getItem(ARENA_BAG_KEY) ?? '[]') as number[]
      bag = parsed.filter((index) => Number.isInteger(index) && index >= 0 && index < ARENA_TRACKS.length)
    } catch { bag = [] }

    if (bag.length === 0) {
      bag = [...valid]
      for (let i = bag.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[bag[i], bag[j]] = [bag[j], bag[i]]
      }
      const last = Number(localStorage.getItem(ARENA_LAST_KEY) ?? '-1')
      if (bag.length > 1 && bag[0] === last) [bag[0], bag[1]] = [bag[1], bag[0]]
    }

    const chosen = bag.shift() ?? 0
    localStorage.setItem(ARENA_BAG_KEY, JSON.stringify(bag))
    localStorage.setItem(ARENA_LAST_KEY, String(chosen))
    return ARENA_TRACKS[chosen] ?? ARENA_TRACKS[0]
  }

  private playLobbyTrack(index: number) {
    if (this.scene !== 'lobby' || this.settings.muted) return
    this.lobbyTrackIndex = index % LOBBY_PLAYLIST.length
    const audio = new Audio(LOBBY_PLAYLIST[this.lobbyTrackIndex])
    audio.preload = 'auto'
    audio.volume = this.settings.music
    audio.addEventListener('ended', () => { if (this.scene === 'lobby') this.playLobbyTrack((this.lobbyTrackIndex + 1) % LOBBY_PLAYLIST.length) }, { once: true })
    audio.addEventListener('playing', () => this.preloadNextLobbyTrack(), { once: true })
    this.music = audio
    void audio.play().catch(() => undefined)
  }

  private preloadNextLobbyTrack() {
    const nextIndex = (this.lobbyTrackIndex + 1) % LOBBY_PLAYLIST.length
    if (this.scene !== 'lobby' || this.lobbyPreloads.has(nextIndex)) return
    const run = () => {
      if (this.scene !== 'lobby' || this.lobbyPreloads.has(nextIndex)) return
      const preload = new Audio(LOBBY_PLAYLIST[nextIndex])
      preload.preload = 'auto'
      preload.load()
      this.lobbyPreloads.set(nextIndex, preload)
    }
    const idle = Reflect.get(window, 'requestIdleCallback') as ((cb: () => void, opts?: { timeout: number }) => number) | undefined
    if (typeof idle === 'function') idle.call(window, run, { timeout: 1800 })
    else window.setTimeout(run, 900)
  }

  private fadeInMusic(duration: number) {
    const audio = this.music
    if (!audio) return
    if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer)
    const started = performance.now()
    this.fadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / duration)
      audio.volume = Math.max(0, this.targetMusicVolume() * progress)
      if (progress < 1) return
      if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer)
      this.fadeTimer = null
    }, 40)
  }

  private fadeOutMusic(duration: number, done: () => void) {
    const audio = this.music
    if (!audio) { done(); return }
    if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer)
    const started = performance.now()
    const startVolume = audio.volume
    this.fadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / duration)
      audio.volume = Math.max(0, startVolume * (1 - progress))
      if (progress < 1) return
      if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer)
      this.fadeTimer = null
      try { audio.pause(); audio.currentTime = 0 } catch { /* no gameplay impact */ }
      if (this.music === audio) this.music = null
      done()
    }, 40)
  }

  private duckArenaMusic(gain: number, durationMs = 0) {
    if (this.scene !== 'match' || !this.music) return
    this.arenaDuckGain = Math.min(this.arenaDuckGain, gain)
    this.music.volume = this.targetMusicVolume()
    if (durationMs <= 0) return
    if (this.duckTimer !== null) window.clearTimeout(this.duckTimer)
    this.duckTimer = window.setTimeout(() => this.restoreArenaMusic(), durationMs)
  }

  private restoreArenaMusic() {
    if (this.duckTimer !== null) { window.clearTimeout(this.duckTimer); this.duckTimer = null }
    this.arenaDuckGain = 1
    if (this.scene === 'match' && this.music) this.music.volume = this.targetMusicVolume()
  }

  private stopMusic() {
    if (this.fadeTimer !== null) { window.clearInterval(this.fadeTimer); this.fadeTimer = null }
    if (this.duckTimer !== null) { window.clearTimeout(this.duckTimer); this.duckTimer = null }
    this.arenaDuckGain = 1
    if (!this.music) return
    try { this.music.pause(); this.music.currentTime = 0 } catch { /* no gameplay impact */ }
    this.music = null
  }

  private preloadSfx(kind: MegaXSfx) {
    if (this.sfxPool.has(kind)) return
    this.sfxPool.set(kind, Array.from({ length: 3 }, () => { const audio = new Audio(SFX_ASSETS[kind]); audio.preload = 'auto'; return audio }))
  }
  private preloadVoice(kind: MegaXVoice) {
    if (this.voicePool.has(kind)) return
    const audio = new Audio(VOICE_ASSETS[kind]); audio.preload = 'auto'; this.voicePool.set(kind, audio)
  }
  private playSfx(kind: MegaXSfx) {
    if (!this.unlocked || this.settings.muted || this.settings.sfx <= 0) return
    if (this.scene === 'match' && (kind === 'attack' || kind === 'blocked' || kind === 'destroy')) this.duckArenaMusic(SFX_DUCK_GAIN, 420)
    this.preloadSfx(kind)
    const pool = this.sfxPool.get(kind) ?? []
    const audio = pool.find((item) => item.paused || item.ended) ?? pool[0]
    if (!audio) return
    try { audio.pause(); audio.currentTime = 0; audio.volume = this.settings.sfx; void audio.play().catch(() => undefined) } catch { /* no gameplay impact */ }
  }
  private playVoice(kind: MegaXVoice) {
    if (!this.unlocked || this.settings.muted || this.settings.voice <= 0) return
    const now = performance.now()
    if (this.lastVoice === kind && now - this.lastVoiceAt < 1300) return
    this.lastVoice = kind; this.lastVoiceAt = now; this.preloadVoice(kind)
    const audio = this.voicePool.get(kind)
    if (!audio) return
    if (this.scene === 'match') {
      this.duckArenaMusic(VOICE_DUCK_GAIN)
      const restore = () => this.restoreArenaMusic()
      audio.addEventListener('ended', restore, { once: true })
      audio.addEventListener('error', restore, { once: true })
      window.setTimeout(restore, 3500)
    }
    try { audio.pause(); audio.currentTime = 0; audio.volume = this.settings.voice; void audio.play().catch(() => this.restoreArenaMusic()) } catch { this.restoreArenaMusic() }
  }

  private onClick = (event: Event) => {
    if (!this.unlocked) this.unlock()
    const target = event.target instanceof Element ? event.target.closest('button, .digital-card, .zone-card-button, .hand-card-wrap') : null
    if (!target) return
    const label = (target.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase()
    if (label.includes('ATTACK') || label === 'SERANG') { this.playSfx('attack'); return }
    if (label === 'PASS') { this.playSfx('pass'); return }
    if (target.matches('.digital-card, .zone-card-button, .hand-card-wrap') || target.querySelector('.digital-card')) { this.playSfx('card'); return }
    this.playSfx('ui')
  }

  private onMutations = (mutations: MutationRecord[]) => {
    let sceneChanged = false
    for (const mutation of mutations) {
      if (mutation.type === 'childList') sceneChanged = true
      const nodes = mutation.type === 'childList' ? Array.from(mutation.addedNodes) : [mutation.target]
      for (const node of nodes) {
        const text = (node.textContent ?? '').replace(/\s+/g, ' ').toUpperCase()
        if (text.includes('SERANGAN DISEKAT')) this.playSfx('blocked')
        if (text.includes('DIMUSNAHKAN') || text.includes('DESTROY')) this.playSfx('destroy')
        if (/PUSINGAN\s*1|ROUND\s*1/.test(text)) this.playVoice('round1')
        else if (/PUSINGAN\s*2|ROUND\s*2/.test(text)) this.playVoice('round2')
        else if (/PUSINGAN\s*3|ROUND\s*3/.test(text)) this.playVoice('round3')
        else if (/PUSINGAN\s*4|ROUND\s*4/.test(text)) this.playVoice('round4')
        else if (/PUSINGAN\s*5|ROUND\s*5/.test(text)) this.playVoice('round5')
        if (/\bWINNER\b|\bPEMENANG\b/.test(text)) this.playVoice('winner')
        if (/YOU WIN|ANDA MENANG/.test(text)) this.playVoice('youWin')
        if (/YOU LOSE|ANDA KALAH/.test(text)) this.playVoice('youLose')
        if (/GAME OVER|PERLAWANAN TAMAT/.test(text)) this.playVoice('gameOver')
      }
    }
    if (sceneChanged) this.syncScene()
  }

  private saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)) }
  private mountControls() {
    if (document.getElementById('mx-audio-controls')) return
    const root = document.createElement('div')
    root.id = 'mx-audio-controls'
    root.innerHTML = `<button type="button" data-audio-toggle aria-label="Audio settings">🔊</button><div data-audio-panel hidden><label>MUSIC <input data-audio-music type="range" min="0" max="100"></label><label>SFX <input data-audio-sfx type="range" min="0" max="100"></label><label>VOICE <input data-audio-voice type="range" min="0" max="100"></label><button type="button" data-audio-mute>MUTE</button></div>`
    Object.assign(root.style, { position: 'fixed', top: '10px', right: '10px', zIndex: '1500', fontFamily: 'Barlow Condensed, Impact, sans-serif' })
    const toggle = root.querySelector<HTMLButtonElement>('[data-audio-toggle]')!
    const panel = root.querySelector<HTMLElement>('[data-audio-panel]')!
    const mute = root.querySelector<HTMLButtonElement>('[data-audio-mute]')!
    const ranges = { music: root.querySelector<HTMLInputElement>('[data-audio-music]')!, sfx: root.querySelector<HTMLInputElement>('[data-audio-sfx]')!, voice: root.querySelector<HTMLInputElement>('[data-audio-voice]')! }
    for (const key of Object.keys(ranges) as Array<keyof typeof ranges>) {
      const input = ranges[key]
      input.value = String(Math.round(this.settings[key] * 100))
      input.addEventListener('input', () => {
        this.settings[key] = Number(input.value) / 100
        this.saveSettings()
        if (key === 'music' && this.music) this.music.volume = this.targetMusicVolume()
      })
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
