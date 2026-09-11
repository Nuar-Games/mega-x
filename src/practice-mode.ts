export function startPractice() {
  document.documentElement.classList.add('mx-practice-active')
  window.dispatchEvent(new CustomEvent('mega-x:start-practice-match'))

  let arenaSeen = false
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

  const syncPracticeViewport = () => {
    const arena = document.querySelector('.duel-shell')
    if (arena) {
      arenaSeen = true
      isolateArenaBranch(arena)
      return
    }

    if (arenaSeen) {
      restoreHiddenSiblings()
      document.documentElement.classList.remove('mx-practice-active')
      observer.disconnect()
    }
  }

  const observer = new MutationObserver(syncPracticeViewport)
  observer.observe(document.body, { childList: true, subtree: true })
  queueMicrotask(syncPracticeViewport)
}
