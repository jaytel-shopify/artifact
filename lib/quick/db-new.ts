import { waitForQuick } from "./index";
import type { Artifact, Folder, FolderArtifact, FolderMember } from "@/types";

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

export const getFolderMembers = async (
  folderId: string | null
): Promise<FolderMember[]> => {
  if (!folderId) return [];
  const folderMembers = await getAllFolderMembers();
  return folderMembers.filter((member) => member.folder_id === folderId);
};
