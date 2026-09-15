let loading = false
let loaded = false

function shouldLoadArena() {
  return Boolean(document.querySelector('.duel-shell'))
}

function loadArena() {
  if (loaded || loading || !shouldLoadArena()) return
  loading = true
  import('./phaser-arena.ts')
    .then(() => {
      loaded = true
    })
    .finally(() => {
      loading = false
    })
}

const observer = new MutationObserver(loadArena)
observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true })
window.addEventListener('popstate', loadArena)
window.addEventListener('hashchange', loadArena)
loadArena()
