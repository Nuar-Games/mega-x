import ReactDOM from 'react-dom/client'
import './index.css'
import './audio.ts'
import './landing-ui.ts'
import './landing-activation-fix.ts'
import './landing-polish.css'
import './lobby-ui.ts'
import App from './App.tsx'
import './arena-stage.css'
import './arena-stage.ts'
import './lobby-final.css'
import './landing-bg-force.css'
import './landing-background-fallback.css'
import './landing-background-visible.css'
import './landing-background-runtime.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />,
)
