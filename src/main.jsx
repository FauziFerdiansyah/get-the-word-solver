import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { installAudioUnlock } from './utils/sound'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

// Audio has to be unlocked by a real gesture, and Safari only honours some
// events for it. Listening at the document keeps trying until it takes.
installAudioUnlock()

// Register the service worker, and use it as the update signal.
//
// There is no store and no update API for an installed web app. What does change
// on release is `CACHE_NAME` inside sw.js, which makes it a different file, so the
// browser installs a new worker. That is the moment a new build exists — the page
// still runs the old bundle until it reloads, so the app offers a reload.
//
// It matters most on iOS, where a home-screen app tends to stay open for days and
// never reloads by itself.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        const announce = () => window.dispatchEvent(new CustomEvent('ws-update-ready'))

        // A worker already waiting means this launch is running the old build.
        if (registration.waiting && navigator.serviceWorker.controller) announce()

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            // `controller` tells a first install apart from a genuine update.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              announce()
            }
          })
        })

        // Launching an installed app does not always re-check on its own.
        registration.update().catch(() => {})
      })
      .catch(err => {
        console.log('Service Worker registration failed:', err)
      })
  })
}
