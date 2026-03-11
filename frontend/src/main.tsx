import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import { loadShade } from './shade/loader'

const queryClient = new QueryClient()

// Load ShadeCDN only when explicitly configured to avoid noisy network errors.
// Set `VITE_SHADECDN_URL` in a .env file to enable.
const shadeUrl = import.meta.env.VITE_SHADECDN_URL
if (shadeUrl) {
  loadShade(shadeUrl).catch(() => {
    console.warn('ShadeCDN failed to load; using native fallbacks')
  })
}

const root = document.getElementById('root')!
createRoot(root).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
)
