"use client";

import Link from "next/link";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import ArtifactThumbnail from "./ArtifactThumbnail";
import type { Artifact } from "@/types";

interface ProjectCoverData {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  coverArtifacts: Artifact[];
  artifactCount: number;
}

interface ProjectCardProps {
  project: ProjectCoverData;
  onClick?: () => void;
  onDelete?: () => void;
  menuItems?: React.ReactNode; // Pass the menu items from parent
  onHover?: () => void; // Prefetch handler
}

function ProjectCover({ artifacts }: { artifacts: Artifact[] }) {
  const count = artifacts.length;

  if (count === 0) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <span className="text-text-secondary text-medium">No artifacts</span>
      </div>
    );
  }

  const hasHoverEffect = count > 2;

  return (
    <div
      className={`flex flex-1 w-[140%] p-2 pt-0 h-full overflow-hidden ${hasHoverEffect ? "ease-spring-light transition-transform duration-500 group-hover:-translate-x-[28.57%]" : ""}`}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex-1 p-1">
          {artifacts[i] && (
            <ArtifactThumbnail
              artifact={artifacts[i]}
              className="rounded-card-inner max-h-full overflow-hidden"
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ProjectCard({ project, menuItems }: ProjectCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const cardContent = (
    <Card
      className="group border-border hover:bg-secondary/10 relative flex gap-0 cursor-pointer flex-col overflow-hidden border outline-none aspect-[300/250]"
      style={{
        transition: "all 500ms var(--spring-elegant-easing-light)",
      }}
    >
      {/* Three dots menu button */}
      {menuItems && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background hover:bg-secondary text-text-primary absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {menuItems}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Project Info */}
      <CardFooter className="mt-auto space-y-2 p-4">
        <div className="space-y-1">
          <h3 className="text-text-primary line-clamp-1 text-medium">
            {project.name}
          </h3>
          <p className="text-text-secondary text-small">
            {project.artifactCount}{" "}
            {project.artifactCount === 1 ? "artifact" : "artifacts"}
          </p>
        </div>
      </CardFooter>

      {/* Dynamic Cover */}
      <ProjectCover artifacts={project.coverArtifacts} />
    </Card>
  );

  return (
    <Link href={`/p/?id=${project.id}`} prefetch={false}>
      {cardContent}
    </Link>
  );
}
