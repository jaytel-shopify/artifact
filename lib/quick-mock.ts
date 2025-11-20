"use client";

/**
 * Simplified Mock Quick SDK for Local Development
 * Only includes the essentials: database, file storage, and identity
 */

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
  db.folders = [];
  db.access_control = [];

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

  db.folders = [
    {
      id: folder1Id,
      name: "Design Work",
      creator_id: "dev@shopify.com",
      created_at: now,
      updated_at: now,
    },
    {
      id: folder2Id,
      name: "Client Projects",
      creator_id: "dev@shopify.com",
      created_at: now,
      updated_at: now,
    },
    {
      id: folder3Id,
      name: "Archive",
      creator_id: "dev@shopify.com",
      created_at: now,
      updated_at: now,
    },
  ];

  db.projects = [
    {
      id: projectId,
      name: "Sample Project",
      creator_id: "dev@shopify.com",
      folder_id: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: project2Id,
      name: "Mobile App Designs",
      creator_id: "dev@shopify.com",
      folder_id: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: project3Id,
      name: "E-commerce Landing Page",
      creator_id: "dev@shopify.com",
      folder_id: null,
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

  db.artifacts = [
    {
      id: "art-8",
      project_id: projectId,
      page_id: pageId,
      type: "image",
      source_url: "/mock/Artifact 1.png",
      file_path: null,
      name: "Sample Image 8",
      position: 0,
      published: false,
      metadata: { width: 800, height: 600 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-9",
      project_id: projectId,
      page_id: pageId,
      type: "image",
      source_url: "/mock/Artifact 2.png",
      file_path: null,
      name: "Sample Image 9",
      position: 0,
      published: false,
      metadata: { width: 800, height: 600 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-10",
      project_id: projectId,
      page_id: pageId,
      type: "image",
      source_url: "/mock/Artifact 3.png",
      file_path: null,
      name: "Sample Image 10",
      position: 0,
      published: false,
      metadata: { width: 800, height: 600 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-1",
      project_id: projectId,
      page_id: pageId,
      type: "image",
      source_url: "/mock/Artifact 4.png",
      file_path: null,
      name: "Sample Image 1",
      position: 0,
      published: false,
      metadata: { width: 800, height: 600 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-2",
      project_id: projectId,
      page_id: pageId,
      type: "image",
      source_url: "/mock/Artifact 5.png",
      file_path: null,
      name: "Placeholder Image - Dog",
      position: 1,
      published: false,
      metadata: { width: 800, height: 600 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-3",
      project_id: projectId,
      page_id: pageId,
      type: "video",
      source_url:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      file_path: null,
      name: "Sample Video - Big Buck Bunny",
      position: 2,
      published: false,
      metadata: {
        duration: 634,
        loop: true,
        muted: true,
        thumbnail_url: "/mock/Artifact 1.png",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-4",
      project_id: projectId,
      page_id: pageId,
      type: "image",
      source_url: "/mock/Artifact 6.png",
      file_path: null,
      name: "Placeholder Image - Nature",
      position: 3,
      published: false,
      metadata: { width: 1200, height: 800 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-5",
      project_id: projectId,
      page_id: pageId,
      type: "video",
      source_url:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      file_path: null,
      name: "Sample Video - For Bigger Blazes",
      position: 4,
      published: false,
      metadata: {
        duration: 15,
        loop: true,
        muted: true,
        thumbnail_url: "/mock/Artifact 3.png",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-6",
      project_id: projectId,
      page_id: pageId,
      type: "url",
      source_url: "https://shopify.com",
      file_path: null,
      name: "Shopify Website",
      position: 5,
      published: false,
      metadata: {
        viewport: "laptop",
        width: 1512,
        height: 900,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-7",
      project_id: projectId,
      page_id: pageId,
      type: "titleCard",
      source_url: "",
      file_path: null,
      name: "Sample Title Card",
      position: 6,
      published: false,
      metadata: {
        headline: "Welcome to the Project",
        subheadline:
          "This is a sample title card with a headline and subheadline",
      },
      created_at: now,
      updated_at: now,
    },
    // Mobile App Designs artifacts
    {
      id: "art-11",
      project_id: project2Id,
      page_id: page2Id,
      type: "image",
      source_url: "/mock/Artifact 7.png",
      file_path: null,
      name: "Mobile Home Screen",
      position: 0,
      published: false,
      metadata: { width: 800, height: 1600 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-12",
      project_id: project2Id,
      page_id: page2Id,
      type: "image",
      source_url: "/mock/Artifact 1.png",
      file_path: null,
      name: "Product Detail",
      position: 1,
      published: false,
      metadata: { width: 800, height: 1600 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-13",
      project_id: project2Id,
      page_id: page2Id,
      type: "titleCard",
      source_url: "",
      file_path: null,
      name: "App Features",
      position: 2,
      published: false,
      metadata: {
        headline: "Mobile First Design",
        subheadline: "Optimized for iOS and Android",
      },
      created_at: now,
      updated_at: now,
    },
    // E-commerce Landing Page artifacts
    {
      id: "art-14",
      project_id: project3Id,
      page_id: page3Id,
      type: "image",
      source_url: "/mock/Artifact 2.png",
      file_path: null,
      name: "Hero Banner",
      position: 0,
      published: false,
      metadata: { width: 1920, height: 1080 },
      created_at: now,
      updated_at: now,
    },
    // Published artifacts without projects
    {
      id: "pub-1",
      project_id: null,
      page_id: null,
      type: "image",
      source_url: "/mock/Artifact 1.png",
      file_path: null,
      name: "Beautiful Sunset",
      position: 0,
      published: true,
      metadata: { width: 1920, height: 1080 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-2",
      project_id: null,
      page_id: null,
      type: "image",
      source_url: "/mock/Artifact 2.png",
      file_path: null,
      name: "Urban Architecture",
      position: 0,
      published: true,
      metadata: { width: 1920, height: 1080 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-3",
      project_id: null,
      page_id: null,
      type: "image",
      source_url: "/mock/Artifact 3.png",
      file_path: null,
      name: "Nature Landscape",
      position: 0,
      published: true,
      metadata: { width: 1920, height: 1080 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-4",
      project_id: null,
      page_id: null,
      type: "image",
      source_url: "/mock/Artifact 4.png",
      file_path: null,
      name: "Creative Composition",
      position: 0,
      published: true,
      metadata: { width: 1920, height: 1080 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-5",
      project_id: null,
      page_id: null,
      type: "image",
      source_url: "/mock/Artifact 5.png",
      file_path: null,
      name: "Minimalist Design",
      position: 0,
      published: true,
      metadata: { width: 1920, height: 1080 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-6",
      project_id: null,
      page_id: null,
      type: "image",
      source_url: "/mock/Artifact 6.png",
      file_path: null,
      name: "Abstract Pattern",
      position: 0,
      published: true,
      metadata: { width: 1920, height: 1080 },
      created_at: now,
      updated_at: now,
    },
    {
      id: "pub-7",
      project_id: null,
      page_id: null,
      type: "image",
      source_url: "/mock/Artifact 7.png",
      file_path: null,
      name: "Modern Aesthetic",
      position: 0,
      published: true,
      metadata: { width: 1920, height: 1080 },
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
      user_email: "dev@shopify.com",
      access_level: "owner",
      granted_by: "dev@shopify.com",
      granted_at: now,
    },
    {
      id: "access-2",
      resource_type: "folder",
      resource_id: folder2Id,
      user_email: "dev@shopify.com",
      access_level: "owner",
      granted_by: "dev@shopify.com",
      granted_at: now,
    },
    {
      id: "access-3",
      resource_type: "folder",
      resource_id: folder3Id,
      user_email: "dev@shopify.com",
      access_level: "owner",
      granted_by: "dev@shopify.com",
      granted_at: now,
    },
    // Project access
    {
      id: "access-4",
      resource_type: "project",
      resource_id: projectId,
      user_email: "dev@shopify.com",
      access_level: "owner",
      granted_by: "dev@shopify.com",
      granted_at: now,
    },
    {
      id: "access-5",
      resource_type: "project",
      resource_id: project2Id,
      user_email: "dev@shopify.com",
      access_level: "owner",
      granted_by: "dev@shopify.com",
      granted_at: now,
    },
    {
      id: "access-6",
      resource_type: "project",
      resource_id: project3Id,
      user_email: "dev@shopify.com",
      access_level: "owner",
      granted_by: "dev@shopify.com",
      granted_at: now,
    },
  ];

  console.log("[Mock] Initialized with:", {
    projects: db.projects.length,
    folders: db.folders.length,
    pages: db.pages.length,
    artifacts: db.artifacts.length,
    published: db.artifacts.filter((a: any) => a.published).length,
  });
}

// Mock collection
class Collection {
  constructor(private name: string) {
    if (!db[this.name]) db[this.name] = [];
  }

  async create(data: any) {
    const doc = {
      ...data,
      id: id(),
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
    if (this.name === "projects") {
      console.log(
        "[Mock] Returning projects:",
        result.length,
        result.map((p) => p.name)
      );
    }
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
    const filter = (items: any[]) =>
      items.filter((item) =>
        Object.entries(query).every(([k, v]) => item[k] === v)
      );
    const createQuery = (): any => ({
      find: async () => filter(db[this.name]),
      limit: (n: number) => ({
        find: async () => filter(db[this.name]).slice(0, n),
        select: (fields: string[]) => createQuery(),
      }),
      select: (fields: string[]) => createQuery(),
    });
    return createQuery();
  }

  subscribe() {
    return () => {}; // No-op unsubscribe
  }
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
              ? `/mock/Artifact ${imageIndex}.png`
              : file.type.startsWith("video/")
                ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                : `/uploads/mock-${file.name}`,
            fullUrl: file.type.startsWith("image/")
              ? `/mock/Artifact ${imageIndex}.png`
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
          ? `/mock/Artifact ${imageIndex}.png`
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
      list: async () => [
        {
          subdomain: "my-portfolio",
          url: "https://my-portfolio.quick.shopify.io",
          lastModified: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          "modified-by": "dev@shopify.com",
          thumbnail: "/mock/Artifact 1.png",
        },
        {
          subdomain: "team-dashboard",
          url: "https://team-dashboard.quick.shopify.io",
          lastModified: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000
          ).toISOString(),
          "modified-by": "dev@shopify.com",
          thumbnail: "/mock/Artifact 2.png",
        },
        {
          subdomain: "project-showcase",
          url: "https://project-showcase.quick.shopify.io",
          lastModified: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          "modified-by": "dev@shopify.com",
          thumbnail: "/mock/Artifact 3.png",
        },
        {
          subdomain: "design-system",
          url: "https://design-system.quick.shopify.io",
          lastModified: new Date(
            Date.now() - 10 * 24 * 60 * 60 * 1000
          ).toISOString(),
          "modified-by": "dev@shopify.com",
          thumbnail: "/mock/Artifact 4.png",
        },
        {
          subdomain: "api-docs",
          url: "https://api-docs.quick.shopify.io",
          lastModified: new Date(
            Date.now() - 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
          "modified-by": "dev@shopify.com",
          thumbnail: "/mock/Artifact 5.png",
        },
        {
          subdomain: "landing-page",
          url: "https://landing-page.quick.shopify.io",
          lastModified: new Date(
            Date.now() - 20 * 24 * 60 * 60 * 1000
          ).toISOString(),
          "modified-by": "dev@shopify.com",
          thumbnail: "/mock/Artifact 6.png",
        },
        {
          subdomain: "analytics-report",
          url: "https://analytics-report.quick.shopify.io",
          lastModified: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          "modified-by": "dev@shopify.com",
          thumbnail: "/mock/Artifact 7.png",
        },
      ],
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
