import * as Phaser from 'phaser'

const SHELL_SELECTOR = '.duel-shell.mx3-stage'
const HOST_ID = 'mx-phaser-arena'

class MegaXArenaScene extends Phaser.Scene {
  private backdrop?: Phaser.GameObjects.Graphics

  constructor() {
    super('mega-x-arena')
  }

  create() {
    this.backdrop = this.add.graphics()
    this.backdrop.setDepth(-1000)
    this.redraw(this.scale.width, this.scale.height)
    this.scale.on('resize', (size: Phaser.Structs.Size) => this.redraw(size.width, size.height))
  }

  private redraw(width: number, height: number) {
    const g = this.backdrop
    if (!g) return

    g.clear()
    g.fillStyle(0x01040a, 1)
    g.fillRect(0, 0, width, height)

    g.fillStyle(0x06111f, 1)
    g.fillRect(0, 0, width, Math.max(height * 0.52, 1))

    g.fillStyle(0x02070d, 1)
    g.fillRect(0, height * 0.52, width, height * 0.48)

    const cx = width / 2
    const cy = height * 0.58
    const radius = Math.max(width, height) * 0.68
    for (let i = 5; i >= 1; i -= 1) {
      g.fillStyle(0x0d5d99, 0.018 * i)
      g.fillCircle(cx, cy, radius * (i / 5))
    }

    g.lineStyle(1, 0x5cbfff, 0.09)
    const stepX = Math.max(56, Math.round(width / 14))
    const stepY = Math.max(56, Math.round(height / 18))
    for (let x = 0; x <= width; x += stepX) g.lineBetween(x, 0, x, height)
    for (let y = 0; y <= height; y += stepY) g.lineBetween(0, y, width, y)

    const laneWidth = Math.min(width * 0.72, 900)
    const laneHeight = Math.min(height * 0.48, 620)
    g.fillStyle(0x092039, 0.28)
    g.fillRoundedRect(cx - laneWidth / 2, cy - laneHeight / 2, laneWidth, laneHeight, 24)
    g.lineStyle(2, 0x2e8dcc, 0.16)
    g.strokeRoundedRect(cx - laneWidth / 2, cy - laneHeight / 2, laneWidth, laneHeight, 24)

    g.lineStyle(2, 0xf0b53a, 0.12)
    g.lineBetween(cx - laneWidth * 0.42, cy, cx + laneWidth * 0.42, cy)
  }
}

let game: Phaser.Game | null = null
let currentShell: HTMLElement | null = null

function destroyArena() {
  game?.destroy(true)
  game = null
  currentShell = null
  document.getElementById(HOST_ID)?.remove()
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

observer.observe(document.documentElement, { childList: true, subtree: true })
mountArena()
