import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Desregistrar cualquier service worker anterior que pueda estar cacheando la app
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
