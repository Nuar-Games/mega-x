export function startPractice() {
  document.documentElement.classList.add('mx-practice-active')
  window.dispatchEvent(new CustomEvent('mega-x:start-practice-match'))

  let arenaSeen = false
  const syncPracticeViewport = () => {
    const arena = document.querySelector('.duel-shell')
    if (arena) arenaSeen = true
    if (arenaSeen && !arena) {
      document.documentElement.classList.remove('mx-practice-active')
      observer.disconnect()
    }
  }
  const observer = new MutationObserver(syncPracticeViewport)
  observer.observe(document.body, { childList: true, subtree: true })
  queueMicrotask(syncPracticeViewport)
}
