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
  if (db.projects?.length) return;

  const now = new Date().toISOString();
  const projectId = "sample-1";
  const pageId = "page-1";

  db.projects = [
    {
      id: projectId,
      name: "Sample Project",
      creator_id: "dev@shopify.com",
      share_token: "sample",
      folder_id: null,
      settings: {
        default_columns: 3,
        allow_viewer_control: true,
        background_color: "#ffffff",
      },
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
  ];

  db.artifacts = [
    {
      id: "art-1",
      project_id: projectId,
      page_id: pageId,
      type: "image",
      source_url: "https://picsum.photos/800/600?random=1",
      file_path: null,
      name: "Sample Image 1",
      position: 0,
      metadata: {},
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-2",
      project_id: projectId,
      page_id: pageId,
      type: "image",
      source_url: "https://picsum.photos/id/237/800/600",
      file_path: null,
      name: "Placeholder Image - Dog",
      position: 1,
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
      metadata: { duration: 634, loop: true, muted: true },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-4",
      project_id: projectId,
      page_id: pageId,
      type: "image",
      source_url: "https://picsum.photos/id/1015/1200/800",
      file_path: null,
      name: "Placeholder Image - Nature",
      position: 3,
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
      metadata: { duration: 15, loop: true, muted: true },
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
      position: 4,
      metadata: {
        viewport: "laptop",
        width: 1512,
        height: 900,
      },
      created_at: now,
      updated_at: now,
    },
  ];

  db.folders = [];
  db.folder_access = [];
  db.project_access = [];
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
    db[this.name].push(doc);
    return doc;
  }

  async find() {
    return [...db[this.name]];
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

    const createQuery: any = () => ({
      find: async () => filter(db[this.name]),
      limit: (n: number) => {
        const limitQuery = {
          find: async () => filter(db[this.name]).slice(0, n),
          limit: (n2: number) => limitQuery,
          select: (fields: string[]) => limitQuery,
        };
        return limitQuery;
      },
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
        return files.map((file, i) => ({
          originalName: file.name,
          filename: `mock-${Date.now()}-${i}-${file.name}`,
          url: file.type.startsWith("image/")
            ? `https://picsum.photos/800/600?random=${Date.now() + i}`
            : file.type.startsWith("video/")
              ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              : `/uploads/mock-${file.name}`,
          fullUrl: file.type.startsWith("image/")
            ? `https://picsum.photos/800/600?random=${Date.now() + i}`
            : file.type.startsWith("video/")
              ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              : `/uploads/mock-${file.name}`,
          size: file.size,
          mimeType: file.type,
        }));
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
        const mockUrl = file.type.startsWith("image/")
          ? `https://picsum.photos/800/600?random=${Date.now()}`
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
