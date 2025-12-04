export const VIEWPORTS = {
  mobile: { label: "Mobile", width: 393, height: 852 },
  tablet: { label: "Tablet", width: 820, height: 1180 },
  desktop: { label: "Desktop", width: 1512, height: 900 },
} as const;

export type ViewportKey = keyof typeof VIEWPORTS;

export const DEFAULT_VIEWPORT_KEY: ViewportKey = "desktop";

export function getViewportDimensions(key?: ViewportKey) {
  const preset = key ? VIEWPORTS[key] : VIEWPORTS[DEFAULT_VIEWPORT_KEY];
  return { width: preset.width, height: preset.height };
}
