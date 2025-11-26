// Hook for executing artifact commands with optimistic updates and error handling

import { useCallback } from "react";
import type { ArtifactCommand } from "@/lib/artifact-commands";
import type { ArtifactWithPosition } from "@/types";

interface UseArtifactCommandsProps {
  artifacts: ArtifactWithPosition[];
  mutate: (data: ArtifactWithPosition[] | undefined, opts?: { revalidate?: boolean }) => Promise<any>;
  onError?: (error: Error, commandName: string) => void;
  onExecutionStart?: () => void;
  onExecutionEnd?: () => void;
}

export function useArtifactCommands({
  artifacts,
  mutate,
  onError,
  onExecutionStart,
  onExecutionEnd,
}: UseArtifactCommandsProps) {
  const executeCommand = useCallback(
    async (command: ArtifactCommand, commandName: string = "Command") => {
      try {
        onExecutionStart?.();
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
      } finally {
        onExecutionEnd?.();
      }
    },
    [mutate, onError, onExecutionStart, onExecutionEnd]
  );

  return {
    executeCommand,
  };
}

