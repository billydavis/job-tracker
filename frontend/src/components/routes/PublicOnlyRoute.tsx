import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { User } from '../../types'

interface Props {
  user: User | null | undefined
  redirectTo?: string
  children: ReactNode
}

export default function PublicOnlyRoute({ user, redirectTo = '/dashboard', children }: Props) {
  if (user) return <Navigate to={redirectTo} replace />
  return <>{children}</>
}
