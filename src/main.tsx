import ReactDOM from 'react-dom/client'
import './index.css'
import './audio.ts'
import './lobby-ui.ts'
import App from './App.tsx'
import './arena-stage.css'
import './arena-action.css'
import './arena-stage.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />,
)
