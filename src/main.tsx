import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import { initStorage } from './lib/storage'

async function bootstrap() {
  try {
    // Hydrate in-memory cache from IndexedDB before rendering.
    await initStorage()
  } catch (error) {
    console.error('Storage initialization failed, continuing with in-memory fallbacks.', error)
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
