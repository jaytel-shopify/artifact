'use client'

import { useAuth } from './AuthProvider'

export default function UserAvatar() {
  const { user } = useAuth()
  
  if (!user) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
        ?
      </div>
    )
  }

  const displayName = user.fullName || user.email
  const initials = displayName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)

  // Use Slack image if available
  if (user.slackImageUrl) {
    return (
      <img
        src={user.slackImageUrl}
        alt={displayName}
        className="w-8 h-8 rounded-full"
        title={displayName}
      />
    )
  }

  return (
    <div 
      className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium"
      title={displayName}
    >
      {initials}
    </div>
  )
}
