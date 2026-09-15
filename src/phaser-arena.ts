import * as Phaser from 'phaser'

const SHELL_SELECTOR = '.duel-shell.mx3-stage'
const HOST_ID = 'mx-phaser-arena'

const BLUE = 0x39bfff
const RED = 0xff4969
const GOLD = 0xf4c04b
const PURPLE = 0xbb72ff
const GREEN = 0x4dde92

function textureKeyFor(source: string) {
  let hash = 2166136261
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `mx-card-${(hash >>> 0).toString(16)}`
}

class MegaXArenaScene extends Phaser.Scene {
  private backdrop?: Phaser.GameObjects.Graphics
  private cardLayer?: Phaser.GameObjects.Container

  constructor() {
    super('mega-x-arena')
  }

  create() {
    this.backdrop = this.add.graphics()
    this.backdrop.setDepth(-1000)
    this.cardLayer = this.add.container(0, 0).setDepth(20)
    this.drawArenaChrome()
    this.scale.on('resize', () => this.drawArenaChrome())
    this.time.delayedCall(40, () => this.drawArenaChrome())
  }

  redrawArena() {
    this.drawArenaChrome()
  }

  private drawBackdrop(g: Phaser.GameObjects.Graphics, width: number, height: number) {
    g.fillStyle(0x01040a, 1)
    g.fillRect(0, 0, width, height)

    const bands = 14
    for (let i = 0; i < bands; i += 1) {
      const t = i / Math.max(1, bands - 1)
      const top = height * (i / bands)
      const bandHeight = Math.ceil(height / bands) + 1
      const blue = Math.round(13 - t * 8)
      const green = Math.round(25 - t * 16)
      const red = Math.round(7 - t * 4)
      const color = (red << 16) | (green << 8) | blue
      g.fillStyle(color, 1)
      g.fillRect(0, top, width, bandHeight)
    }

    const sideWidth = Math.max(40, width * 0.18)
    for (let i = 0; i < 6; i += 1) {
      const alpha = 0.035 * (1 - i / 6)
      g.fillStyle(BLUE, alpha)
      g.fillRect(i * sideWidth / 6, 0, sideWidth / 6 + 2, height)
      g.fillStyle(RED, alpha)
      g.fillRect(width - (i + 1) * sideWidth / 6, 0, sideWidth / 6 + 2, height)
    }

    g.lineStyle(1, 0x7fd8ff, 0.045)
    const stepX = Math.max(58, Math.round(width / 14))
    const stepY = Math.max(58, Math.round(height / 18))
    for (let x = 0; x <= width; x += stepX) g.lineBetween(x, 0, x, height)
    for (let y = 0; y <= height; y += stepY) g.lineBetween(0, y, width, y)

    const safe = Math.max(10, Math.min(width, height) * 0.018)
    g.lineStyle(2, 0x9edfff, 0.22)
    g.lineBetween(safe, safe, safe + 72, safe)
    g.lineBetween(safe, safe, safe, safe + 72)
    g.lineBetween(width - safe, safe, width - safe - 72, safe)
    g.lineBetween(width - safe, safe, width - safe, safe + 72)
    g.lineBetween(safe, height - safe, safe + 72, height - safe)
    g.lineBetween(safe, height - safe, safe, height - safe - 72)
    g.lineBetween(width - safe, height - safe, width - safe - 72, height - safe)
    g.lineBetween(width - safe, height - safe, width - safe, height - safe - 72)
  }

  private rectFor(selector: string): DOMRect | null {
    const element = currentShell?.querySelector<HTMLElement>(selector)
    if (!element) return null
    const rect = element.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) return null
    return rect
  }

  private drawZoneFrame(selector: string, stroke: number, fill: number, fillAlpha = 0.22, radius = 12) {
    const g = this.backdrop
    const rect = this.rectFor(selector)
    if (!g || !rect) return

    g.fillStyle(fill, fillAlpha)
    g.fillRoundedRect(rect.left, rect.top, rect.width, rect.height, Math.min(radius, rect.width / 5, rect.height / 5))
    g.lineStyle(2, stroke, 0.74)
    g.strokeRoundedRect(rect.left + 1, rect.top + 1, Math.max(0, rect.width - 2), Math.max(0, rect.height - 2), Math.min(radius, rect.width / 5, rect.height / 5))
    g.lineStyle(1, 0xffffff, 0.08)
    g.strokeRoundedRect(rect.left + 4, rect.top + 4, Math.max(0, rect.width - 8), Math.max(0, rect.height - 8), Math.max(2, radius - 3))
  }

  private drawCombatLane(g: Phaser.GameObjects.Graphics, width: number, height: number) {
    const left = this.rectFor('.mx3-vs-left')
    const right = this.rectFor('.mx3-vs-right')
    if (!left || !right) {
      const laneWidth = Math.min(width * 0.72, 900)
      const laneHeight = Math.min(height * 0.46, 620)
      const x = (width - laneWidth) / 2
      const y = height * 0.38
      g.fillStyle(0x07182a, 0.58)
      g.fillRoundedRect(x, y, laneWidth, laneHeight, 28)
      g.lineStyle(2, 0x318ccc, 0.28)
      g.strokeRoundedRect(x, y, laneWidth, laneHeight, 28)
      return
    }

    const leftEdge = Math.max(8, left.left - 28)
    const rightEdge = Math.min(width - 8, right.right + 28)
    const top = Math.max(8, Math.min(left.top, right.top) - 34)
    const bottom = Math.min(height - 8, Math.max(left.bottom, right.bottom) + 160)
    const laneWidth = Math.max(1, rightEdge - leftEdge)
    const laneHeight = Math.max(1, bottom - top)

    g.fillStyle(0x061522, 0.82)
    g.fillRoundedRect(leftEdge, top, laneWidth, laneHeight, 26)
    g.lineStyle(2, 0x4ab8f5, 0.24)
    g.strokeRoundedRect(leftEdge, top, laneWidth, laneHeight, 26)

    const center = width / 2
    g.lineStyle(2, GOLD, 0.24)
    g.lineBetween(center - Math.min(120, laneWidth * 0.18), top + laneHeight / 2, center + Math.min(120, laneWidth * 0.18), top + laneHeight / 2)
    g.fillStyle(GOLD, 0.12)
    g.fillCircle(center, top + laneHeight / 2, 34)
  }

  private syncCardSprites() {
    const layer = this.cardLayer
    if (!layer || !currentShell) return

    layer.removeAll(true)
    currentShell.querySelectorAll<HTMLImageElement>('img.mx-phaser-card-mirrored').forEach((image) => image.classList.remove('mx-phaser-card-mirrored'))

    const images = currentShell.querySelectorAll<HTMLImageElement>('.mx3-canvas .digital-card, .mx3-canvas .mx3-card-back img, .mx3-canvas .mx3-master-core img, .mx3-canvas .mx3-vs img')
    images.forEach((image) => {
      if (!image.complete || image.naturalWidth < 2 || image.naturalHeight < 2) return
      const rect = image.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2 || rect.bottom <= 0 || rect.right <= 0 || rect.top >= window.innerHeight || rect.left >= window.innerWidth) return

      const source = image.currentSrc || image.src
      if (!source) return
      const textureKey = textureKeyFor(source)
      if (!this.textures.exists(textureKey)) this.textures.addImage(textureKey, image)
      if (!this.textures.exists(textureKey)) return

      const sprite = this.add.image(rect.left + rect.width / 2, rect.top + rect.height / 2, textureKey)
      sprite.setDisplaySize(rect.width, rect.height)
      layer.add(sprite)
      image.classList.add('mx-phaser-card-mirrored')
    })
  }

  private drawArenaChrome() {
    const g = this.backdrop
    if (!g) return
    const width = this.scale.width
    const height = this.scale.height

    g.clear()
    this.drawBackdrop(g, width, height)
    this.drawCombatLane(g, width, height)

    this.drawZoneFrame('.mx3-fighter-left', BLUE, 0x08263d, 0.7, 12)
    this.drawZoneFrame('.mx3-fighter-right', RED, 0x35101a, 0.7, 12)
    this.drawZoneFrame('.mx3-status', GOLD, 0x1b1a12, 0.72, 10)
    this.drawZoneFrame('.mx3-quit', RED, 0x351018, 0.74, 10)
    this.drawZoneFrame('.mx3-audio', BLUE, 0x071d31, 0.74, 10)

    this.drawZoneFrame('.mx3-p1-x', GOLD, 0x2b2208, 0.62, 10)
    this.drawZoneFrame('.mx3-p1-discard', GOLD, 0x2b1a07, 0.62, 10)
    this.drawZoneFrame('.mx3-master', GREEN, 0x08281a, 0.62, 10)
    this.drawZoneFrame('.mx3-p2-discard', GOLD, 0x2b1a07, 0.62, 10)
    this.drawZoneFrame('.mx3-p2-x', GOLD, 0x2b2208, 0.62, 10)

    this.drawZoneFrame('.mx3-vs-left', BLUE, 0x071f34, 0.72, 14)
    this.drawZoneFrame('.mx3-vs-right', RED, 0x32101a, 0.72, 14)
    this.drawZoneFrame('.mx3-effects-left', PURPLE, 0x1d0c2e, 0.34, 12)
    this.drawZoneFrame('.mx3-effects-right', PURPLE, 0x1d0c2e, 0.34, 12)
    this.drawZoneFrame('.mx3-local-hand', BLUE, 0x071928, 0.35, 14)
    this.drawZoneFrame('.mx3-opponent-hand', RED, 0x240c14, 0.28, 14)
    this.drawZoneFrame('.mx3-phase-prompt', GOLD, 0x281f09, 0.7, 12)
    this.drawZoneFrame('.mx3-timer', GOLD, 0x1b170b, 0.7, 999)
    this.drawZoneFrame('.mx3-center-vs', GOLD, 0x18130a, 0.46, 999)

    currentShell?.querySelectorAll<HTMLElement>('.mx3-effect').forEach((node) => {
      const rect = node.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) return
      g.fillStyle(0x160923, 0.54)
      g.fillRoundedRect(rect.left, rect.top, rect.width, rect.height, 8)
      g.lineStyle(1, PURPLE, 0.42)
      g.strokeRoundedRect(rect.left + 1, rect.top + 1, Math.max(0, rect.width - 2), Math.max(0, rect.height - 2), 8)
    })

    currentShell?.querySelectorAll<HTMLElement>('.mx3-stats > div').forEach((node) => {
      const rect = node.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) return
      g.fillStyle(0x071722, 0.72)
      g.fillRoundedRect(rect.left, rect.top, rect.width, rect.height, 8)
      g.lineStyle(1, BLUE, 0.32)
      g.strokeRoundedRect(rect.left + 1, rect.top + 1, Math.max(0, rect.width - 2), Math.max(0, rect.height - 2), 8)
    })

    this.syncCardSprites()
  }
}

let game: Phaser.Game | null = null
let currentShell: HTMLElement | null = null
let redrawQueued = false

function destroyArena() {
  currentShell?.querySelectorAll<HTMLImageElement>('img.mx-phaser-card-mirrored').forEach((image) => image.classList.remove('mx-phaser-card-mirrored'))
  currentShell?.classList.remove('mx-phaser-rendered')
  game?.destroy(true)
  game = null
  currentShell = null
  document.getElementById(HOST_ID)?.remove()
}

function requestChromeRedraw() {
  if (!game || redrawQueued) return
  redrawQueued = true
  requestAnimationFrame(() => {
    redrawQueued = false
    const scene = game?.scene.getScene('mega-x-arena') as MegaXArenaScene | undefined
    scene?.redrawArena()
  })
}

function mountArena() {
  const shell = document.querySelector<HTMLElement>(SHELL_SELECTOR)
  if (!shell) {
    if (game) destroyArena()
    return
  }

  if (game && currentShell === shell) {
    requestChromeRedraw()
    return
  }
  if (game) destroyArena()

  const host = document.createElement('div')
  host.id = HOST_ID
  host.setAttribute('aria-hidden', 'true')
  shell.prepend(host)
  shell.classList.add('mx-phaser-rendered')
  currentShell = shell

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    transparent: true,
    render: {
      antialias: true,
      roundPixels: true,
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    scene: MegaXArenaScene,
    banner: false,
  })
}

let queued = false
const observer = new MutationObserver(() => {
  if (queued) return
  queued = true
  requestAnimationFrame(() => {
    queued = false
    mountArena()
  })
})

observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
window.addEventListener('resize', requestChromeRedraw, { passive: true })
window.addEventListener('orientationchange', requestChromeRedraw)
mountArena()
