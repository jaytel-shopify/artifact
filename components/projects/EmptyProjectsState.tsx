import { Button } from "@/components/ui/button";

interface EmptyProjectsStateProps {
  onCreateFolder: () => void;
  onCreateProject: () => void;
}

export function EmptyProjectsState({
  onCreateFolder,
  onCreateProject,
}: EmptyProjectsStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-text-secondary mb-4">No projects or folders yet</p>
      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={onCreateFolder}>
          Create Folder
        </Button>
        <Button onClick={onCreateProject}>Create Project</Button>
      </div>
    </div>
  );
}
