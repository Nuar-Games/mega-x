let playerRoleSyncQueued = false

function ensureRoleLabel(canvas: HTMLElement, side: 'left' | 'right') {
  const selector = `.mx3-role-label-${side}`
  let label = canvas.querySelector<HTMLElement>(selector)
  if (label) return label

  label = document.createElement('div')
  label.className = `mx3-role-label mx3-role-label-${side}`
  label.setAttribute('aria-live', 'polite')
  canvas.appendChild(label)
  return label
}

function syncPlayerRoleLabels() {
  const shell = document.querySelector<HTMLElement>('.duel-shell.mx3-stage')
  const canvas = shell?.querySelector<HTMLElement>('.mx3-canvas')
  if (!shell || !canvas) return

  const leftFighter = shell.querySelector<HTMLElement>('.mx3-fighter-left')
  const rightFighter = shell.querySelector<HTMLElement>('.mx3-fighter-right')
  if (!leftFighter || !rightFighter) return

  const leftActive = leftFighter.classList.contains('is-active')
  const rightActive = rightFighter.classList.contains('is-active')

  const leftLabel = ensureRoleLabel(canvas, 'left')
  const rightLabel = ensureRoleLabel(canvas, 'right')

  const leftText = leftActive ? 'PEMAIN' : 'LAWAN'
  const rightText = rightActive ? 'PEMAIN' : 'LAWAN'

  if (leftLabel.textContent !== leftText) leftLabel.textContent = leftText
  if (rightLabel.textContent !== rightText) rightLabel.textContent = rightText

  leftLabel.classList.toggle('is-player-turn', leftActive)
  rightLabel.classList.toggle('is-player-turn', rightActive)
}

function queuePlayerRoleSync() {
  if (playerRoleSyncQueued) return
  playerRoleSyncQueued = true
  window.requestAnimationFrame(() => {
    playerRoleSyncQueued = false
    syncPlayerRoleLabels()
  })
}

const playerRoleObserver = new MutationObserver(() => queuePlayerRoleSync())
playerRoleObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class'],
})

window.addEventListener('DOMContentLoaded', queuePlayerRoleSync, { once: true })
queuePlayerRoleSync()
