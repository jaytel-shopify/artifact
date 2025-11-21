"use client";

import { waitForQuick } from "./quick";
import { getMockQuickSites } from "./quick-mock";

export interface QuickSiteRecord {
  id: string;
  subdomain: string;
  url: string;
  owner: string;
  lastModified: string;
  description?: string;
  thumbnail?: string;
}

/**
 * Get all Quick sites for the current user from the Quick directory
 */
export async function getUserQuickSites(): Promise<QuickSiteRecord[]> {
  const quick = await waitForQuick();
  const currentUser = quick.id.email;

  // Local dev: return mock data
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' || 
     window.location.hostname.startsWith('192.168.'));

  if (isLocal) {
    return getMockQuickSites().map(site => ({ ...site, owner: currentUser }));
  }

  // Production: fetch from directory
  const response = await fetch('/directory.json');
  if (!response.ok) throw new Error(`Failed to fetch directory: ${response.status}`);

  // Parse NDJSON and filter/transform in one pass
  return (await response.text())
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line))
    .filter(site => {
      const ownerEmail = site.last_modified_by?.includes('@') 
        ? site.last_modified_by 
        : `${site.last_modified_by}@shopify.com`;
      return ownerEmail === currentUser && site.site_url && site.site_name;
    })
    .map(site => ({
      id: site.site_name,
      subdomain: site.site_url.replace('https://', '').split('.')[0],
      url: site.site_url,
      owner: site.last_modified_by,
      lastModified: site.last_updated,
      description: site.site_summary,
    }))
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
}

