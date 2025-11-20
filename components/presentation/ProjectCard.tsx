"use client";

import { useState, useEffect } from "react";
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
import type { Folder, Artifact } from "@/types";
import { formatDate } from "@/lib/utils";
import { getArtifactsByFolderId } from "@/lib/quick/db-new";

interface ProjectCardProps {
  project: Folder;
  onClick?: () => void;
  onDelete?: () => void;
  menuItems?: React.ReactNode; // Pass the menu items from parent
}

export default function ProjectCard({ project, menuItems }: ProjectCardProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  useEffect(() => {
    const fetchArtifacts = async () => {
      const artifacts = await getArtifactsByFolderId(project.id);
      setArtifacts(artifacts);
    };
    fetchArtifacts();
  }, [project.id]);

  return (
    <Card
      className="group relative hover:shadow-md hover:scale-102 overflow-hidden p-0 gap-0 flex flex-col outline-none border-0"
      style={{
        transition: "all 500ms var(--spring-elegant-easing-light)",
      }}
    >
      <div className="w-full flex-1 grid grid-cols-2 gap-2 p-6 aspect-square">
        {artifacts.slice(0, 4).map((p) => (
          <ArtifactThumbnail artifact={p} />
        ))}
      </div>

      <CardFooter className="p-4 space-y-2 mt-auto">
        <div className="space-y-1">
          <Link
            href={`/p/${project.id}`}
            prefetch={false}
            className="after:content-[''] after:absolute after:inset-0 "
          >
            <h3 className="font-medium text-white line-clamp-1">
              {project.title}
            </h3>
          </Link>

          <p className="text-sm text-gray-400">
            Last modified {formatDate(project.updated_at)}
          </p>
        </div>

        {/* Three dots menu button */}
        {menuItems && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
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
      </CardFooter>
    </Card>
  );
}
