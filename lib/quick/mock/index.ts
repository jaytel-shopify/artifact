"use client";

import { get as getMockData } from "./data";
import type { QuickIdentity } from "../types";
import db from "./db";

export const mockUser: QuickIdentity = {
  id: "user-1",
  email: "dev@shopify.com",
  fullName: "Local Developer",
  firstName: "Local",
  slackHandle: "local-dev",
  slackImageUrl: "https://i.pravatar.cc/150?u=dev@shopify.com",
  title: "Developer",
  timestamp: new Date().toISOString(),
};

const init = () => {
  const { artifacts, folders, foldersArtifacts, folderMembers } = getMockData();
  db.collection("artifacts").create(artifacts);
  db.collection("folders").create(folders);
  db.collection("folders-artifacts").create(foldersArtifacts);
  db.collection("folders-members").create(folderMembers);
};

export function createMockQuick() {
  init();

  return {
    db: db,
    fs: {
      async upload(files: File[]) {
        return files.map((file, i) => ({
          originaltitle: file.name,
          filetitle: `mock-${Date.now()}-${i}-${file.name}`,
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
          originaltitle: file.name,
          filetitle: `mock-${Date.now()}-${file.name}`,
          url: mockUrl,
          fullUrl: mockUrl,
          size: file.size,
          mimeType: file.type,
        };
      },
    },
    id: {
      user: mockUser as QuickIdentity,
      ...mockUser,
      waitForUser: async function () {
        return mockUser as QuickIdentity;
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
        user: { socketId: "", title: "", email: "", state: {} },
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
