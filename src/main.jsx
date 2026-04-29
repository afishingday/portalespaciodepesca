import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './firebase.js'
import './index.css'
import App from './App.jsx'
import { TENANT } from './tenant.config.js'

document.title = TENANT.fullName || TENANT.name || document.title

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
