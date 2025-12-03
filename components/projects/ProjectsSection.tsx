"use client";

import { Presentation } from "lucide-react";
import ProjectCard from "@/components/presentation/ProjectCard";
import type { ProjectWithCover } from "@/hooks/useProjectsData";

interface ProjectsSectionProps {
  projects: ProjectWithCover[];
  title?: string;
}

/**
 * Reusable section component for displaying a grid of projects
 * Uses ProjectCard for consistent UI across search and projects pages
 */
export function ProjectsSection({
  projects,
  title = "Projects",
}: ProjectsSectionProps) {
  if (projects.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-large">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
