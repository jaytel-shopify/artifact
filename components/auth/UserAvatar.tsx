'use client'

import { useAuth } from './AuthProvider'

export default function UserAvatar() {
  const { user } = useAuth()
  
  const displayName = user?.user_metadata?.full_name || user?.email || 'User'
  const initials = displayName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)

  return (
    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
      {initials}
    </div>
  )
}
