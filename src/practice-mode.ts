export function startPractice() {
  document.documentElement.classList.add('mx-practice-active')
  window.dispatchEvent(new CustomEvent('mega-x:start-practice-match'))

  let arenaSeen = false
  let arenaNode: Element | null = null
  const hiddenSiblings = new Map<HTMLElement, string | null>()

  const isolateArenaBranch = (arena: Element) => {
    const root = document.getElementById('root')
    let node: HTMLElement | null = arena as HTMLElement

    while (node && node !== root) {
      const parent: HTMLElement | null = node.parentElement
      if (!parent) break

      for (const sibling of Array.from(parent.children)) {
        if (sibling === node || !(sibling instanceof HTMLElement)) continue
        if (!hiddenSiblings.has(sibling)) hiddenSiblings.set(sibling, sibling.getAttribute('style'))
        sibling.style.setProperty('display', 'none', 'important')
      }

      node = parent
    }
  }

  const restoreHiddenSiblings = () => {
    for (const [element, previousStyle] of hiddenSiblings) {
      if (previousStyle === null) element.removeAttribute('style')
      else element.setAttribute('style', previousStyle)
    }
    hiddenSiblings.clear()
  }

  const quitPractice = (event: MouseEvent) => {
    if (!document.documentElement.classList.contains('mx-practice-active')) return
    const target = event.target instanceof Element ? event.target.closest('button') : null
    if (!target || target.textContent?.trim().toUpperCase() !== 'QUIT MATCH') return

    event.preventDefault()
    event.stopImmediatePropagation()
    restoreHiddenSiblings()
    document.documentElement.classList.remove('mx-practice-active')
    observer.disconnect()
    window.location.reload()
  }

  const syncPracticeViewport = () => {
    if (arenaSeen) {
      if (arenaNode?.isConnected) return

      restoreHiddenSiblings()
      document.documentElement.classList.remove('mx-practice-active')
      document.removeEventListener('click', quitPractice, true)
      observer.disconnect()
      return
    }

    const arena = document.querySelector('.duel-shell')
    if (!arena) return

    arenaSeen = true
    arenaNode = arena
    isolateArenaBranch(arena)
  }

  const observer = new MutationObserver(syncPracticeViewport)
  document.addEventListener('click', quitPractice, true)
  observer.observe(document.body, { childList: true, subtree: true })
  queueMicrotask(syncPracticeViewport)
}
