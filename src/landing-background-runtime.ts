export {}

const applyMainBackground = () => {
  const img = document.querySelector<HTMLImageElement>('#mx-main-landing .mx-main-bg')
  if (!img) return false

  if (img.getAttribute('src') !== '/ui/landing/main-background.png') {
    img.setAttribute('src', '/ui/landing/main-background.png')
  }

  const force = (name: string, value: string) => img.style.setProperty(name, value, 'important')
  force('display', 'block')
  force('position', 'absolute')
  force('inset', '0')
  force('width', '100%')
  force('height', '100%')
  force('max-width', 'none')
  force('max-height', 'none')
  force('object-fit', 'cover')
  force('object-position', 'center center')
  force('z-index', '3')
  force('opacity', '1')
  force('visibility', 'visible')
  force('filter', 'saturate(1.08) contrast(1.04) brightness(.9)')
  force('transform', 'none')

  const vignette = document.querySelector<HTMLElement>('#mx-main-landing .mx-main-vignette')
  vignette?.style.setProperty('z-index', '4', 'important')
  return true
}

applyMainBackground()

const observer = new MutationObserver(() => {
  if (applyMainBackground()) observer.disconnect()
})
observer.observe(document.documentElement, { childList: true, subtree: true })

window.addEventListener('load', applyMainBackground, { once: true })
