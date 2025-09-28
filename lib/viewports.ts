export const VIEWPORTS = {
  iphone15pro: { label: "iPhone 15 Pro", width: 393, height: 852 },
  ipadAir: { label: "iPad Air", width: 820, height: 1180 },
  laptop: { label: "Laptop", width: 1512, height: 900 },
} as const;

export type ViewportKey = keyof typeof VIEWPORTS;

export const DEFAULT_VIEWPORT_KEY: ViewportKey = "laptop";

export function getViewportDimensions(key?: ViewportKey) {
  const preset = key ? VIEWPORTS[key] : VIEWPORTS[DEFAULT_VIEWPORT_KEY];
  return { width: preset.width, height: preset.height };
}


