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
    <Card className={`gap-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm ${className ?? ''}`.trim()}>
      <CardHeader className="flex flex-row items-start justify-between px-6 pb-4">
        <CardTitle className="font-semibold text-base text-gray-900 dark:text-white">{title}</CardTitle>
        {titleRight}
      </CardHeader>
      <CardContent className={`px-6 ${contentClassName ?? ''}`.trim()}>
        {children}
      </CardContent>
    </Card>
  )
}
