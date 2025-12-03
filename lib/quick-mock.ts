"use client";

/**
 * Simplified Mock Quick SDK for Local Development
 * Only includes the essentials: database, file storage, and identity
 */

import {
  MOCK_USER_ID,
  MOCK_USER_EMAIL,
  MOCK_PUBLIC_USER_ID,
} from "./mock-constants";

// In-memory database
const db: Record<string, any[]> = {};

// Generate unique ID
const id = () =>
  `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Initialize with sample data
function init() {
  // Force clear and reinitialize
  db.projects = [];
  db.pages = [];
  db.artifacts = [];
  db.project_artifacts = []; // Junction table for many-to-many
  db.folders = [];
  db.access_control = [];
  db.users = []; // User records

  const now = new Date().toISOString();
  const projectId = "sample-1";
  const pageId = "page-1";
  const project2Id = "sample-2";
  const project3Id = "sample-3";
  const page2Id = "page-2";
  const page3Id = "page-3";
  const folder1Id = "folder-1";
  const folder2Id = "folder-2";
  const folder3Id = "folder-3";

  // Create mock user record
  db.users = [
    {
      id: MOCK_USER_ID,
      email: MOCK_USER_EMAIL,
      name: "Local Developer",
      slack_handle: "local-dev",
      slack_image_url: "https://i.pravatar.cc/150?u=dev@shopify.com",
      created_at: now,
      updated_at: now,
    },
    {
      id: MOCK_PUBLIC_USER_ID,
      email: "public@shopify.com",
      name: "Public User",
      slack_handle: "public-user",
      slack_image_url: "https://i.pravatar.cc/150?u=public@shopify.com",
      created_at: now,
      updated_at: now,
    },
  ];

  db.folders = [
    {
      id: folder1Id,
      name: "Design Work",
      creator_id: MOCK_USER_ID,
      created_at: now,
      updated_at: now,
    },
    {
      id: folder2Id,
      name: "Client Projects",
      creator_id: MOCK_USER_ID,
      created_at: now,
      updated_at: now,
    },
    {
      id: folder3Id,
      name: "Archive",
      creator_id: MOCK_USER_ID,
      created_at: now,
      updated_at: now,
    },
  ];

  db.projects = [
    {
      id: projectId,
      name: "Sample Project",
      creator_id: MOCK_USER_ID,
      folder_id: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: project2Id,
      name: "Mobile App Designs",
      creator_id: MOCK_USER_ID,
      folder_id: folder1Id, // Assigned to "Design Work" folder
      created_at: now,
      updated_at: now,
    },
    {
      id: project3Id,
      name: "E-commerce Landing Page",
      creator_id: MOCK_USER_ID,
      folder_id: folder1Id, // Assigned to "Design Work" folder
      created_at: now,
      updated_at: now,
    },
  ];

  db.pages = [
    {
      id: pageId,
      project_id: projectId,
      name: "Page 01",
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: page2Id,
      project_id: project2Id,
      name: "Home Screen",
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: page3Id,
      project_id: project3Id,
      name: "Hero Section",
      position: 0,
      created_at: now,
      updated_at: now,
    },
  ];

  // Artifacts (standalone - no project_id, page_id, or position)
  db.artifacts = [
    {
      id: "art-8",
      type: "image",
      source_url: "/mock/artifact01.png",
      file_path: null,
      name: "Sample Image 8",
      description: "A sample image with a clean and modern look",
      published: false,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1000, height: 1000 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-9",
      type: "image",
      source_url: "/mock/artifact02.png",
      file_path: null,
      name: "Sample Image 9",
      description: "A sample image with a clean and modern look",
      published: false,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1000, height: 482 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-10",
      type: "image",
      source_url: "/mock/artifact03.png",
      file_path: null,
      name: "Sample Image 10",
      published: false,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1000, height: 1376 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-1",
      type: "image",
      source_url: "/mock/artifact04.png",
      file_path: null,
      name: "Sample Image 1",
      published: false,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1000, height: 1000 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-2",
      type: "image",
      source_url: "/mock/artifact05.png",
      file_path: null,
      name: "Placeholder Image - Dog",
      published: false,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1000, height: 698 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-3",
      type: "video",
      source_url:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      file_path: null,
      name: "Sample Video - Big Buck Bunny",
      description: "A sample video with a clean and modern look",
      published: true,
      creator_id: MOCK_USER_ID,
      metadata: {
        duration: 634,
        loop: true,
        muted: true,
        thumbnail_url: "/mock/artifact01.png",
        width: 1280,
        height: 720,
      },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-4",
      type: "image",
      source_url: "/mock/artifact06.png",
      file_path: null,
      name: "Placeholder Image - Nature",
      description: "A sample image with a clean and modern look",
      published: false,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1000, height: 858 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-5",
      type: "video",
      source_url:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      file_path: null,
      name: "Sample Video - For Bigger Blazes",
      description: "A sample video with a clean and modern look",
      published: true,
      creator_id: MOCK_USER_ID,
      metadata: {
        duration: 15,
        loop: true,
        muted: true,
        thumbnail_url: "/mock/artifact03.png",
        width: 1280,
        height: 720,
      },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-6",
      type: "url",
      source_url: "https://shopify.com",
      file_path: null,
      name: "Shopify Website",
      description: "A sample website with a clean and modern look",
      published: false,
      creator_id: MOCK_USER_ID,
      metadata: {
        viewport: "laptop",
        width: 1512,
        height: 900,
      },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-7",
      type: "titleCard",
      source_url: "",
      file_path: null,
      name: "Sample Title Card",
      description: "A sample title card with a clean and modern look",
      published: false,
      creator_id: MOCK_USER_ID,
      metadata: {
        headline: "Welcome to the Project",
        subheadline:
          "This is a sample title card with a headline and subheadline",
        width: 1280,
        height: 720,
      },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    // Mobile App Designs artifacts
    {
      id: "art-11",
      type: "image",
      source_url: "/mock/artifact07.png",
      file_path: null,
      name: "Mobile Home Screen",
      description: "A sample image with a clean and modern look",
      published: false,
      creator_id: MOCK_USER_ID,
      metadata: { width: 800, height: 1600 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-12",
      type: "image",
      source_url: "/mock/artifact01.png",
      file_path: null,
      name: "Product Detail",
      description: "A sample image with a clean and modern look",
      published: false,
      creator_id: MOCK_USER_ID,
      metadata: { width: 800, height: 1600 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-13",
      type: "titleCard",
      source_url: "",
      file_path: null,
      name: "App Features",
      description: "A sample title card with a clean and modern look",
      published: false,
      creator_id: MOCK_USER_ID,
      metadata: {
        headline: "Mobile First Design",
        subheadline: "Optimized for iOS and Android",
        width: 1280,
        height: 720,
      },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    // E-commerce Landing Page artifacts
    {
      id: "art-14",
      type: "image",
      source_url: "/mock/artifact02.png",
      file_path: null,
      name: "Hero Banner",
      description: "A sample image with a clean and modern look",
      published: false,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1920, height: 1080 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    // Published artifacts (standalone, not in any project)
    {
      id: "pub-1",
      type: "image",
      source_url: "/mock/artifact01.png",
      file_path: null,
      name: "Beautiful Sunset",
      description: "A sample image with a clean and modern look",
      published: true,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1000, height: 1000 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-2",
      type: "image",
      source_url: "/mock/artifact02.png",
      file_path: null,
      name: "Urban Architecture",
      description: "A sample image with a clean and modern look",
      published: true,
      creator_id: MOCK_PUBLIC_USER_ID,
      metadata: { width: 1000, height: 482 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-3",
      type: "image",
      source_url: "/mock/artifact03.png",
      file_path: null,
      name: "Lorem ipsum dolor",
      description: "A sample image with a clean and modern look",
      published: true,
      creator_id: MOCK_PUBLIC_USER_ID,
      metadata: { width: 1000, height: 1376 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-4",
      type: "image",
      source_url: "/mock/artifact04.png",
      file_path: null,
      name: "Lorem ipsum dolor",
      published: true,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1000, height: 1000 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-5",
      type: "image",
      source_url: "/mock/artifact05.png",
      file_path: null,
      name: "Lorem ipsum dolor",
      description: "A minimalist design with a clean and modern look",
      published: true,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1000, height: 698 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-6",
      type: "image",
      source_url: "/mock/artifact06.png",
      file_path: null,
      name: "Lorem ipsum dolor",
      description: "An abstract pattern with a modern and stylish look",
      published: true,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1000, height: 858 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-7",
      type: "image",
      source_url: "/mock/artifact07.png",
      file_path: null,
      name: "Lorem ipsum dolor",
      description: "A modern aesthetic with a clean and modern look",
      published: true,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1000, height: 1878 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-8",
      type: "image",
      source_url: "/mock/artifact08.png",
      file_path: null,
      name: "Lorem ipsum dolor",
      description: "A modern aesthetic with a clean and modern look",
      published: true,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1000, height: 816 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-9",
      type: "image",
      source_url: "/mock/artifact09.png",
      file_path: null,
      name: "Lorem ipsum dolor",
      description: "A modern aesthetic with a clean and modern look",
      published: true,
      creator_id: MOCK_USER_ID,
      metadata: { width: 1000, height: 1114 },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-10",
      type: "url",
      source_url: "https://example.com",
      file_path: null,
      name: "Example Website",
      description: "A test website to verify iframe layout",
      published: true,
      creator_id: MOCK_USER_ID,
      metadata: {
        viewport: "desktop",
        width: 1920,
        height: 1080,
      },
      reactions: { like: [], dislike: [] },
      created_at: now,
      updated_at: now,
    },
  ];

  // Junction table: project_artifacts (links artifacts to projects/pages with position)
  db.project_artifacts = [
    // Sample Project (projectId, pageId) artifacts
    {
      id: "pa-1",
      project_id: projectId,
      page_id: pageId,
      artifact_id: "art-8",
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pa-2",
      project_id: projectId,
      page_id: pageId,
      artifact_id: "art-9",
      position: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pa-3",
      project_id: projectId,
      page_id: pageId,
      artifact_id: "art-10",
      position: 2,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pa-4",
      project_id: projectId,
      page_id: pageId,
      artifact_id: "art-1",
      position: 3,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pa-5",
      project_id: projectId,
      page_id: pageId,
      artifact_id: "art-2",
      position: 4,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pa-6",
      project_id: projectId,
      page_id: pageId,
      artifact_id: "art-3",
      position: 5,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pa-7",
      project_id: projectId,
      page_id: pageId,
      artifact_id: "art-4",
      position: 6,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pa-8",
      project_id: projectId,
      page_id: pageId,
      artifact_id: "art-5",
      position: 7,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pa-9",
      project_id: projectId,
      page_id: pageId,
      artifact_id: "art-6",
      position: 8,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pa-10",
      project_id: projectId,
      page_id: pageId,
      artifact_id: "art-7",
      position: 9,
      created_at: now,
      updated_at: now,
    },
    // Mobile App Designs (project2Id, page2Id) artifacts
    {
      id: "pa-11",
      project_id: project2Id,
      page_id: page2Id,
      artifact_id: "art-11",
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pa-12",
      project_id: project2Id,
      page_id: page2Id,
      artifact_id: "art-12",
      position: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: "pa-13",
      project_id: project2Id,
      page_id: page2Id,
      artifact_id: "art-13",
      position: 2,
      created_at: now,
      updated_at: now,
    },
    // E-commerce Landing Page (project3Id, page3Id) artifacts
    {
      id: "pa-14",
      project_id: project3Id,
      page_id: page3Id,
      artifact_id: "art-14",
      position: 0,
      created_at: now,
      updated_at: now,
    },
  ];

  // Grant access to folders and projects for the dev user
  db.access_control = [
    // Folder access
    {
      id: "access-1",
      resource_type: "folder",
      resource_id: folder1Id,
      user_id: MOCK_USER_ID,
      user_email: MOCK_USER_EMAIL,
      user_name: "Local Developer",
      access_level: "owner",
      granted_by: MOCK_USER_ID,
      created_at: now,
      updated_at: now,
    },
    {
      id: "access-2",
      resource_type: "folder",
      resource_id: folder2Id,
      user_id: MOCK_USER_ID,
      user_email: MOCK_USER_EMAIL,
      user_name: "Local Developer",
      access_level: "owner",
      granted_by: MOCK_USER_ID,
      created_at: now,
      updated_at: now,
    },
    {
      id: "access-3",
      resource_type: "folder",
      resource_id: folder3Id,
      user_id: MOCK_USER_ID,
      user_email: MOCK_USER_EMAIL,
      user_name: "Local Developer",
      access_level: "owner",
      granted_by: MOCK_USER_ID,
      created_at: now,
      updated_at: now,
    },
    // Project access
    {
      id: "access-4",
      resource_type: "project",
      resource_id: projectId,
      user_id: MOCK_USER_ID,
      user_email: MOCK_USER_EMAIL,
      user_name: "Local Developer",
      access_level: "owner",
      granted_by: MOCK_USER_ID,
      created_at: now,
      updated_at: now,
    },
    {
      id: "access-5",
      resource_type: "project",
      resource_id: project2Id,
      user_id: MOCK_USER_ID,
      user_email: MOCK_USER_EMAIL,
      user_name: "Local Developer",
      access_level: "owner",
      granted_by: MOCK_USER_ID,
      created_at: now,
      updated_at: now,
    },
    {
      id: "access-6",
      resource_type: "project",
      resource_id: project3Id,
      user_id: MOCK_USER_ID,
      user_email: MOCK_USER_EMAIL,
      user_name: "Local Developer",
      access_level: "owner",
      granted_by: MOCK_USER_ID,
      created_at: now,
      updated_at: now,
    },
  ];
}

// Mock collection
class Collection {
  constructor(private name: string) {
    if (!db[this.name]) db[this.name] = [];
  }

  async create(data: any) {
    const doc = {
      ...data,
      id: data.id || id(), // Preserve existing ID if provided (for users), otherwise generate
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    // Default published to false for artifacts if not specified
    if (this.name === "artifacts" && data.published === undefined) {
      doc.published = false;
    }
    db[this.name].push(doc);
    return doc;
  }

  async find() {
    const result = [...db[this.name]];
    return result;
  }

  async findById(id: string) {
    const doc = db[this.name].find((item) => item.id === id);
    if (!doc) throw new Error(`Not found: ${id}`);
    return doc;
  }

  async update(id: string, data: any) {
    const index = db[this.name].findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Not found: ${id}`);
    db[this.name][index] = {
      ...db[this.name][index],
      ...data,
      updated_at: new Date().toISOString(),
    };
  }

  async delete(id: string) {
    const index = db[this.name].findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Not found: ${id}`);
    db[this.name].splice(index, 1);
  }

  where(query: any) {
    const matchesCondition = (itemValue: any, condition: any): boolean => {
      // Handle query operators like { $in: [...] }
      if (
        condition &&
        typeof condition === "object" &&
        !Array.isArray(condition)
      ) {
        if ("$in" in condition) {
          return (
            Array.isArray(condition.$in) && condition.$in.includes(itemValue)
          );
        }
        // Add more operators here as needed (e.g., $gt, $lt, $ne, etc.)
      }
      // Simple equality check
      return itemValue === condition;
    };

    const filter = (items: any[]) =>
      items.filter((item) =>
        Object.entries(query).every(([k, v]) => matchesCondition(item[k], v))
      );

    const createQuery = (
      orderField?: string,
      orderDirection?: string,
      limitN?: number,
      offsetN?: number
    ): any => {
      const sort = (items: any[]) => {
        if (!orderField) return items;

        return [...items].sort((a, b) => {
          const aVal = a[orderField];
          const bVal = b[orderField];

          if (aVal === bVal) return 0;
          if (aVal == null) return 1;
          if (bVal == null) return -1;

          const comparison = aVal < bVal ? -1 : 1;
          return orderDirection === "desc" ? -comparison : comparison;
        });
      };

      const applyPagination = (items: any[]) => {
        let result = items;
        if (offsetN !== undefined) {
          result = result.slice(offsetN);
        }
        if (limitN !== undefined) {
          result = result.slice(0, limitN);
        }
        return result;
      };

      return {
        find: async () => applyPagination(sort(filter(db[this.name]))),
        orderBy: (field: string, direction: string = "asc") =>
          createQuery(field, direction, limitN, offsetN),
        limit: (n: number) =>
          createQuery(orderField, orderDirection, n, offsetN),
        offset: (n: number) =>
          createQuery(orderField, orderDirection, limitN, n),
        select: (fields: string[]) =>
          createQuery(orderField, orderDirection, limitN, offsetN),
      };
    };

    return createQuery();
  }

  orderBy(field: string, direction: string = "asc") {
    const sort = (items: any[]) => {
      return [...items].sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];

        if (aVal === bVal) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return direction === "desc" ? -comparison : comparison;
      });
    };

    const createQuery = (limitN?: number, offsetN?: number): any => {
      const applyPagination = (items: any[]) => {
        let result = items;
        if (offsetN !== undefined) {
          result = result.slice(offsetN);
        }
        if (limitN !== undefined) {
          result = result.slice(0, limitN);
        }
        return result;
      };

      return {
        find: async () => applyPagination(sort(db[this.name])),
        where: (query: any) => this.where(query).orderBy(field, direction),
        limit: (n: number) => createQuery(n, offsetN),
        offset: (n: number) => createQuery(limitN, n),
      };
    };

    return createQuery();
  }

  subscribe() {
    return () => {}; // No-op unsubscribe
  }
}

// Mock Quick sites data
export function getMockQuickSites() {
  return [
    {
      id: "my-portfolio",
      subdomain: "my-portfolio",
      description: "My portfolio site",
      url: "https://my-portfolio.quick.shopify.io",
      owner: "dev@shopify.com",
      lastModified: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
      thumbnail: "/mock/artifact01.png",
    },
    {
      id: "team-dashboard",
      subdomain: "team-dashboard",
      description: "Team dashboard site",
      url: "https://team-dashboard.quick.shopify.io",
      owner: "dev@shopify.com",
      lastModified: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000
      ).toISOString(),
      thumbnail: "/mock/artifact02.png",
    },
    {
      id: "project-showcase",
      subdomain: "project-showcase",
      description: "Project showcase site",
      url: "https://project-showcase.quick.shopify.io",
      owner: "dev@shopify.com",
      lastModified: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      thumbnail: "/mock/artifact03.png",
    },
  ];
}

export function createMockQuick() {
  init();

  return {
    db: {
      collection: (name: string) => new Collection(name),
    },
    fs: {
      async upload(files: File[]) {
        return files.map((file, i) => {
          const imageIndex = (i % 7) + 1;
          return {
            originalName: file.name,
            filename: `mock-${Date.now()}-${i}-${file.name}`,
            url: file.type.startsWith("image/")
              ? `/mock/artifact0${imageIndex}.png`
              : file.type.startsWith("video/")
                ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                : `/uploads/mock-${file.name}`,
            fullUrl: file.type.startsWith("image/")
              ? `/mock/artifact0${imageIndex}.png`
              : file.type.startsWith("video/")
                ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                : `/uploads/mock-${file.name}`,
            size: file.size,
            mimeType: file.type,
          };
        });
      },
      async uploadFile(file: File, options?: any) {
        if (options?.onProgress) {
          setTimeout(
            () =>
              options.onProgress({
                percentage: 100,
                loaded: file.size,
                total: file.size,
              }),
            100
          );
        }
        const imageIndex = Math.floor(Math.random() * 7) + 1;
        const mockUrl = file.type.startsWith("image/")
          ? `/mock/artifact0${imageIndex}.png`
          : file.type.startsWith("video/")
            ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            : `/uploads/mock-${file.name}`;
        return {
          originalName: file.name,
          filename: `mock-${Date.now()}-${file.name}`,
          url: mockUrl,
          fullUrl: mockUrl,
          size: file.size,
          mimeType: file.type,
        };
      },
    },
    id: {
      email: "dev@shopify.com",
      fullName: "Local Developer",
      firstName: "Local",
      waitForUser: async function () {
        return this;
      },
    },
    // Minimal stubs for unused APIs
    ai: {
      ask: async () => "Mock",
      askWithSystem: async () => "Mock",
      chat: async () => ({ choices: [{ message: { content: "Mock" } }] }),
      chatStream: async () => {},
      embed: async () => [],
    },
    socket: {
      room: () => ({
        join: async () => {},
        leave: async () => {},
        on: () => {},
        emit: () => {},
        users: new Map(),
        user: { socketId: "", name: "", email: "", state: {} },
        updateUserState: () => {},
      }),
    },
    site: {
      create: async () => ({ message: "Mock", url: "" }),
      get: async () => null,
      delete: async () => {},
    },
    slack: {
      sendMessage: async () => ({}),
      sendAlert: async () => ({}),
      sendStatus: async () => ({}),
      sendCode: async () => ({}),
      sendTable: async () => ({}),
    },
    auth: { requestScopes: async () => ({ hasRequiredScopes: true }) },
  };
}
