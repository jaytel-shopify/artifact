"use client";

import { waitForQuick } from "./quick";

/**
 * Database Explorer
 * 
 * Service for exploring Quick.db collections in Artifact.
 * Read-only operations for admin database visualization.
 */

export interface CollectionInfo {
  name: string;
  documentCount: number;
  documents: any[];
  schema: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: string;
  nullable: boolean;
}

/**
 * All known collections in Artifact
 */
export const KNOWN_COLLECTIONS = [
  "projects",
  "pages", 
  "artifacts",
  "project_access",
  "folders",
  "folder_access",
  "allowed_users"
] as const;

export type CollectionName = typeof KNOWN_COLLECTIONS[number];

/**
 * Get all collections with their document counts
 */
export async function getAllCollections(): Promise<CollectionInfo[]> {
  const quick = await waitForQuick();
  
  const collectionsInfo: CollectionInfo[] = [];
  
  for (const collectionName of KNOWN_COLLECTIONS) {
    try {
      const collection = quick.db.collection(collectionName);
      const documents = await collection.find();
      const schema = inferSchema(documents);
      
      collectionsInfo.push({
        name: collectionName,
        documentCount: documents.length,
        documents,
        schema
      });
    } catch (error) {
      console.error(`Failed to fetch collection ${collectionName}:`, error);
      collectionsInfo.push({
        name: collectionName,
        documentCount: 0,
        documents: [],
        schema: []
      });
    }
  }
  
  return collectionsInfo;
}

/**
 * Get documents from a specific collection
 */
export async function getCollectionDocuments(collectionName: CollectionName): Promise<any[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection(collectionName);
  return await collection.find();
}

/**
 * Infer schema from a collection's documents
 */
export function inferSchema(documents: any[]): SchemaField[] {
  if (documents.length === 0) return [];
  
  const fieldMap = new Map<string, Set<string>>();
  const nullableFields = new Set<string>();
  
  // Analyze all documents to find all fields and their types
  documents.forEach(doc => {
    const fields = Object.keys(doc);
    const allFieldsInDoc = new Set(fields);
    
    // Track which fields are missing (nullable)
    fieldMap.forEach((_, fieldName) => {
      if (!allFieldsInDoc.has(fieldName)) {
        nullableFields.add(fieldName);
      }
    });
    
    fields.forEach(field => {
      const value = doc[field];
      const type = getType(value);
      
      if (!fieldMap.has(field)) {
        fieldMap.set(field, new Set());
      }
      fieldMap.get(field)!.add(type);
      
      // If value is null or undefined, mark as nullable
      if (value === null || value === undefined) {
        nullableFields.add(field);
      }
    });
  });
  
  // Convert to SchemaField array
  const schema: SchemaField[] = [];
  fieldMap.forEach((types, name) => {
    const typeString = Array.from(types).join(" | ");
    schema.push({
      name,
      type: typeString,
      nullable: nullableFields.has(name)
    });
  });
  
  // Sort: id, created_at, updated_at first, then alphabetically
  schema.sort((a, b) => {
    const priority = ["id", "created_at", "updated_at"];
    const aPriority = priority.indexOf(a.name);
    const bPriority = priority.indexOf(b.name);
    
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
  
  return schema;
}

/**
 * Get the type of a value
 */
function getType(value: any): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "unknown";
}

/**
 * Database relationships for schema visualization
 */
export interface DatabaseRelationship {
  from: CollectionName;
  to: CollectionName;
  type: "one-to-many" | "many-to-one" | "many-to-many";
  foreignKey: string;
  label: string;
}

export const DATABASE_RELATIONSHIPS: DatabaseRelationship[] = [
  {
    from: "projects",
    to: "pages",
    type: "one-to-many",
    foreignKey: "project_id",
    label: "has pages"
  },
  {
    from: "pages",
    to: "artifacts",
    type: "one-to-many",
    foreignKey: "page_id",
    label: "has artifacts"
  },
  {
    from: "projects",
    to: "project_access",
    type: "one-to-many",
    foreignKey: "project_id",
    label: "shared with"
  },
  {
    from: "folders",
    to: "projects",
    type: "one-to-many",
    foreignKey: "folder_id",
    label: "contains projects"
  },
  {
    from: "folders",
    to: "folder_access",
    type: "one-to-many",
    foreignKey: "folder_id",
    label: "shared with"
  }
];

