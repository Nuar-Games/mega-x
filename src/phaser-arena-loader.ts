let loading = false
let loaded = false

function shouldLoadArena() {
  return Boolean(document.querySelector('.duel-shell'))
}

async function loadArena() {
  if (loaded || loading || !shouldLoadArena()) return
  loading = true
  try {
    await Promise.all([
      import('./arena-stage.css'),
      import('./arena-premium.css'),
      import('./arena-mobile-priority.css'),
      import('./arena-usability.css'),
      import('./arena-player-role.css'),
      import('./phaser-arena.css'),
      import('./arena-art-assets.css'),
      import('./arena-player-facing.css'),
      import('./arena-stage.ts'),
      import('./arena-usability.ts'),
      import('./arena-player-role.ts'),
    ])
    await import('./phaser-arena.ts')
    loaded = true
  } finally {
    loading = false
  }
}

const arenaLoadObserver = new MutationObserver(loadArena)
arenaLoadObserver.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true })
window.addEventListener('popstate', loadArena)
window.addEventListener('hashchange', loadArena)
loadArena()
