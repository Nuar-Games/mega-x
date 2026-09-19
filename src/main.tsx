import ReactDOM from 'react-dom/client'
import './index.css'
import './audio.ts'
import './landing-ui.ts'
import './guest-practice-cta.ts'
import './landing-activation-fix.ts'
import './landing-polish.css'
import './lobby-ui.ts'
import App from './App.tsx'
import './arena-stage.css'
import './arena-premium.css'
import './arena-mobile-priority.css'
import './arena-usability.css'
import './arena-player-role.css'
import './arena-stage.ts'
import './arena-usability.ts'
import './arena-player-role.ts'
import './lobby-final.css'
import './lobby-last-fixes.ts'
import './lobby-last-fixes.css'
import './landing-bg-force.css'
import './landing-background-fallback.css'
import './landing-background-visible.css'
import './landing-cta-fighting.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />,
)


// Cache heavy card art locally so repeat play does not repeatedly consume host egress.
if ('serviceWorker' in navigator && (import.meta as any).env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
