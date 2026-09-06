const MX_STUDIO_EMAIL = 'sector.seven.studio@outlook.com'

function ensureLobbyContactAndFooter() {
  const lobby = document.querySelector<HTMLElement>('.mx-commercial-lobby')
  if (!lobby) return

  if (!lobby.querySelector('[data-mx-contact-bar]')) {
    const contact = document.createElement('section')
    contact.className = 'mx-lobby-contactbar'
    contact.dataset.mxContactBar = 'true'
    contact.setAttribute('aria-label', 'Sector Seven Studio contact')
    contact.innerHTML = `<a class="mx-lobby-contact-button" href="mailto:${MX_STUDIO_EMAIL}" aria-label="Contact Sector Seven Studio">CONTACT US</a>`
    lobby.insertBefore(contact, lobby.firstChild)
  }

  if (!lobby.querySelector('[data-mx-studio-footer]')) {
    const footer = document.createElement('footer')
    footer.className = 'mx-lobby-studio-footer'
    footer.dataset.mxStudioFooter = 'true'
    footer.innerHTML = `<strong>SECTOR SEVEN STUDIO</strong><span>© 2026 Sector Seven Studio. MEGA-X. All rights reserved.</span>`
    lobby.appendChild(footer)
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const boot = () => {
    ensureLobbyContactAndFooter()
    const observer = new MutationObserver(() => ensureLobbyContactAndFooter())
    observer.observe(document.body, { childList: true, subtree: true })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
}
