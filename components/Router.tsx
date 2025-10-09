"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter as useNextRouter } from 'next/navigation';

// Page components
import ProjectsPage from '@/components/pages/ProjectsPage';
import PresentationPage from '@/components/pages/PresentationPage';
import FolderPage from '@/components/pages/FolderPage';
import SettingsPage from '@/components/pages/SettingsPage';
import LoginPage from '@/components/pages/LoginPage';
import NewProjectPage from '@/components/pages/NewProjectPage';
import FollowDemoPage from '@/components/pages/FollowDemoPage';

interface Route {
  path: string;
  component: ReactNode;
  exact?: boolean;
}

export function useHashRouter() {
  const [hash, setHash] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Get initial hash
    const updateHash = () => {
      const fullHash = window.location.hash.slice(1); // Remove leading #
      const [path, searchPart] = fullHash.split('?');
      setHash(path || '/');
      setSearch(searchPart ? `?${searchPart}` : '');
    };

    updateHash();

    // Listen for hash changes
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const replace = (path: string) => {
    window.location.replace(`#${path}`);
  };

  return { hash, search, navigate, replace };
}

// Hook to get search params from hash URL
export function useHashSearchParams() {
  const { search } = useHashRouter();
  
  const get = (key: string): string | null => {
    if (!search) return null;
    const params = new URLSearchParams(search.slice(1)); // Remove leading ?
    return params.get(key);
  };

  return { get };
}

export function Router() {
  const { hash, search } = useHashRouter();

  // Route matching
  const renderRoute = () => {
    const fullPath = hash + search;

    // Exact matches
    if (hash === '/' || hash === '') return <ProjectsRedirect />;
    if (hash === '/projects') return <ProjectsPage />;
    if (hash === '/p') return <PresentationPage />;
    if (hash === '/folder') return <FolderPage />;
    if (hash === '/settings') return <SettingsPage />;
    if (hash === '/auth/login') return <LoginPage />;
    if (hash === '/projects/new') return <NewProjectPage />;
    if (hash === '/follow-demo') return <FollowDemoPage />;

    // 404 - redirect to projects
    return <ProjectsRedirect />;
  };

  return <>{renderRoute()}</>;
}

// Helper component to redirect to projects
function ProjectsRedirect() {
  const { replace } = useHashRouter();

  useEffect(() => {
    replace('/projects');
  }, [replace]);

  return null;
}

// Hook to use hash-based navigation
export function useHashNavigation() {
  const { navigate, replace } = useHashRouter();

  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => replace(path),
    prefetch: (path: string) => {
      // No-op for hash routing, but keeps API compatible
    },
  };
}
