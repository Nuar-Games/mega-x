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
    const portrait = height >= width
    const minSide = Math.min(width, height)
    const cx = width / 2
    const cy = portrait ? height * 0.455 : height * 0.50

    g.fillStyle(0x02050a, 1)
    g.fillRect(0, 0, width, height)

    g.fillStyle(0x06111d, 1)
    g.fillRect(0, 0, width, portrait ? height * 0.18 : height * 0.16)
    g.fillStyle(0x03080f, 1)
    g.fillRect(0, portrait ? height * 0.82 : height * 0.84, width, height)

    const glowRadius = Math.max(width, height) * 0.52
    for (let i = 7; i >= 1; i -= 1) {
      g.fillStyle(0x0b76ba, 0.0105 * i)
      g.fillCircle(cx, cy, glowRadius * i / 7)
    }

    g.lineStyle(1, 0x85d9ff, 0.045)
    const stepX = Math.max(70, Math.round(width / 14))
    const stepY = Math.max(70, Math.round(height / 18))
    for (let x = -height; x <= width + height; x += stepX) {
      g.lineBetween(x, 0, x + height * 0.28, height)
    }
    for (let y = 0; y <= height; y += stepY) g.lineBetween(0, y, width, y)

    const topCut = portrait ? height * 0.145 : height * 0.125
    const bottomCut = portrait ? height * 0.855 : height * 0.875
    g.lineStyle(2, BLUE, 0.42)
    g.lineBetween(width * 0.04, topCut, width * 0.34, topCut)
    g.lineBetween(width * 0.66, topCut, width * 0.96, topCut)
    g.lineStyle(2, RED, 0.34)
    g.lineBetween(width * 0.04, bottomCut, width * 0.34, bottomCut)
    g.lineBetween(width * 0.66, bottomCut, width * 0.96, bottomCut)

    const rail = Math.max(8, minSide * 0.014)
    g.lineStyle(2, 0x78ccff, 0.32)
    g.strokeRoundedRect(rail, rail, width - rail * 2, height - rail * 2, 20)
    g.lineStyle(1, GOLD, 0.18)
    g.strokeRoundedRect(rail + 5, rail + 5, width - (rail + 5) * 2, height - (rail + 5) * 2, 16)
  }

  private drawCombatLane(g: Phaser.GameObjects.Graphics, width: number, height: number) {
    const portrait = height >= width
    const laneTop = portrait ? height * 0.235 : height * 0.205
    const laneBottom = portrait ? height * 0.635 : height * 0.745
    const laneX = portrait ? width * 0.075 : width * 0.16
    const laneWidth = width - laneX * 2
    const laneHeight = laneBottom - laneTop
    const cx = width / 2
    const cy = (laneTop + laneBottom) / 2

    g.fillStyle(0x07131f, 0.93)
    g.fillRoundedRect(laneX, laneTop, laneWidth, laneHeight, 28)
    g.lineStyle(2, 0x4ba6dc, 0.34)
    g.strokeRoundedRect(laneX, laneTop, laneWidth, laneHeight, 28)

    const leftPanelW = portrait ? width * 0.34 : width * 0.25
    const gap = portrait ? width * 0.08 : width * 0.10
    const cardTop = laneTop + laneHeight * 0.12
    const cardH = laneHeight * 0.76
    const leftX = cx - gap / 2 - leftPanelW
    const rightX = cx + gap / 2

    g.fillStyle(0x071f34, 0.72)
    g.fillRoundedRect(leftX, cardTop, leftPanelW, cardH, 20)
    g.lineStyle(2, BLUE, 0.50)
    g.strokeRoundedRect(leftX, cardTop, leftPanelW, cardH, 20)

    g.fillStyle(0x301019, 0.72)
    g.fillRoundedRect(rightX, cardTop, leftPanelW, cardH, 20)
    g.lineStyle(2, RED, 0.50)
    g.strokeRoundedRect(rightX, cardTop, leftPanelW, cardH, 20)

    g.lineStyle(2, GOLD, 0.26)
    g.lineBetween(cx, laneTop + 18, cx, laneBottom - 18)

    for (let i = 5; i >= 1; i -= 1) {
      g.fillStyle(GOLD, 0.016 * i)
      g.fillCircle(cx, cy, Math.max(26, Math.min(width, height) * 0.055) * i / 5)
    }
    g.lineStyle(2, GOLD, 0.65)
    g.strokeCircle(cx, cy, Math.max(24, Math.min(width, height) * 0.042))
    g.lineStyle(1, 0xffffff, 0.26)
    g.strokeCircle(cx, cy, Math.max(18, Math.min(width, height) * 0.033))

    const bayW = portrait ? width * 0.12 : width * 0.065
    const bayGap = portrait ? height * 0.008 : height * 0.014
    const bayH = Math.max(28, (cardH - bayGap * 4) / 5)
    for (let i = 0; i < 5; i += 1) {
      const y = cardTop + i * (bayH + bayGap)
      g.fillStyle(PURPLE, 0.075)
      g.fillRoundedRect(laneX + 8, y, bayW, bayH, 8)
      g.fillRoundedRect(laneX + laneWidth - bayW - 8, y, bayW, bayH, 8)
      g.lineStyle(1, PURPLE, 0.26)
      g.strokeRoundedRect(laneX + 8, y, bayW, bayH, 8)
      g.strokeRoundedRect(laneX + laneWidth - bayW - 8, y, bayW, bayH, 8)
    }
  }

  private drawPlayerFrames(g: Phaser.GameObjects.Graphics, width: number, height: number) {
    const portrait = height >= width
    const topY = portrait ? height * 0.07 : height * 0.075
    const bottomY = portrait ? height * 0.735 : height * 0.79
    const hudH = portrait ? height * 0.09 : height * 0.11
    const margin = portrait ? width * 0.04 : width * 0.025

    g.fillStyle(0x061826, 0.82)
    g.fillRoundedRect(margin, topY, width - margin * 2, hudH, 18)
    g.lineStyle(2, BLUE, 0.28)
    g.strokeRoundedRect(margin, topY, width - margin * 2, hudH, 18)

    g.fillStyle(0x12090d, 0.80)
    g.fillRoundedRect(margin, bottomY, width - margin * 2, hudH, 18)
    g.lineStyle(2, RED, 0.24)
    g.strokeRoundedRect(margin, bottomY, width - margin * 2, hudH, 18)

    const handTop = portrait ? height * 0.835 : height * 0.865
    const handH = height - handTop - Math.max(10, height * 0.018)
    g.fillStyle(0x06111c, 0.88)
    g.fillRoundedRect(margin, handTop, width - margin * 2, handH, 20)
    g.lineStyle(2, BLUE, 0.36)
    g.strokeRoundedRect(margin, handTop, width - margin * 2, handH, 20)
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
    g.lineStyle(2, stroke, 0.62)
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
    this.drawCombatLane(g, width, height)
    this.drawPlayerFrames(g, width, height)

    this.drawZoneFrame('.mx3-fighter-left', BLUE, 0x08263d, 0.54, 12)
    this.drawZoneFrame('.mx3-fighter-right', RED, 0x35101a, 0.54, 12)
    this.drawZoneFrame('.mx3-status', GOLD, 0x1b1a12, 0.52, 10)
    this.drawZoneFrame('.mx3-quit', RED, 0x351018, 0.58, 10)
    this.drawZoneFrame('.mx3-audio', BLUE, 0x071d31, 0.58, 10)
    this.drawZoneFrame('.mx3-p1-x', GOLD, 0x2b2208, 0.42, 10)
    this.drawZoneFrame('.mx3-p1-discard', GOLD, 0x2b1a07, 0.42, 10)
    this.drawZoneFrame('.mx3-master', GREEN, 0x08281a, 0.42, 10)
    this.drawZoneFrame('.mx3-p2-discard', GOLD, 0x2b1a07, 0.42, 10)
    this.drawZoneFrame('.mx3-p2-x', GOLD, 0x2b2208, 0.42, 10)
    this.drawZoneFrame('.mx3-vs-left', BLUE, 0x071f34, 0.34, 18)
    this.drawZoneFrame('.mx3-vs-right', RED, 0x32101a, 0.34, 18)
    this.drawZoneFrame('.mx3-effects-left', PURPLE, 0x1d0c2e, 0.18, 12)
    this.drawZoneFrame('.mx3-effects-right', PURPLE, 0x1d0c2e, 0.18, 12)
    this.drawZoneFrame('.mx3-local-hand', BLUE, 0x071928, 0.16, 16)
    this.drawZoneFrame('.mx3-opponent-hand', RED, 0x240c14, 0.14, 14)
    this.drawZoneFrame('.mx3-phase-prompt', GOLD, 0x281f09, 0.46, 12)
    this.drawZoneFrame('.mx3-timer', GOLD, 0x1b170b, 0.54, 999)
    this.drawZoneFrame('.mx3-center-vs', GOLD, 0x18130a, 0.20, 999)

    this.syncCardSprites()
  }
}

let game: Phaser.Game | null = null
let currentShell: HTMLElement | null = null
let redrawQueued = false
let shellObserver: MutationObserver | null = null
let resizeObserver: ResizeObserver | null = null
let syncTimer: number | null = null

function destroyArena() {
  shellObserver?.disconnect()
  resizeObserver?.disconnect()
  shellObserver = null
  resizeObserver = null
  if (syncTimer !== null) window.clearTimeout(syncTimer)
  syncTimer = null
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

function requestArenaSync() {
  if (syncTimer !== null) return
  syncTimer = window.setTimeout(() => {
    syncTimer = null
    requestChromeRedraw()
  }, 32)
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

  shellObserver = new MutationObserver(() => requestArenaSync())
  shellObserver.observe(shell, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] })
  resizeObserver = new ResizeObserver(() => requestArenaSync())
  resizeObserver.observe(shell)
}

const rootObserver = new MutationObserver(() => mountArena())
rootObserver.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true })
window.addEventListener('resize', requestArenaSync, { passive: true })
window.addEventListener('orientationchange', requestArenaSync)
mountArena()
