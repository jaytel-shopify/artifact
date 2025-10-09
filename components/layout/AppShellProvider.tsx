"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
  DependencyList,
  ReactNode,
} from "react";
import type { Page } from "@/types";

type ShellMode = "homepage" | "canvas" | "folder";

interface NavigationConfig {
  onBackToHome?: () => void;
}

interface ProjectConfig {
  id?: string;
  name?: string;
  shareToken?: string;
  creatorEmail?: string;
  isCreator?: boolean;
  isCollaborator?: boolean;
  isReadOnly?: boolean;
  currentFolderId?: string | null;
  folders?: any[];
  onProjectNameUpdate?: (name: string) => void;
  onMoveToFolder?: (folderId: string) => void;
  onRemoveFromFolder?: () => void;
  onArtifactAdded?: () => void;
}

interface ColumnControlsConfig {
  columns?: number;
  onColumnsChange?: (columns: number) => void;
  showColumnControls?: boolean;
  fitMode?: boolean;
  onFitModeChange?: (fit: boolean) => void;
}

interface PageSidebarConfig {
  pages?: Page[];
  currentPageId?: string;
  onPageSelect?: (pageId: string) => void;
  onPageRename?: (pageId: string, newName: string) => Promise<void>;
  onPageCreate?: () => void;
  onPageDelete?: (pageId: string) => void;
  isReadOnly?: boolean;
}

interface FolderConfig {
  id?: string;
  name?: string;
  onFolderNameUpdate?: (name: string) => void;
  onFolderShare?: () => void;
  onFolderRename?: () => void;
  onFolderDelete?: () => void;
  onNewProject?: () => void;
}

interface HomepageAction {
  id: string;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

interface HomepageConfig {
  onNewProject?: () => void;
  actions?: HomepageAction[];
}

interface AppShellConfig {
  mode?: ShellMode;
  navigation?: NavigationConfig | undefined;
  project?: ProjectConfig | undefined;
  columnControls?: ColumnControlsConfig | undefined;
  pageSidebar?: PageSidebarConfig | undefined;
  folder?: FolderConfig | undefined;
  homepage?: HomepageConfig | undefined;
}

type AppShellConfigInput =
  | Partial<AppShellConfig>
  | ((prev: AppShellConfig) => Partial<AppShellConfig>);

interface AppShellContextValue {
  config: AppShellConfig;
  configure: (
    config: AppShellConfigInput,
    options?: { reset?: boolean }
  ) => void;
  reset: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
}

const defaultConfig: AppShellConfig = {
  mode: "homepage",
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

function mergeSection<T extends Record<string, any> | undefined>(
  baseSection: T | undefined,
  nextSection: T | undefined
): T | undefined {
  if (nextSection === undefined) {
    return baseSection;
  }
  return {
    ...(baseSection ?? {}),
    ...nextSection,
  } as T;
}

function mergeConfigs(
  base: AppShellConfig,
  next: Partial<AppShellConfig>
): AppShellConfig {
  return {
    ...base,
    ...next,
    mode: next.mode ?? base.mode,
    navigation: mergeSection(base.navigation, next.navigation),
    project: mergeSection(base.project, next.project),
    columnControls: mergeSection(base.columnControls, next.columnControls),
    pageSidebar: mergeSection(base.pageSidebar, next.pageSidebar),
    folder: mergeSection(base.folder, next.folder),
    homepage: mergeSection(base.homepage, next.homepage),
  };
}

export function AppShellProvider({ children }: PropsWithChildren) {
  const [config, setConfig] = useState<AppShellConfig>(defaultConfig);
  const [sidebarOpen, setSidebarOpenState] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const stored = window.localStorage.getItem("sidebar_open");
    return stored ? JSON.parse(stored) : false;
  });

  const configure = useCallback(
    (nextConfig: AppShellConfigInput, options?: { reset?: boolean }) => {
      setConfig((prev) => {
        const base = options?.reset ? defaultConfig : prev;
        const next =
          typeof nextConfig === "function" ? nextConfig(base) : nextConfig;
        return mergeConfigs(base, next);
      });
    },
    []
  );

  const reset = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  const setSidebarOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setSidebarOpenState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        if (typeof window !== "undefined") {
          window.localStorage.setItem("sidebar_open", JSON.stringify(next));
        }
        return next;
      });
    },
    []
  );

  const value = useMemo<AppShellContextValue>(
    () => ({
      config,
      configure,
      reset,
      sidebarOpen,
      setSidebarOpen,
    }),
    [config, configure, reset, sidebarOpen, setSidebarOpen]
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell(): AppShellContextValue {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within an AppShellProvider");
  }
  return context;
}

interface UseAppShellConfigOptions {
  resetOnUnmount?: boolean;
  reset?: boolean;
}

export function useAppShellConfig(
  createConfig: () => Partial<AppShellConfig>,
  deps: DependencyList = [],
  options: UseAppShellConfigOptions = {}
) {
  const { configure, reset } = useAppShell();
  const { resetOnUnmount = true, reset: shouldReset = true } = options;

  useEffect(() => {
    configure(createConfig, { reset: shouldReset });
    return () => {
      if (resetOnUnmount) {
        reset();
      }
    };
  }, [configure, reset, shouldReset, resetOnUnmount, ...deps]);
}
