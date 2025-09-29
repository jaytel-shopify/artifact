'use client'

import { Card, CardFooter } from '@/components/ui/card'
import ArtifactThumbnail from './ArtifactThumbnail'
import type { Artifact } from '@/types'
import { SPRING_TRANSITIONS } from '@/lib/easings'

interface ProjectCoverData {
  id: string
  name: string
  share_token: string
  created_at: string
  updated_at: string
  settings: any
  coverArtifacts: Artifact[]
}

interface ProjectCardProps {
  project: ProjectCoverData
  onClick: () => void
  onDelete?: () => void
}

function ProjectCover({ artifacts }: { artifacts: Artifact[] }) {
  const count = artifacts.length

  if (count === 0) {
    return (
      <div className="w-full flex-1 flex items-center justify-center">
        <span className="text-gray-500 text-sm">No artifacts</span>
      </div>
    )
  }

  if (count === 1) {
    return (
      <div className="w-full flex-1 flex items-center justify-center p-6">
        <div className="w-32 h-32 transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1" 
             style={{ transitionTimingFunction: 'var(--spring-elegant-easing-light)' }}>
          <ArtifactThumbnail artifact={artifacts[0]} />
        </div>
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="w-full flex-1 relative flex items-center justify-center p-4">
        {/* Background artifact */}
        <div className="absolute w-32 h-32 transform rotate-6 translate-x-3 translate-y-2 opacity-80 transition-transform duration-500 group-hover:rotate-8 group-hover:translate-x-4 group-hover:translate-y-1 group-hover:scale-105"
             style={{ transitionTimingFunction: 'var(--spring-elegant-easing-light)' }}>
          <ArtifactThumbnail artifact={artifacts[1]} />
        </div>
        {/* Foreground artifact */}
        <div className="relative w-32 h-32 transform -rotate-3 -translate-x-2 -translate-y-2 z-10 transition-transform duration-500 group-hover:-rotate-5 group-hover:-translate-x-3 group-hover:-translate-y-3 group-hover:scale-105"
             style={{ transitionTimingFunction: 'var(--spring-elegant-easing-light)' }}>
          <ArtifactThumbnail artifact={artifacts[0]} />
        </div>
      </div>
    )
  }

  // 3+ artifacts - fan layout
  return (
    <div className="w-full flex-1 relative flex items-center justify-center p-3">
      {/* Third artifact (bottom) */}
      <div className="absolute w-32 h-32 transform rotate-12 translate-x-6 translate-y-3 opacity-70 transition-transform duration-500 group-hover:rotate-15 group-hover:translate-x-8 group-hover:translate-y-2 group-hover:scale-105"
           style={{ transitionTimingFunction: 'var(--spring-elegant-easing-light)' }}>
        <ArtifactThumbnail artifact={artifacts[2]} />
      </div>
      {/* Second artifact (middle) */}
      <div className="absolute w-32 h-32 transform rotate-6 translate-x-2 translate-y-1 opacity-85 transition-transform duration-500 group-hover:rotate-9 group-hover:translate-x-3 group-hover:-translate-y-1 group-hover:scale-105"
           style={{ transitionTimingFunction: 'var(--spring-elegant-easing-light)' }}>
        <ArtifactThumbnail artifact={artifacts[1]} />
      </div>
      {/* First artifact (top) */}
      <div className="relative w-32 h-32 transform -rotate-3 -translate-x-3 -translate-y-2 z-10 transition-transform duration-500 group-hover:-rotate-6 group-hover:-translate-x-5 group-hover:-translate-y-4 group-hover:scale-105"
           style={{ transitionTimingFunction: 'var(--spring-elegant-easing-light)' }}>
        <ArtifactThumbnail artifact={artifacts[0]} />
      </div>
      
      {/* Artifact count indicator */}
      {artifacts.length > 3 && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          {artifacts.length}
        </div>
      )}
    </div>
  )
}

export default function ProjectCard({ project, onClick, onDelete }: ProjectCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  return (
    <Card 
      className="group hover:shadow-md cursor-pointer hover:scale-105 overflow-hidden aspect-[4/5] flex flex-col outline-none border-0"
      style={{ 
        transition: 'all 500ms var(--spring-elegant-easing-light)'
      }}
      onClick={onClick}
    >
      {/* Dynamic Cover */}
      <ProjectCover artifacts={project.coverArtifacts} />
      
      {/* Project Info */}
      <CardFooter className="p-4 space-y-2 mt-auto">
        <div className="space-y-1">
          <h3 className="font-medium text-white line-clamp-1">{project.name}</h3>
          <p className="text-sm text-gray-400">
            Last modified {formatDate(project.updated_at)}
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}
