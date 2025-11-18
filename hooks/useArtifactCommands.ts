// Hook for executing artifact commands with optimistic updates and error handling

import { useCallback } from "react";
import type { ArtifactCommand } from "@/lib/artifact-commands";
import type { Artifact } from "@/types";

interface UseArtifactCommandsProps {
  artifacts: Artifact[];
  mutate: (data: Artifact[] | undefined, opts?: { revalidate?: boolean }) => Promise<any>;
  onError?: (error: Error, commandName: string) => void;
}

export function useArtifactCommands({
  artifacts,
  mutate,
  onError,
}: UseArtifactCommandsProps) {
  const executeCommand = useCallback(
    async (command: ArtifactCommand, commandName: string = "Command") => {
      try {
        const optimisticState = command.getOptimisticState();
        mutate(optimisticState, { revalidate: false });
        await command.execute();
      } catch (error) {
        console.error(`[${commandName}] Failed:`, error);

        const previousState = command.getPreviousState();
        mutate(previousState, { revalidate: false });

        if (onError) {
          onError(error as Error, commandName);
        }

        throw error;
      }
    },
    [mutate, onError]
  );

  return {
    executeCommand,
  };
}

