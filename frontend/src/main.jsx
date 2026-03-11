import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { loadShade } from './shade/loader'

// Load ShadeCDN only when explicitly configured to avoid noisy network errors.
// Set `VITE_SHADECDN_URL` in a .env file to enable (e.g. VITE_SHADECDN_URL="https://cdn.shade.dev/shade.min.js").
const shadeUrl = import.meta.env.VITE_SHADECDN_URL
if (shadeUrl) {
    loadShade(shadeUrl).catch(() => {
        // non-fatal: app will use native fallbacks
        console.warn('ShadeCDN failed to load; using native fallbacks')
    })
}

const root = document.getElementById('root')
createRoot(root).render(<App />)
