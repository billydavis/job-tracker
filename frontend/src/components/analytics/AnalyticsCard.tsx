import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface AnalyticsCardProps {
  title: string
  titleRight?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export default function AnalyticsCard({
  title,
  titleRight,
  children,
  className,
  contentClassName,
}: AnalyticsCardProps) {
  return (
    <Card
      className={`gap-0 border-white/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/55 backdrop-blur-md shadow-[0_10px_30px_-18px_rgba(15,23,42,0.55)] ${className ?? ''}`.trim()}
    >
      <CardHeader className="flex flex-row items-start justify-between px-6 pb-4">
        <CardTitle className="font-semibold text-base text-slate-900 dark:text-slate-100">{title}</CardTitle>
        {titleRight}
      </CardHeader>
      <CardContent className={`px-6 ${contentClassName ?? ''}`.trim()}>
        {children}
      </CardContent>
    </Card>
  )
}
