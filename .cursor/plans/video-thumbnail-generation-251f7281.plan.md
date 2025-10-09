<!-- 251f7281-4e82-4b51-adbf-d9dcd4182fed 79da27ff-e337-4b6a-9785-e418b1356a3f -->
# Video Thumbnail Generation

## Overview

Generate thumbnails for video artifacts by extracting the first frame using mediabunny, uploading to Quick.fs, and storing the URL in artifact metadata for display in project cards.

## Implementation

### 1. Install mediabunny

Install the mediabunny package for video frame extraction:

```bash
pnpm install mediabunny
```

### 2. Create Video Thumbnail Utility

Create `lib/video-thumbnails.ts` with:

- `generateVideoThumbnail(videoFile: File): Promise<Blob>` - Extract first frame using mediabunny's `BlobSource`, `Input`, and `CanvasSink`
- Use similar approach to `thumbnail-generation.ts` but simplified for single frame at timestamp 0
- Return a canvas-rendered image blob (JPEG format for smaller size)

### 3. Create Thumbnail Upload Handler

In `lib/video-thumbnails.ts`, add:

- `generateAndUploadThumbnail(videoFile: File, artifactId: string): Promise<void>`
- Generates thumbnail, uploads to Quick.fs, updates artifact metadata with `thumbnail_url`
- Handles errors gracefully (thumbnails are nice-to-have, shouldn't block artifact creation)

### 4. Integrate into Upload Flow

Update `components/upload/ArtifactAdder.tsx` (lines 88-120):

- After creating video artifact, trigger thumbnail generation asynchronously
- Call `generateAndUploadThumbnail()` with the video file and created artifact ID
- Don't await - let it run in background
- Consider toast notification when thumbnail is ready

Also update `app/p/page.tsx` (lines 194-224) for the drag-drop upload flow.

### 5. Update Thumbnail Display

Modify `components/presentation/ArtifactThumbnail.tsx` (lines 41-48):

- Check for `artifact.metadata.thumbnail_url` for video types
- If present, display as image (like image artifacts)
- If not present, fall back to current Play icon placeholder
- Use `loading="lazy"` for performance

### 6. Type Safety

Update `types/index.ts` to document the metadata structure:

```typescript
export type VideoMetadata = {
  thumbnail_url?: string;
  hideUI?: boolean;
  loop?: boolean;
  muted?: boolean;
}
```

## Storage Pattern

- Video file: stored at `artifact.source_url` (uploaded to Quick.fs)
- Thumbnail image: stored at `artifact.metadata.thumbnail_url` (also on Quick.fs)
- This matches the pattern where images use `source_url` directly

## URL Screenshots

Deferred to future work - no changes needed for URL artifacts at this time.

### To-dos

- [ ] Install mediabunny package
- [ ] Create lib/video-thumbnails.ts with thumbnail generation logic
- [ ] Add async thumbnail generation to ArtifactAdder upload flow
- [ ] Add async thumbnail generation to page.tsx drag-drop upload
- [ ] Update ArtifactThumbnail to show video thumbnails
- [ ] Add VideoMetadata type definition