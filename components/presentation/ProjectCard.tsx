"use client";

import Link from "next/link";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
      <div className="w-full flex-1 flex items-center justify-center">
        <span className="text-muted-foreground text-sm">No artifacts</span>
      </div>
    );
  }

  return (
    <div className="flex p-2 w-[140%]">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-1 flex-1">
          {artifacts[i] && <ArtifactThumbnail artifact={artifacts[i]} />}
        </div>
      ))}
    </div>
  );
}

export default function ProjectCard({
  project,
  onClick,
  onDelete,
  menuItems,
  onHover,
}: ProjectCardProps) {
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
      className="group relative hover:shadow-md cursor-pointer hover:scale-105 overflow-hidden flex flex-col outline-none border-0"
      style={{
        transition: "all 500ms var(--spring-elegant-easing-light)",
      }}
      onMouseEnter={onHover}
    >
      {/* Three dots menu button */}
      {menuItems && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background hover:bg-secondary text-foreground"
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

      {/* Dynamic Cover */}
      <ProjectCover artifacts={project.coverArtifacts} />

      {/* Project Info */}
      <CardFooter className="p-4 space-y-2 mt-auto">
        <div className="space-y-1">
          <h3 className="font-medium text-foreground line-clamp-1">
            {project.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Last modified {formatDate(project.updated_at)}
          </p>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <Link href={`/p/?id=${project.id}`} prefetch={false}>
      {cardContent}
    </Link>
  );
}
