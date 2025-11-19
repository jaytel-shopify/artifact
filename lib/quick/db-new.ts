import { waitForQuick } from "./index";
import type {
  Artifact,
  Folder,
  FolderArtifact,
  FolderMember,
  Role,
} from "@/types";

/****************
 ***** CORE *****
 ****************/
export const getAllFolders = async (): Promise<Folder[]> => {
  const quick = await waitForQuick();
  const foldersCollection = quick.db.collection("folders");
  return await foldersCollection.orderBy("created_at", "desc").find();
};

export const getAllArtifacts = async (): Promise<Artifact[]> => {
  const quick = await waitForQuick();
  const artifactsCollection = quick.db.collection("artifacts");
  return await artifactsCollection.find();
};

export const getAllFoldersArtifacts = async (): Promise<FolderArtifact[]> => {
  const quick = await waitForQuick();
  const foldersArtifactsCollection = quick.db.collection("folders-artifacts");
  return await foldersArtifactsCollection.find();
};

export const getAllFolderMembers = async (): Promise<FolderMember[]> => {
  const quick = await waitForQuick();
  const folderMembersCollection = quick.db.collection("folders-members");
  return await folderMembersCollection.find();
};

/******************
 ***** CREATE *****
 ******************/

export const createFolder = async (args: Partial<Folder>): Promise<Folder> => {
  if (!args.title) {
    throw new Error("title is required");
  }

  const quick = await waitForQuick();

  const now = new Date().toISOString();
  const data = {
    id: self.crypto.randomUUID(),
    title: args.title || "",
    owner_id: args.owner_id || quick.id.user.id,
    depth: args.depth || 0,
    parent_id: args.parent_id || null,
    position: args.position || 0,
    created_at: now,
    updated_at: now,
  } as Folder;

  const foldersCollection = quick.db.collection("folders");
  const newFolder = await foldersCollection.create(data);

  const foldersMembersCollection = quick.db.collection("folders-members");
  const newFolderMember = await foldersMembersCollection.create({
    folder_id: newFolder.id,
    user_id: args.owner_id || quick.id.user.id,
    role: "owner",
  });

  return newFolder;
};

export const createArtifact = async (args: {
  title: string;
  url: string;
  folder_id: string;
  position: number;
}): Promise<Artifact> => {
  if (!args.title || !args.url || !args.folder_id) {
    throw new Error("title, url and folder_id are required");
  }

  const quick = await waitForQuick();
  const artifactsCollection = quick.db.collection("artifacts");
  const foldersArtifactsCollection = quick.db.collection("folders-artifacts");

  const newArtifact = await artifactsCollection.create({
    type: "url",
    title: args.title,
    content: {
      url: args.url,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author_id: quick.id.user.id,
    visibility: "private",
  } as Artifact);

  await foldersArtifactsCollection.create({
    folder_id: args.folder_id,
    artifact_id: newArtifact.id,
    created_at: new Date().toISOString(),
    position: args.position || 0,
  });

  return newArtifact;
};

export const createFolderMember = async (args: {
  folder_id: string;
  user_id: string;
  role?: Role;
}): Promise<FolderMember> => {
  if (!args.folder_id || !args.user_id) {
    throw new Error("Folder ID and user ID are required");
  }

  const quick = await waitForQuick();
  const foldersMembersCollection = quick.db.collection("folders-members");

  return await foldersMembersCollection.create({
    folder_id: args.folder_id,
    user_id: args.user_id,
    role: args.role || "viewer",
  });
};

/*****************
 ***** READ ******
 *****************/

export const getFoldersByDepth = async (depth: number): Promise<Folder[]> => {
  const folders = await getAllFolders();
  return folders.filter((folder) => folder.depth === depth);
};

export const getChildren = async (
  folderId: string | null,
  deep: boolean = false
): Promise<(Folder | Artifact)[]> => {
  if (!folderId) return [];

  const folders = await getAllFolders();
  const childFolders = folders.filter(
    (folder) => folder.parent_id === folderId
  );

  if (!deep) return childFolders;

  const childArtifacts = await getArtifactsByFolderId(folderId);

  return [...childFolders, ...childArtifacts];
};

export const getFolderById = async (
  folderId: string | null
): Promise<Folder | null> => {
  if (!folderId) return null;
  const folders = await getAllFolders();
  return folders.find((folder) => folder.id === folderId) || null;
};

export const getArtifactsByFolderId = async (
  folderId: string
): Promise<Artifact[]> => {
  const folderArtifacts = await getAllFoldersArtifacts();
  const childArtifactsIds = folderArtifacts
    .filter((artifact) => artifact.folder_id === folderId)
    .map((artifact) => artifact.artifact_id);

  if (childArtifactsIds.length === 0) {
    const childFolders = await getChildren(folderId, false);
    if (!childFolders.length) return [];
    return getArtifactsByFolderId(childFolders[0].id);
  }

  const artifacts = await getAllArtifacts();
  return artifacts.filter((artifact) =>
    childArtifactsIds.includes(artifact.id)
  );
};

export const getFolderMembersByFolderId = async (
  folderId: string | null
): Promise<FolderMember[]> => {
  if (!folderId) return [];
  const folderMembers = await getAllFolderMembers();
  return folderMembers.filter((member) => member.folder_id === folderId);
};

export const getFolderMembersByMemberId = async (
  memberId: string | null
): Promise<FolderMember[]> => {
  if (!memberId) return [];
  const folderMembers = await getAllFolderMembers();
  return folderMembers.filter((member) => member.id === memberId);
};

export const getFolderMember = async (args: {
  memberId: string;
  folderId: string;
}): Promise<FolderMember | null> => {
  if (!args.memberId || !args.folderId) {
    throw new Error("memberId and folderId are required");
  }

  const folderMembers = await getAllFolderMembers();
  const member = folderMembers.find(
    (member) =>
      member.id === args.memberId && member.folder_id === args.folderId
  );
  return member || null;
};

/*******************
 ***** UPDATE ******
 ******************/

export const updateArtifact = async (
  artifactId: string,
  updates: Partial<Artifact>
): Promise<Artifact> => {
  const quick = await waitForQuick();
  const artifactsCollection = quick.db.collection("artifacts");
  await artifactsCollection.update(artifactId, updates);
  return await artifactsCollection.findById(artifactId);
};

export const updateFolder = async (
  folderId: string,
  updates: Partial<Folder>
): Promise<Folder> => {
  const quick = await waitForQuick();
  const foldersCollection = quick.db.collection("folders");
  await foldersCollection.update(folderId, updates);
  return await foldersCollection.findById(folderId);
};

export const updateFolderMember = async (
  memberId: string,
  folderId: string,
  updates: Partial<FolderMember>
): Promise<FolderMember> => {
  if (!memberId || !folderId || !updates) {
    throw new Error("memberId, folderId and updates are required");
  }

  const quick = await waitForQuick();
  const foldersMembersCollection = quick.db.collection("folders-members");
  const member = await getFolderMember({ memberId, folderId });
  if (!member) {
    throw new Error("Member not found");
  }
  await foldersMembersCollection.update(member.id, updates);
  return await foldersMembersCollection.findById(member.id);
};

/*******************
 ***** DELETE ******
 ******************/

export const deleteArtifact = async (artifactId: string): Promise<void> => {
  const quick = await waitForQuick();
  const artifactsCollection = quick.db.collection("artifacts");
  await artifactsCollection.delete(artifactId);
};

export const deleteFolder = async (folderId: string): Promise<void> => {
  const quick = await waitForQuick();

  // delete members
  await deleteFolderMembersByFolderId(folderId);

  // delete child folders
  const childFolders = await getChildren(folderId);
  await Promise.all(childFolders.map((folder) => deleteFolder(folder.id)));

  // delete folder
  const foldersCollection = quick.db.collection("folders");
  await foldersCollection.delete(folderId);
};

export const deleteFolderMembersByFolderId = async (
  folderId: string
): Promise<void> => {
  const quick = await waitForQuick();
  const foldersMembersCollection = quick.db.collection("folders-members");
  const members = await getFolderMembersByFolderId(folderId);
  await Promise.all(
    members.map((member) => foldersMembersCollection.delete(member.id))
  );
};

export const deleteFolderMemberByMemberId = async (
  memberId: string
): Promise<void> => {
  const quick = await waitForQuick();
  const foldersMembersCollection = quick.db.collection("folders-members");
  const members = await getFolderMembersByMemberId(memberId);
  await Promise.all(
    members.map((member) => foldersMembersCollection.delete(member.id))
  );
};
