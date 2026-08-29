export type AudioScene = 'silent' | 'lobby' | 'match'

type SceneProbe = { hasDuelShell: boolean; hasLobby: boolean }

type AudioSettings = {
  muted: boolean
  music: number
  sfx: number
  voice: number
}

const SETTINGS_KEY = 'mega-x-audio-v1'
const lobbySequence = [220, 277.18, 329.63, 277.18, 246.94, 329.63, 369.99, 329.63]
const matchSequence = [110, 146.83, 164.81, 196, 130.81, 174.61, 196, 220]

export function detectAudioScene(probe: SceneProbe): AudioScene {
  if (probe.hasDuelShell) return 'match'
  if (probe.hasLobby) return 'lobby'
  return 'silent'
}

export function announcementForText(text: string): string | null {
  const value = text.replace(/\s+/g, ' ').trim()
  if (!value) return null
  if (/SERANGAN DISEKAT/i.test(value)) return 'SERANGAN DISEKAT!'
  const round = value.match(/PUSINGAN\s+(\d+)/i)
  if (round) return `PUSINGAN ${round[1]}`
  if (/\bPASS\b/i.test(value)) return 'PASS!'
  if (/\bATTACK\b|\bSERANG\b/i.test(value)) return 'ATTACK!'
  if (/MATCH OVER|PERLAWANAN TAMAT/i.test(value)) return 'MATCH OVER!'
  if (/\bMENANG\b|\bWINNER\b/i.test(value)) return 'X FIGHTER WINS!'
  return null
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) throw new Error('missing')
    const parsed = JSON.parse(raw) as Partial<AudioSettings>
    return {
      muted: Boolean(parsed.muted),
      music: clamp01(Number(parsed.music ?? 0.34)),
      sfx: clamp01(Number(parsed.sfx ?? 0.7)),
      voice: clamp01(Number(parsed.voice ?? 0.8)),
    }
  } catch {
    return { muted: false, music: 0.34, sfx: 0.7, voice: 0.8 }
  }
}

class MegaXAudio {
  private ctx: AudioContext | null = null
  private unlocked = false
  private scene: AudioScene = 'silent'
  private musicTimer: number | null = null
  private musicStep = 0
  private observer: MutationObserver | null = null
  private lastAnnouncement = ''
  private lastAnnouncementAt = 0
  private settings = loadSettings()

  start() {
    this.mountControls()
    document.addEventListener('pointerdown', this.onFirstGesture, { once: true, capture: true })
    document.addEventListener('keydown', this.onFirstGesture, { once: true, capture: true })
    document.addEventListener('click', this.onClick, true)
    this.observer = new MutationObserver(this.onMutations)
    this.observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
    this.syncScene()
  }

  private onFirstGesture = () => {
    this.unlock()
  }

  private unlock() {
    if (this.unlocked) return
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return
    this.ctx = new AudioCtor()
    void this.ctx.resume()
    this.unlocked = true
    this.playSfx('ready')
    this.syncScene(true)
  }

  private detectScene(): AudioScene {
    return detectAudioScene({
      hasDuelShell: Boolean(document.querySelector('.duel-shell')),
      hasLobby: Boolean(document.querySelector('.mx-online-screen, .online-lobby, .mx-lobby, [data-screen="online"]')),
    })
  }

  private syncScene(force = false) {
    const next = this.detectScene()
    if (!force && next === this.scene) return
    this.scene = next
    this.musicStep = 0
    this.stopMusic()
    if (!this.unlocked || this.settings.muted || next === 'silent') return
    this.startMusic()
    if (next === 'match') this.announce('FIGHT!')
  }

  private startMusic() {
    this.tickMusic()
    this.musicTimer = window.setInterval(() => this.tickMusic(), this.scene === 'match' ? 300 : 520)
  }

  private stopMusic() {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer)
    this.musicTimer = null
  }

  private tickMusic() {
    if (!this.ctx || this.settings.muted || this.scene === 'silent') return
    const sequence = this.scene === 'match' ? matchSequence : lobbySequence
    const freq = sequence[this.musicStep % sequence.length]
    const isMatch = this.scene === 'match'
    this.tone(freq, isMatch ? 0.11 : 0.2, this.settings.music * (isMatch ? 0.22 : 0.16), isMatch ? 'sawtooth' : 'triangle')
    if (isMatch && this.musicStep % 2 === 0) this.tone(freq / 2, 0.08, this.settings.music * 0.12, 'square')
    if (isMatch && this.musicStep % 4 === 0) this.noise(0.035, this.settings.music * 0.08)
    this.musicStep += 1
  }

  private tone(freq: number, duration: number, volume: number, type: OscillatorType) {
    if (!this.ctx || volume <= 0) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(gain).connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + duration + 0.02)
  }

  private noise(duration: number, volume: number) {
    if (!this.ctx || volume <= 0) return
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * duration))
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
    const source = this.ctx.createBufferSource()
    const gain = this.ctx.createGain()
    gain.gain.value = volume
    source.buffer = buffer
    source.connect(gain).connect(this.ctx.destination)
    source.start()
  }

  private playSfx(kind: 'ready' | 'ui' | 'card' | 'attack' | 'pass' | 'blocked') {
    if (!this.unlocked || this.settings.muted || !this.ctx) return
    const v = this.settings.sfx
    if (kind === 'ready') { this.tone(440, 0.08, v * 0.18, 'square'); this.tone(659.25, 0.1, v * 0.14, 'triangle'); return }
    if (kind === 'ui') { this.tone(520, 0.045, v * 0.12, 'square'); return }
    if (kind === 'card') { this.tone(240, 0.06, v * 0.14, 'triangle'); this.noise(0.025, v * 0.05); return }
    if (kind === 'attack') { this.tone(92, 0.13, v * 0.25, 'sawtooth'); this.noise(0.08, v * 0.18); return }
    if (kind === 'pass') { this.tone(330, 0.07, v * 0.12, 'sine'); this.tone(247, 0.09, v * 0.1, 'sine'); return }
    this.tone(70, 0.18, v * 0.28, 'square'); this.noise(0.12, v * 0.22)
  }

  private announce(text: string) {
    if (!this.unlocked || this.settings.muted || this.settings.voice <= 0 || !('speechSynthesis' in window)) return
    const now = performance.now()
    if (text === this.lastAnnouncement && now - this.lastAnnouncementAt < 1400) return
    this.lastAnnouncement = text
    this.lastAnnouncementAt = now
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 0.72
    utterance.volume = this.settings.voice
    const voices = window.speechSynthesis.getVoices()
    utterance.voice = voices.find((voice) => /en-MY|ms-MY|en-GB|en-US/i.test(voice.lang)) ?? voices[0] ?? null
    window.speechSynthesis.speak(utterance)
  }

  private onClick = (event: Event) => {
    if (!this.unlocked) this.unlock()
    const target = event.target instanceof Element ? event.target.closest('button, .digital-card, .zone-card-button, .hand-card-wrap') : null
    if (!target) return
    const label = (target.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase()
    if (label.includes('ATTACK') || label === 'SERANG') { this.playSfx('attack'); this.announce('ATTACK!'); return }
    if (label === 'PASS') { this.playSfx('pass'); this.announce('PASS!'); return }
    if (target.matches('.digital-card, .zone-card-button, .hand-card-wrap') || target.querySelector('.digital-card')) { this.playSfx('card'); return }
    this.playSfx('ui')
  }

  private onMutations = (mutations: MutationRecord[]) => {
    let sceneMayHaveChanged = false
    for (const mutation of mutations) {
      if (mutation.type === 'childList') sceneMayHaveChanged = true
      const nodes = mutation.type === 'childList' ? Array.from(mutation.addedNodes) : [mutation.target]
      for (const node of nodes) {
        const text = node.textContent ?? ''
        const cue = announcementForText(text)
        if (!cue) continue
        if (cue === 'ATTACK!') this.playSfx('attack')
        else if (cue === 'PASS!') this.playSfx('pass')
        else if (cue === 'SERANGAN DISEKAT!') this.playSfx('blocked')
        else this.playSfx('ui')
        this.announce(cue)
      }
    }
    if (sceneMayHaveChanged) this.syncScene()
  }

  private saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
  }

  private mountControls() {
    if (document.getElementById('mx-audio-controls')) return
    const root = document.createElement('div')
    root.id = 'mx-audio-controls'
    root.className = 'mx-audio-controls'
    root.innerHTML = `<button type="button" data-audio-toggle aria-label="Audio settings">🔊</button><div data-audio-panel hidden><label>MUSIC <input data-audio-music type="range" min="0" max="100"></label><label>SFX <input data-audio-sfx type="range" min="0" max="100"></label><label>VOICE <input data-audio-voice type="range" min="0" max="100"></label><button type="button" data-audio-mute>MUTE</button></div>`
    Object.assign(root.style, { position: 'fixed', top: '10px', right: '10px', zIndex: '1500', fontFamily: 'Barlow Condensed, Impact, sans-serif' })
    const toggle = root.querySelector<HTMLButtonElement>('[data-audio-toggle]')!
    const panel = root.querySelector<HTMLElement>('[data-audio-panel]')!
    const mute = root.querySelector<HTMLButtonElement>('[data-audio-mute]')!
    const ranges = {
      music: root.querySelector<HTMLInputElement>('[data-audio-music]')!,
      sfx: root.querySelector<HTMLInputElement>('[data-audio-sfx]')!,
      voice: root.querySelector<HTMLInputElement>('[data-audio-voice]')!,
    }
    for (const [key, input] of Object.entries(ranges) as [keyof Pick<AudioSettings, 'music' | 'sfx' | 'voice'>, HTMLInputElement][]) {
      input.value = String(Math.round(this.settings[key] * 100))
      input.addEventListener('input', () => {
        this.settings[key] = Number(input.value) / 100
        this.saveSettings()
        if (key === 'music') this.syncScene(true)
      })
    }
    const refreshMute = () => {
      toggle.textContent = this.settings.muted ? '🔇' : '🔊'
      mute.textContent = this.settings.muted ? 'UNMUTE' : 'MUTE'
    }
    toggle.addEventListener('click', (event) => { event.stopPropagation(); panel.hidden = !panel.hidden; this.unlock() })
    mute.addEventListener('click', (event) => {
      event.stopPropagation()
      this.settings.muted = !this.settings.muted
      this.saveSettings()
      refreshMute()
      this.syncScene(true)
      if (this.settings.muted) window.speechSynthesis?.cancel()
    })
    root.addEventListener('click', (event) => event.stopPropagation())
    panel.style.cssText = 'margin-top:6px;display:grid;gap:6px;padding:10px;background:rgba(7,8,14,.94);border:1px solid rgba(255,255,255,.2);border-radius:10px;color:#fff;font-size:12px;min-width:170px;box-shadow:0 8px 28px rgba(0,0,0,.5)'
    toggle.style.cssText = 'width:38px;height:38px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(7,8,14,.9);color:#fff;cursor:pointer'
    mute.style.cssText = 'min-height:32px;border:1px solid rgba(255,255,255,.2);background:#171923;color:#fff;border-radius:7px;font-weight:800;cursor:pointer'
    refreshMute()
    document.body.appendChild(root)
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const boot = () => new MegaXAudio().start()
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
}
