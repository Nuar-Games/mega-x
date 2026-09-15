import * as Phaser from 'phaser'

const SHELL_SELECTOR = '.duel-shell'
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

    const portrait = height >= width
    const horizon = portrait ? height * 0.46 : height * 0.52
    g.fillStyle(0x071728, 1)
    g.fillRect(0, 0, width, horizon)
    g.fillStyle(0x02070d, 1)
    g.fillRect(0, horizon, width, height - horizon)

    const glowRadius = Math.max(width, height) * 0.72
    for (let i = 5; i >= 1; i -= 1) {
      g.fillStyle(0x0877bb, 0.018 * i)
      g.fillCircle(width / 2, height * 0.56, glowRadius * i / 5)
    }

    g.lineStyle(1, 0x7fd8ff, 0.045)
    const stepX = Math.max(64, Math.round(width / 12))
    const stepY = Math.max(64, Math.round(height / 16))
    for (let x = 0; x <= width; x += stepX) g.lineBetween(x, 0, x, height)
    for (let y = 0; y <= height; y += stepY) g.lineBetween(0, y, width, y)

    const rail = Math.max(8, Math.min(width, height) * 0.014)
    g.lineStyle(2, 0x78ccff, 0.28)
    g.strokeRoundedRect(rail, rail, width - rail * 2, height - rail * 2, 20)

    const seamX = width / 2
    const laneTop = portrait ? height * 0.20 : height * 0.16
    const laneBottom = portrait ? height * 0.77 : height * 0.80
    g.fillStyle(0x071726, 0.78)
    g.fillRoundedRect(width * 0.13, laneTop, width * 0.74, laneBottom - laneTop, 26)
    g.lineStyle(2, 0x3d9bd3, 0.28)
    g.strokeRoundedRect(width * 0.13, laneTop, width * 0.74, laneBottom - laneTop, 26)
    g.lineStyle(2, GOLD, 0.2)
    g.lineBetween(seamX, laneTop + 18, seamX, laneBottom - 18)
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
    g.lineStyle(2, stroke, 0.7)
    g.strokeRoundedRect(rect.left + 1, rect.top + 1, Math.max(0, rect.width - 2), Math.max(0, rect.height - 2), Math.min(radius, rect.width / 5, rect.height / 5))
  }

  private syncCardSprites() {
    const layer = this.cardLayer
    if (!layer || !currentShell) return

    layer.removeAll(true)
    currentShell.querySelectorAll<HTMLImageElement>('img.mx-phaser-card-mirrored').forEach((image) => image.classList.remove('mx-phaser-card-mirrored'))

    const images = currentShell.querySelectorAll<HTMLImageElement>('.digital-card, .mx3-card-back img, .mx3-master-core img, .mx3-vs img')
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

    this.drawZoneFrame('.mx3-fighter-left', BLUE, 0x08263d, 0.68, 12)
    this.drawZoneFrame('.mx3-fighter-right', RED, 0x35101a, 0.68, 12)
    this.drawZoneFrame('.mx3-status', GOLD, 0x1b1a12, 0.66, 10)
    this.drawZoneFrame('.mx3-quit', RED, 0x351018, 0.72, 10)
    this.drawZoneFrame('.mx3-audio', BLUE, 0x071d31, 0.72, 10)
    this.drawZoneFrame('.mx3-p1-x', GOLD, 0x2b2208, 0.58, 10)
    this.drawZoneFrame('.mx3-p1-discard', GOLD, 0x2b1a07, 0.58, 10)
    this.drawZoneFrame('.mx3-master', GREEN, 0x08281a, 0.58, 10)
    this.drawZoneFrame('.mx3-p2-discard', GOLD, 0x2b1a07, 0.58, 10)
    this.drawZoneFrame('.mx3-p2-x', GOLD, 0x2b2208, 0.58, 10)
    this.drawZoneFrame('.mx3-vs-left', BLUE, 0x071f34, 0.7, 14)
    this.drawZoneFrame('.mx3-vs-right', RED, 0x32101a, 0.7, 14)
    this.drawZoneFrame('.mx3-effects-left', PURPLE, 0x1d0c2e, 0.3, 12)
    this.drawZoneFrame('.mx3-effects-right', PURPLE, 0x1d0c2e, 0.3, 12)
    this.drawZoneFrame('.mx3-local-hand', BLUE, 0x071928, 0.3, 14)
    this.drawZoneFrame('.mx3-opponent-hand', RED, 0x240c14, 0.24, 14)
    this.drawZoneFrame('.mx3-phase-prompt', GOLD, 0x281f09, 0.68, 12)
    this.drawZoneFrame('.mx3-timer', GOLD, 0x1b170b, 0.68, 999)
    this.drawZoneFrame('.mx3-center-vs', GOLD, 0x18130a, 0.42, 999)

    this.syncCardSprites()
  }
}

let game: Phaser.Game | null = null
let currentShell: HTMLElement | null = null
let redrawQueued = false
let shellObserver: MutationObserver | null = null
let resizeObserver: ResizeObserver | null = null

function destroyArena() {
  shellObserver?.disconnect()
  resizeObserver?.disconnect()
  shellObserver = null
  resizeObserver = null
  currentShell?.querySelectorAll<HTMLImageElement>('img.mx-phaser-card-mirrored').forEach((image) => image.classList.remove('mx-phaser-card-mirrored'))
  currentShell?.classList.remove('mx-phaser-rendered')
  document.body.classList.remove('mx3-arena-present')
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

  if (game && currentShell === shell) return
  if (game) destroyArena()

  const host = document.createElement('div')
  host.id = HOST_ID
  host.setAttribute('aria-hidden', 'true')
  shell.prepend(host)
  shell.classList.add('mx-phaser-rendered')
  document.body.classList.add('mx3-arena-present')
  currentShell = shell

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    transparent: true,
    render: { antialias: true, roundPixels: true },
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    scene: MegaXArenaScene,
    banner: false,
  })

  shellObserver = new MutationObserver(() => requestChromeRedraw())
  shellObserver.observe(shell, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'src'] })
  resizeObserver = new ResizeObserver(() => requestChromeRedraw())
  resizeObserver.observe(shell)
}

const rootObserver = new MutationObserver(() => mountArena())
rootObserver.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true })
window.addEventListener('resize', requestChromeRedraw, { passive: true })
window.addEventListener('orientationchange', requestChromeRedraw)
mountArena()
