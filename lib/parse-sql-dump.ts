"use client";

/**
 * Parse PostgreSQL SQL dump directly in the browser
 */

export interface ParsedUser {
  id: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  username: string;
}

export interface ParsedPost {
  id: string;
  authorId: string;
  title: string | null;
  description: string;
  tags: string[];
  reactions: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
  mentions: any[];
}

export interface ParsedMedia {
  id: string;
  filename: string;
  contentType: string;
  postId: string;
  createdAt: string;
}

export interface MigrationData {
  users: ParsedUser[];
  posts: ParsedPost[];
  media: ParsedMedia[];
  userMap: Map<string, ParsedUser>;
  mediaByPost: Map<string, ParsedMedia[]>;
}

/**
 * Parse a PostgreSQL COPY data line (tab-separated values)
 */
function parsePgCopyLine(line: string): (string | null | string[] | Record<string, any>)[] {
  const values: (string | null | string[] | Record<string, any>)[] = [];
  let current = '';
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '\t') {
      values.push(parseValue(current));
      current = '';
      i++;
    } else if (char === '\\' && i + 1 < line.length) {
      const next = line[i + 1];
      if (next === 'N') {
        current = 'NULL';
        i += 2;
      } else if (next === 't') {
        current += '\t';
        i += 2;
      } else if (next === 'n') {
        current += '\n';
        i += 2;
      } else if (next === '\\') {
        current += '\\';
        i += 2;
      } else {
        current += next;
        i += 2;
      }
    } else {
      current += char;
      i++;
    }
  }

  values.push(parseValue(current));
  return values;
}

/**
 * Parse individual field values
 */
function parseValue(value: string): string | null | string[] | Record<string, any> {
  if (value === 'NULL' || value === '') return null;

  if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
    try {
      return JSON.parse(value);
    } catch {
      if (value.startsWith('{') && !value.includes(':') && !value.includes('"')) {
        const items = value.slice(1, -1).split(',').filter(Boolean);
        return items.length > 0 ? items : [];
      }
      return value;
    }
  }

  return value;
}

/**
 * Extract table data from SQL dump
 */
function extractTableData(sqlContent: string, tableName: string): string[] {
  const copyStatement = `COPY public."${tableName}"`;
  const startIndex = sqlContent.indexOf(copyStatement);
  
  if (startIndex === -1) {
    console.warn(`Table "${tableName}" not found`);
    return [];
  }

  const dataStartMarker = 'FROM stdin;\n';
  const dataStartIndex = sqlContent.indexOf(dataStartMarker, startIndex) + dataStartMarker.length;
  const dataEndIndex = sqlContent.indexOf('\n\\.', dataStartIndex);

  if (dataEndIndex === -1) {
    console.warn(`End marker not found for table "${tableName}"`);
    return [];
  }

  const dataBlock = sqlContent.substring(dataStartIndex, dataEndIndex);
  return dataBlock.split('\n').filter(line => line.trim() && line !== '\\.');
}

/**
 * Parse the entire SQL dump
 */
export async function parseSqlDump(sqlContent: string, onProgress?: (message: string, percent: number) => void): Promise<MigrationData> {
  onProgress?.('Parsing Users...', 10);
  const userLines = extractTableData(sqlContent, 'User');
  const users: ParsedUser[] = userLines.map(line => {
    const [id, email, displayName, photoUrl, username] = parsePgCopyLine(line);
    return {
      id: id as string,
      email: email as string,
      displayName: displayName as string,
      photoUrl: photoUrl as string | null,
      username: username as string,
    };
  });

  onProgress?.('Parsing Posts...', 30);
  const postLines = extractTableData(sqlContent, 'Post');
  const posts: ParsedPost[] = postLines.map(line => {
    const [id, authorId, title, description, tags, reactions, createdAt, updatedAt, mentions] = parsePgCopyLine(line);
    return {
      id: id as string,
      authorId: authorId as string,
      title: title as string | null,
      description: description as string || '',
      tags: (tags as string[]) || [],
      reactions: (reactions as Record<string, string[]>) || {},
      createdAt: createdAt as string,
      updatedAt: updatedAt as string,
      mentions: (mentions as any[]) || [],
    };
  });

  onProgress?.('Parsing Media...', 60);
  const mediaLines = extractTableData(sqlContent, 'Media');
  const media: ParsedMedia[] = mediaLines.map(line => {
    const [id, filename, contentType, postId, createdAt] = parsePgCopyLine(line);
    return {
      id: id as string,
      filename: filename as string,
      contentType: contentType as string,
      postId: postId as string,
      createdAt: createdAt as string,
    };
  });

  onProgress?.('Building lookup maps...', 80);
  const userMap = new Map<string, ParsedUser>();
  users.forEach(user => userMap.set(user.id, user));

  const mediaByPost = new Map<string, ParsedMedia[]>();
  media.forEach(m => {
    if (!mediaByPost.has(m.postId)) {
      mediaByPost.set(m.postId, []);
    }
    mediaByPost.get(m.postId)!.push(m);
  });

  onProgress?.('Parsing complete!', 100);

  return {
    users,
    posts,
    media,
    userMap,
    mediaByPost,
  };
}

/**
 * Fetch and parse the SQL dump from public directory
 */
export async function fetchAndParseSqlDump(onProgress?: (message: string, percent: number) => void): Promise<MigrationData> {
  onProgress?.('Downloading SQL dump...', 0);
  const response = await fetch('/_migration/Cloud_SQL_Export_2025-11-26 (09_50_04).sql');
  if (!response.ok) {
    throw new Error(`Failed to fetch SQL dump: ${response.statusText}`);
  }

  onProgress?.('Reading SQL dump...', 5);
  const sqlContent = await response.text();
  
  return parseSqlDump(sqlContent, onProgress);
}

