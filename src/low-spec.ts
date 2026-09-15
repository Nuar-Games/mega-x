type NavigatorWithMemory = Navigator & { deviceMemory?: number }

const nav = navigator as NavigatorWithMemory
const memory = Number(nav.deviceMemory || 0)
const cores = Number(nav.hardwareConcurrency || 0)
const ua = navigator.userAgent || ''
const legacyWindows = /Windows NT 6\.[01]/.test(ua)
const compactScreen = Math.min(screen.width || 9999, screen.height || 9999) <= 768

// Conservative automatic fallback for genuinely constrained hardware.
// Modern/strong devices are left untouched.
const lowMemory = memory > 0 && memory <= 2
const veryLowCpu = cores > 0 && cores <= 2
const legacyCompactFallback = memory === 0 && legacyWindows && compactScreen

if (lowMemory || veryLowCpu || legacyCompactFallback) {
  document.documentElement.classList.add('mx-low-spec')
}
