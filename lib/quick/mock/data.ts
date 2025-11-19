import type { Folder, Artifact, FolderArtifact, FolderMember } from "@/types";

export const get = () => {
  const now = new Date().toISOString();

  const artifacts = [
    {
      id: "art-1",
      type: "image",
      title: "Sample Image 1",
      content: {
        url: "https://picsum.photos/800/600?random=1",
        width: 800,
        height: 600,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-2",
      type: "image",
      title: "Placeholder Image - Dog",
      content: {
        url: "https://picsum.photos/id/237/800/600",
        width: 800,
        height: 600,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-3",
      type: "video",
      title: "Sample Video - Big Buck Bunny",
      content: {
        url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnail_url: "https://picsum.photos/800/600?random=17",
        width: 1200,
        height: 800,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-4",
      type: "image",
      title: "Placeholder Image - Nature",
      content: {
        url: "https://picsum.photos/id/1015/1200/800",
        width: 1200,
        height: 800,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-5",
      type: "video",
      title: "Sample Video - For Bigger Blazes",
      content: {
        url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumbnail_url: "https://picsum.photos/800/600?random=17",
        width: 1200,
        height: 800,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-6",
      type: "url",
      title: "Shopify Website",
      content: {
        url: "https://shopify.com",
        viewport: "laptop",
        width: 1512,
        height: 900,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-7",
      type: "titleCard",
      title: "Sample Title Card",
      content: {
        headline: "Welcome to the Project",
        subheadline:
          "This is a sample title card with a headline and subheadline",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-8",
      type: "image",
      title: "Sample Image 8",
      content: {
        url: "https://picsum.photos/800/600?random=16",
        width: 800,
        height: 600,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-9",
      type: "image",
      title: "Sample Image 9",
      content: {
        url: "https://picsum.photos/800/600?random=20",
        width: 800,
        height: 600,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "art-10",
      type: "image",
      title: "Sample Image 10",
      content: {
        url: "https://picsum.photos/800/600?random=10",
        width: 800,
        height: 600,
      },
      created_at: now,
      updated_at: now,
    },
  ] as Artifact[];

  const folders = [
    {
      id: "folder-1",
      title: "Sample Folder 1",
      owner_id: "user-1",
      depth: 0,
      parent_id: null,
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: "folder-2",
      title: "Sample Folder 2",
      owner_id: "user-1",
      depth: 0,
      parent_id: null,
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: "project-1",
      title: "Sample Project 1",
      owner_id: "user-1",
      depth: 1,
      parent_id: null,
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: "project-11",
      title: "Sample Project 11",
      owner_id: "user-1",
      depth: 1,
      parent_id: "folder-1",
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: "project-2",
      title: "Sample Project 2",
      owner_id: "user-1",
      depth: 1,
      parent_id: "folder-2",
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: "page-1",
      title: "Sample Page 1",
      owner_id: "user-1",
      depth: 2,
      parent_id: "project-1",
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: "page-11",
      title: "Sample Page 11",
      owner_id: "user-1",
      depth: 2,
      parent_id: "project-11",
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: "page-2",
      title: "Sample Page 2",
      owner_id: "user-1",
      depth: 2,
      parent_id: "project-2",
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: "collection-1",
      title: "Sample Collection 1",
      owner_id: "user-1",
      depth: 3,
      parent_id: "page-1",
      position: 0,
      created_at: now,
      updated_at: now,
    },
  ] as Folder[];

  const foldersArtifacts = [
    {
      folder_id: "page-1",
      artifact_id: "art-1",
      created_at: now,
      position: 0,
    },
    {
      folder_id: "page-1",
      artifact_id: "art-2",
      created_at: now,
      position: 1,
    },
    {
      folder_id: "page-1",
      artifact_id: "art-3",
      created_at: now,
      position: 2,
    },
    {
      folder_id: "page-1",
      artifact_id: "art-4",
      created_at: now,
      position: 3,
    },
    {
      folder_id: "page-1",
      artifact_id: "art-5",
      created_at: now,
      position: 4,
    },
    {
      folder_id: "page-11",
      artifact_id: "art-4",
      created_at: now,
      position: 3,
    },
    {
      folder_id: "page-11",
      artifact_id: "art-5",
      created_at: now,
      position: 4,
    },
    {
      folder_id: "page-11",
      artifact_id: "art-6",
      created_at: now,
      position: 5,
    },
    {
      folder_id: "page-11",
      artifact_id: "art-7",
      created_at: now,
      position: 6,
    },
    {
      folder_id: "page-2",
      artifact_id: "art-8",
      created_at: now,
      position: 7,
    },
    {
      folder_id: "page-1",
      artifact_id: "art-9",
      created_at: now,
      position: 8,
    },
    {
      folder_id: "page-1",
      artifact_id: "art-10",
      created_at: now,
      position: 9,
    },
    {
      folder_id: "page-2",
      artifact_id: "art-9",
      created_at: now,
      position: 8,
    },
    {
      folder_id: "page-2",
      artifact_id: "art-10",
      created_at: now,
      position: 9,
    },
  ] as FolderArtifact[];

  const folderMembers = [
    {
      folder_id: "folder-1",
      user_id: "user-1",
      role: "owner",
    },
    {
      folder_id: "project-1",
      user_id: "user-1",
      role: "owner",
    },
    {
      folder_id: "project-2",
      user_id: "user-1",
      role: "owner",
    },
  ] as FolderMember[];

  return {
    artifacts,
    folders,
    foldersArtifacts,
    folderMembers,
  };
};
