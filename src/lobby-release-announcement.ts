const RELEASE_TITLE = 'MEGA X 1.0 — OFFICIALLY LAUNCHED'
const RELEASE_MESSAGE = 'Arena kini dibuka. Selamat datang, X Fighter.'

function applyReleaseAnnouncement() {
  const news = document.querySelector<HTMLElement>('[data-mx-news]')
  if (!news) return

  const feature = news.querySelector<HTMLElement>('.mx-news-feature')
  if (!feature) return

  const title = feature.querySelector<HTMLElement>('strong')
  const message = feature.querySelector<HTMLElement>('p')
  if (title && title.textContent !== RELEASE_TITLE) title.textContent = RELEASE_TITLE
  if (message && message.textContent !== RELEASE_MESSAGE) message.textContent = RELEASE_MESSAGE
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const boot = () => {
    applyReleaseAnnouncement()
    const observer = new MutationObserver(applyReleaseAnnouncement)
    observer.observe(document.documentElement, { childList: true, subtree: true })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
}
