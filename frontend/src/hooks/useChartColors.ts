import { useEffect, useState } from 'react'

interface ChartColors {
  foreground: string
  mutedForeground: string
  cardBackground: string
  cardBorder: string
}

const LIGHT: ChartColors = {
  foreground: '#111827',
  mutedForeground: '#6b7280',
  cardBackground: '#ffffff',
  cardBorder: '#e5e7eb',
}

const DARK: ChartColors = {
  foreground: '#f9fafb',
  mutedForeground: '#9ca3af',
  cardBackground: '#1f2937',
  cardBorder: '#374151',
}

function read(): ChartColors {
  return document.documentElement.classList.contains('dark') ? DARK : LIGHT
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(read)

  useEffect(() => {
    const observer = new MutationObserver(() => setColors(read()))
    observer.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return colors
}
