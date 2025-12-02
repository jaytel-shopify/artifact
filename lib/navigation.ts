// Simple module-level variable to track the current path
let currentPath: string | null = null;

export function setCurrentPath(path: string) {
  currentPath = path;
}

export function getCurrentPath(): string | null {
  return currentPath;
}

