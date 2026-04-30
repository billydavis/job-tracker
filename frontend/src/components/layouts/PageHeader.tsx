import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: ReactNode
  actions?: ReactNode
  className?: string
}

export default function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={`rounded-2xl border border-white/70 dark:border-white/10 bg-white/65 dark:bg-slate-900/50 backdrop-blur-md px-5 py-4 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.6)] ${className ?? ''}`.trim()}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          {eyebrow ? <div className="mb-2">{eyebrow}</div> : null}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          {description ? (
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </section>
  )
}
