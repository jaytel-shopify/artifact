/**
 * Figma Import Types
 *
 * Message protocol and types for communication between the Figma plugin
 * and the Artifact import page via postMessage.
 */

// ==================== FRAME DATA ====================

/**
 * A single frame exported from Figma
 */
export type FigmaFrame = {
  id: string;
  name: string;
  imageData: string; // base64 encoded PNG (data URL format)
  width: number;
  height: number;
};

// ==================== FIGMA → ARTIFACT MESSAGES ====================

/**
 * Check if the iframe is ready to receive frames
 */
export type PingMessage = {
  type: "PING";
};

/**
 * Send selected frames to Artifact for import
 */
export type FramesReadyMessage = {
  type: "FRAMES_READY";
  frames: FigmaFrame[];
};

/**
 * All possible messages from Figma plugin to Artifact
 */
export type FigmaToArtifactMessage = PingMessage | FramesReadyMessage;

// ==================== ARTIFACT → FIGMA MESSAGES ====================

/**
 * Artifact is ready to receive frames
 */
export type ReadyMessage = {
  type: "READY";
};

/**
 * Import has started
 */
export type ImportStartedMessage = {
  type: "IMPORT_STARTED";
  frameCount: number;
};

/**
 * Import progress update
 */
export type ImportProgressMessage = {
  type: "IMPORT_PROGRESS";
  completed: number;
  total: number;
  currentFrameName?: string;
};

/**
 * Import completed successfully
 */
export type ImportCompleteMessage = {
  type: "IMPORT_COMPLETE";
  projectId: string;
  projectName: string;
  artifactCount: number;
};

/**
 * Import failed with an error
 */
export type ImportErrorMessage = {
  type: "IMPORT_ERROR";
  message: string;
};

/**
 * All possible messages from Artifact to Figma plugin
 */
export type ArtifactToFigmaMessage =
  | ReadyMessage
  | ImportStartedMessage
  | ImportProgressMessage
  | ImportCompleteMessage
  | ImportErrorMessage;

// ==================== IMPORT STATE ====================

export type ImportState =
  | "waiting" // Waiting for frames from Figma
  | "frames_received" // Frames received, user can select project
  | "importing" // Import in progress
  | "complete" // Import finished successfully
  | "error"; // Import failed

export type ImportProgress = {
  completed: number;
  total: number;
  currentFrameName?: string;
};

