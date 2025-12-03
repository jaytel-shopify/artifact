/**
 * Artifact Figma Plugin - Main Code
 *
 * This file runs in Figma's sandbox and has access to the Figma API.
 * It handles frame selection, PNG export, and communication with the UI.
 */

// Types for messages between code.ts and ui.html
interface FigmaFrame {
  id: string;
  name: string;
  imageData: string; // base64 data URL
  width: number;
  height: number;
}

interface ExportingMessage {
  type: "EXPORTING";
  current: number;
  total: number;
  frameName: string;
}

interface FramesReadyMessage {
  type: "FRAMES_READY";
  frames: FigmaFrame[];
}

interface ErrorMessage {
  type: "ERROR";
  message: string;
}

interface NoSelectionMessage {
  type: "NO_SELECTION";
}

type PluginToUIMessage =
  | ExportingMessage
  | FramesReadyMessage
  | ErrorMessage
  | NoSelectionMessage;

interface CloseMessage {
  type: "CLOSE";
}

interface ImportCompleteMessage {
  type: "IMPORT_COMPLETE";
  projectId: string;
  projectName: string;
}

type UIToPluginMessage = CloseMessage | ImportCompleteMessage;

// Show the UI
figma.showUI(__html__, {
  width: 500,
  height: 600,
  title: "Artifact | Import from Figma",
});

/**
 * Check if a node can be exported as an image
 */
function isExportableNode(node: SceneNode): boolean {
  // These node types can be exported
  const exportableTypes = [
    "FRAME",
    "COMPONENT",
    "COMPONENT_SET",
    "INSTANCE",
    "GROUP",
    "RECTANGLE",
    "ELLIPSE",
    "POLYGON",
    "STAR",
    "VECTOR",
    "TEXT",
    "BOOLEAN_OPERATION",
    "SECTION",
  ];
  return exportableTypes.includes(node.type);
}

/**
 * Get the bounding box dimensions of a node
 */
function getNodeDimensions(node: SceneNode): { width: number; height: number } {
  if ("width" in node && "height" in node) {
    return {
      width: Math.round(node.width),
      height: Math.round(node.height),
    };
  }
  // Fallback for nodes without direct width/height
  return { width: 100, height: 100 };
}

/**
 * Export a node as PNG and return base64 data URL
 */
async function exportNodeAsPNG(node: SceneNode): Promise<string> {
  const bytes = await (node as ExportMixin).exportAsync({
    format: "PNG",
    constraint: { type: "SCALE", value: 2 }, // 2x for retina
  });

  // Convert Uint8Array to base64
  const base64 = figma.base64Encode(bytes);
  return `data:image/png;base64,${base64}`;
}

/**
 * Main function to process selected frames
 */
async function processSelection(): Promise<void> {
  const selection = figma.currentPage.selection;

  // Check if anything is selected
  if (selection.length === 0) {
    const message: NoSelectionMessage = { type: "NO_SELECTION" };
    figma.ui.postMessage(message);
    return;
  }

  // Filter to only exportable nodes
  const exportableNodes = selection.filter(isExportableNode);

  if (exportableNodes.length === 0) {
    const message: ErrorMessage = {
      type: "ERROR",
      message: "Please select frames, components, or other exportable layers.",
    };
    figma.ui.postMessage(message);
    return;
  }

  const frames: FigmaFrame[] = [];

  // Export each node
  for (let i = 0; i < exportableNodes.length; i++) {
    const node = exportableNodes[i];

    // Send progress update
    const progressMessage: ExportingMessage = {
      type: "EXPORTING",
      current: i + 1,
      total: exportableNodes.length,
      frameName: node.name,
    };
    figma.ui.postMessage(progressMessage);

    try {
      const imageData = await exportNodeAsPNG(node);
      const dimensions = getNodeDimensions(node);

      frames.push({
        id: node.id,
        name: node.name,
        imageData,
        width: dimensions.width,
        height: dimensions.height,
      });
    } catch (error) {
      console.error(`Failed to export ${node.name}:`, error);
      // Continue with other frames even if one fails
    }
  }

  if (frames.length === 0) {
    const message: ErrorMessage = {
      type: "ERROR",
      message: "Failed to export any frames. Please try again.",
    };
    figma.ui.postMessage(message);
    return;
  }

  // Send frames to UI
  const message: FramesReadyMessage = {
    type: "FRAMES_READY",
    frames,
  };
  figma.ui.postMessage(message);
}

// Handle messages from UI
figma.ui.onmessage = (msg: UIToPluginMessage) => {
  if (msg.type === "CLOSE") {
    figma.closePlugin();
  } else if (msg.type === "IMPORT_COMPLETE") {
    figma.notify(`✓ Imported to "${msg.projectName}"`, { timeout: 3000 });
    figma.closePlugin();
  }
};

// Start processing when plugin loads
processSelection();
