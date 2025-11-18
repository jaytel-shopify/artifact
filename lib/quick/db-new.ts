import { waitForQuick } from "./index";
import type { Artifact, Folder, FolderArtifact, FolderMember } from "@/types";

/****************
 ***** CORE *****
 ****************/
let _folders: Folder[] = [];
export const _getAllFolders = async (): Promise<Folder[]> => {
  if (_folders.length > 0) return _folders;
  const quick = await waitForQuick();
  const foldersCollection = quick.db.collection("folders");
  _folders = await foldersCollection.find();
  return _folders;
};

let _artifacts: Artifact[] = [];
export const _getAllArtifacts = async (): Promise<Artifact[]> => {
  if (_artifacts.length > 0) return _artifacts;
  const quick = await waitForQuick();
  const artifactsCollection = quick.db.collection("artifacts");
  _artifacts = await artifactsCollection.find();
  return _artifacts;
};

let _foldersArtifacts: FolderArtifact[] = [];
export const _getAllFoldersArtifacts = async (): Promise<FolderArtifact[]> => {
  if (_foldersArtifacts.length > 0) return _foldersArtifacts;
  const quick = await waitForQuick();
  const foldersArtifactsCollection = quick.db.collection("folders-artifacts");
  _foldersArtifacts = await foldersArtifactsCollection.find();
  return _foldersArtifacts;
};

let _folderMembers: FolderMember[] = [];
export const _getAllFolderMembers = async (): Promise<FolderMember[]> => {
  if (_folderMembers.length > 0) return _folderMembers;
  const quick = await waitForQuick();
  const folderMembersCollection = quick.db.collection("folders-members");
  _folderMembers = await folderMembersCollection.find();
  return _folderMembers;
};

/******************
 ***** CREATE *****
 ******************/

export const createFolder = async (args: Partial<Folder>): Promise<Folder> => {
  const quick = await waitForQuick();

  const data = {
    id: crypto.randomUUID(),
    title: args.title || "",
    owner_id: args.owner_id || quick.id.user.id,
    depth: args.depth || 0,
    parent_id: args.parent_id || null,
    position: args.position || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Folder;

  const foldersCollection = quick.db.collection("folders");
  const createNewFolder = foldersCollection.create(data);

  const foldersMembersCollection = quick.db.collection("folders-members");
  const createNewFolderMember = foldersMembersCollection.create({
    folder_id: data.id,
    user_id: args.owner_id || quick.id.user.id,
    role: "owner",
  });

  await Promise.all([createNewFolder, createNewFolderMember]);

  return createNewFolder;
};

/*****************
 ***** READ ******
 *****************/

export const getFoldersByDepth = async (depth: number): Promise<Folder[]> => {
  const folders = await _getAllFolders();
  return folders.filter((folder) => folder.depth === depth);
};

export const getChildren = async (
  parentId: string
): Promise<(Folder | Artifact)[]> => {
  const folders = await _getAllFolders();
  const childFolders = folders.filter(
    (folder) => folder.parent_id === parentId
  );

  const childArtifacts = await getArtifactsByFolderId(parentId);

  return [...childFolders, ...childArtifacts];
};

export const getChildFolders = async (
  parentId: string
): Promise<(Folder | Artifact)[]> => {
  const folders = await _getAllFolders();
  const childFolders = folders.filter(
    (folder) => folder.parent_id === parentId
  );

  return childFolders;
};

export const getFolderById = async (
  folderId: string
): Promise<Folder | null> => {
  const folders = await _getAllFolders();
  return folders.find((folder) => folder.id === folderId) || null;
};

export const getArtifactsByFolderId = async (
  folderId: string
): Promise<Artifact[]> => {
  const folderArtifacts = await _getAllFoldersArtifacts();
  const childArtifactsIds = folderArtifacts
    .filter((artifact) => artifact.folder_id === folderId)
    .map((artifact) => artifact.artifact_id);

  if (childArtifactsIds.length === 0) {
    const childFolders = await getChildFolders(folderId);
    return getArtifactsByFolderId(childFolders[0].id);
  }

  const artifacts = await _getAllArtifacts();
  return artifacts.filter((artifact) =>
    childArtifactsIds.includes(artifact.id)
  );
};
