import { useEffect, useState } from 'react'

interface ChartColors {
  foreground: string
  mutedForeground: string
  cardBackground: string
  cardBorder: string
}

function read(): ChartColors {
  const rootStyle = getComputedStyle(document.documentElement)
  return {
    foreground: rootStyle.getPropertyValue('--foreground').trim(),
    mutedForeground: rootStyle.getPropertyValue('--muted-foreground').trim(),
    cardBackground: rootStyle.getPropertyValue('--card').trim(),
    cardBorder: rootStyle.getPropertyValue('--border').trim(),
  }
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
