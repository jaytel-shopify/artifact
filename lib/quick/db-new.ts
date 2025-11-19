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
let _folders: Folder[] = [];
export const getAllFolders = async (): Promise<Folder[]> => {
  if (_folders.length > 0) return _folders;

  const quick = await waitForQuick();

  const folderMembers = await getAllFolderMembers();
  const myFolderIds = folderMembers
    .filter((member) => member.user_id === quick.id.user.id)
    .map((member) => member.folder_id);

  const foldersCollection = quick.db.collection("folders");

  // get all folders that are directly assigned to the user
  const folders = await foldersCollection
    .where({ id: { $in: myFolderIds } })
    .orderBy("created_at", "desc")
    .find();

  // get all folders that are children of the folders directly assigned to the user
  let childFolders: Folder[] = [];
  const getChildFolders = async (folderIds: string[]): Promise<void> => {
    if (folderIds.length === 0) return;

    const folders = await foldersCollection
      .where({ parent_id: { $in: folderIds } })
      .orderBy("created_at", "desc")
      .find();

    if (folders.length === 0) return;

    childFolders = [...childFolders, ...folders];

    // Recursively get children of the newly found folders
    const newFolderIds = folders.map((f) => f.id);
    await getChildFolders(newFolderIds);
  };

  await getChildFolders(myFolderIds);

  // get all parent folders for navigation (but not their siblings)
  let parentFolders: Folder[] = [];
  const getParentFolders = async (foldersToCheck: Folder[]): Promise<void> => {
    const parentIds = foldersToCheck
      .map((f) => f.parent_id)
      .filter((id): id is string => id !== null && id !== undefined);

    if (parentIds.length === 0) return;

    const parents = await foldersCollection
      .where({ id: { $in: parentIds } })
      .find();

    if (parents.length === 0) return;

    // Only add parents that aren't already in our list
    const newParents = parents.filter(
      (p) => !parentFolders.some((existing) => existing.id === p.id)
    );

    parentFolders = [...parentFolders, ...newParents];

    // Recursively get parents of these parents
    await getParentFolders(newParents);
  };

  await getParentFolders(folders);

  _folders = [...folders, ...childFolders, ...parentFolders];
  return _folders;
};

let _artifacts: Artifact[] = [];
export const getAllArtifacts = async (): Promise<Artifact[]> => {
  if (_artifacts.length > 0) return _artifacts;
  const quick = await waitForQuick();
  const artifactsCollection = quick.db.collection("artifacts");
  _artifacts = await artifactsCollection.find();
  return _artifacts;
};

let _foldersArtifacts: FolderArtifact[] = [];
export const getAllFoldersArtifacts = async (): Promise<FolderArtifact[]> => {
  if (_foldersArtifacts.length > 0) return _foldersArtifacts;
  const quick = await waitForQuick();
  const foldersArtifactsCollection = quick.db.collection("folders-artifacts");
  _foldersArtifacts = await foldersArtifactsCollection.find();
  return _foldersArtifacts;
};

let _folderMembers: FolderMember[] = [];
export const getAllFolderMembers = async (): Promise<FolderMember[]> => {
  if (_folderMembers.length > 0) return _folderMembers;
  const quick = await waitForQuick();
  const folderMembersCollection = quick.db.collection("folders-members");
  _folderMembers = await folderMembersCollection
    .where({ user_id: quick.id.user.id })
    .find();
  return _folderMembers;
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

  _folderMembers = [newFolderMember, ..._folderMembers];
  _folders = [newFolder, ..._folders];
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

  const newFolderArtifact = await foldersArtifactsCollection.create({
    folder_id: args.folder_id,
    artifact_id: newArtifact.id,
    created_at: new Date().toISOString(),
    position: args.position || 0,
  });

  _artifacts = [newArtifact, ..._artifacts];
  _foldersArtifacts = [newFolderArtifact, ..._foldersArtifacts];
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

  const newFolderMember = await foldersMembersCollection.create({
    folder_id: args.folder_id,
    user_id: args.user_id,
    role: args.role || "viewer",
  });

  _folderMembers = [newFolderMember, ..._folderMembers];
  return newFolderMember;
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
  const quick = await waitForQuick();
  const foldersCollection = quick.db.collection("folders");
  return await foldersCollection.findById(folderId);
};

export const getArtifactsByFolderId = async (
  folderId: string
): Promise<Artifact[]> => {
  const quick = await waitForQuick();
  const foldersArtifactsCollection = quick.db.collection("folders-artifacts");
  const folderArtifacts = await foldersArtifactsCollection
    .where({ folder_id: folderId })
    .find();

  const artifactsCollection = quick.db.collection("artifacts");
  return await artifactsCollection
    .where({
      id: { $in: folderArtifacts.map((artifact) => artifact.artifact_id) },
    })
    .find();
};

export const getFolderMembersByFolderId = async (
  folderId: string | null
): Promise<FolderMember[]> => {
  if (!folderId) return [];
  const quick = await waitForQuick();
  const folderMembersCollection = quick.db.collection("folders-members");
  return await folderMembersCollection.where({ folder_id: folderId }).find();
};

export const getFolderMembersByMemberId = async (
  memberId: string | null
): Promise<FolderMember[]> => {
  if (!memberId) return [];
  const quick = await waitForQuick();
  const folderMembersCollection = quick.db.collection("folders-members");
  return await folderMembersCollection.where({ user_id: memberId }).find();
};

export const getFolderMember = async (args: {
  memberId: string;
  folderId: string;
}): Promise<FolderMember | null> => {
  if (!args.memberId || !args.folderId) {
    throw new Error("memberId and folderId are required");
  }
  const quick = await waitForQuick();
  const folderMembersCollection = quick.db.collection("folders-members");
  const member = await folderMembersCollection
    .where({ user_id: args.memberId, folder_id: args.folderId })
    .limit(1)
    .find();
  return member[0] || null;
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
  const updatedArtifact = await artifactsCollection.findById(artifactId);
  if (!updatedArtifact) {
    throw new Error("Artifact not found");
  }
  _artifacts = _artifacts.map((artifact) =>
    artifact.id === artifactId ? updatedArtifact : artifact
  );
  return updatedArtifact;
};

export const updateFolder = async (
  folderId: string,
  updates: Partial<Folder>
): Promise<Folder> => {
  const quick = await waitForQuick();
  const foldersCollection = quick.db.collection("folders");
  await foldersCollection.update(folderId, updates);
  const updatedFolder = await foldersCollection.findById(folderId);
  if (!updatedFolder) {
    throw new Error("Folder not found");
  }
  _folders = _folders.map((folder) =>
    folder.id === folderId ? updatedFolder : folder
  );
  return updatedFolder;
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
  const updatedMember = await foldersMembersCollection.findById(member.id);
  if (!updatedMember) {
    throw new Error("Member not found");
  }
  _folderMembers = _folderMembers.map((member) =>
    member.id === member.id ? updatedMember : member
  );
  return updatedMember;
};

/*******************
 ***** DELETE ******
 ******************/

export const deleteArtifact = async (artifactId: string): Promise<void> => {
  const quick = await waitForQuick();
  const artifactsCollection = quick.db.collection("artifacts");
  await artifactsCollection.delete(artifactId);
  const folderArtifactsCollection = quick.db.collection("folders-artifacts");
  await folderArtifactsCollection.delete(artifactId);
  _artifacts = _artifacts.filter((artifact) => artifact.id !== artifactId);
  _foldersArtifacts = _foldersArtifacts.filter(
    (folderArtifact) => folderArtifact.artifact_id !== artifactId
  );
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
  _folders = _folders.filter((folder) => folder.id !== folderId);
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
  _folderMembers = _folderMembers.filter((member) => member.id !== folderId);
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
  _folderMembers = _folderMembers.filter((member) => member.id !== memberId);
};
