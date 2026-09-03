const MX_STUDIO_EMAIL = 'sector.seven.studio@outlook.com'

function normalizeTopRanks(root: ParentNode = document) {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.mx-rank-card'))
  for (const card of cards) {
    const text = (card.textContent ?? '').replace(/\s+/g, ' ').trim()
    const match = text.match(/^#\s*([1-3])\s+(.+?)\s+(\d+)\s*PTS\b/i)
    if (!match) continue
    const [, rank, name, pts] = match
    card.dataset.mxTopRankNormalized = 'true'
    card.classList.add('mx-top-rank-fixed')
    card.innerHTML = `
      <b class="mx-top-rank-number">#${rank}</b>
      <span class="mx-top-rank-name">${name}</span>
      <strong class="mx-top-rank-points">${pts} PTS</strong>
    `
  }
}

function ensureLobbyContactAndFooter() {
  const lobby = document.querySelector<HTMLElement>('.mx-commercial-lobby')
  if (!lobby) return

  let contact = lobby.querySelector<HTMLElement>('[data-mx-contact-bar]')
  if (!contact) {
    contact = document.createElement('section')
    contact.className = 'mx-lobby-contactbar'
    contact.dataset.mxContactBar = 'true'
    contact.setAttribute('aria-label', 'Sector Seven Studio contact')
    lobby.insertBefore(contact, lobby.firstChild)
  }
  contact.innerHTML = `<a class="mx-lobby-contact-button" href="mailto:${MX_STUDIO_EMAIL}" aria-label="Contact Sector Seven Studio">CONTACT US</a>`

  if (!lobby.querySelector('[data-mx-studio-footer]')) {
    const footer = document.createElement('footer')
    footer.className = 'mx-lobby-studio-footer'
    footer.dataset.mxStudioFooter = 'true'
    footer.innerHTML = `<strong>SECTOR SEVEN STUDIO</strong><span>© 2026 Sector Seven Studio. MEGA-X. All rights reserved.</span>`
    lobby.appendChild(footer)
  }

  normalizeTopRanks(lobby)
}

function runLobbyLastFixes() {
  ensureLobbyContactAndFooter()
  normalizeTopRanks()
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const boot = () => {
    runLobbyLastFixes()
    const observer = new MutationObserver(() => runLobbyLastFixes())
    observer.observe(document.body, { childList: true, subtree: true })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
}
