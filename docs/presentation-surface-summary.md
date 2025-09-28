# Presentation Surface Implementation Summary

This document captures the full front-end behaviour for the drag-and-drop presentation surface (columns, artifacts, uploads, URL embeds) so it can be re-implemented elsewhere.

---

## 1. Core Concepts

- **Artifacts**: Records with `id`, `type` (`image | video | pdf | url | figma`), `source_url`, optional `file_path`, `position`, and `metadata`. Ordering is tracked with an integer `position`.
- **Columns**: The canvas shows artifacts in a horizontal row of columns. Column count is user-controlled (1–8) and stored in `localStorage` (`columns_in_view`).
- **Viewport Height**: The visible region height is measured at runtime so tall artifacts scroll within their column instead of overflowing the page.
- **Drag & Drop**: Implemented with `@dnd-kit` (PointerSensor + Sortable utilities). Drag operations reorder artifacts and auto-scroll the container near edges.
- **Uploads**: Media uploads go through `/api/upload` (multipart to Supabase Storage). URL embeds use `/api/embed/preview` to determine iframe support and fetch OpenGraph metadata.

---

## 2. Dependencies

- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`
- `@radix-ui/react-slider` (column slider)
- `react-dropzone` (optional: we use native drag events for global drop overlay)
- `react-use-measure` can be replaced by manual `ResizeObserver`
- Optional animation: CSS transitions (no need for Framer Motion)

---

## 3. Page Shell (`PresentationPage`)

Responsibilities:

1. **Data Fetching**
   - `useSWR` for project (`/api/projects/by-share?token=`) and artifacts (`/api/projects/{id}/artifacts`).
2. **State**
   - `columns`: number (persisted to localStorage after hydration).
   - `pendingUploads`: count to show syncing overlay.
   - `dragging`: toggled by `DropzoneUploader` for overlay.
3. **Handlers**
   - `handleFileUpload(files)` → POST `/api/upload`, then create artifacts.
   - `handleUrlAdd(url)` → POST to `/api/projects/{id}/artifacts` with `{ type: "url", source_url }` (metadata handled inside modal).
4. **Layout**
   - `main` with gradient background.
   - Header: editable title + slider + add button.
   - Section: contains `DropzoneUploader`, overlay, and `ArtifactsGrid`.

Pseudo-flow:

```
columns = useState(3)
useEffect -> hydrate columns from localStorage
<Slider value=columns onChange=setColumns>
<ArtifactsGrid columns=columns artifacts=artifacts onReorder=saveOrder>
```

---

## 4. Artifacts Grid (`ArtifactsGrid`)

### Structure

```
<DndContext sensors pointerSensor>
  <div ref=container class="flex overflow-x-auto">
    <SortableContext>
      {items.map(artifact => (
        <SortableArtifact width={columnWidth} columnHeight={columnHeight}>
          <ArtifactCell artifact={artifact} />
        </SortableArtifact>
      ))}
    </SortableContext>
  </div>
  <DragOverlay>
    <ArtifactPreview artifact={active} maxHeight={columnHeight} />
  </DragOverlay>
</DndContext>
```

### Column Sizing

- `gapPx = 32` (consistent spacing between columns).
- `columnWidth = calc((100% - (columns - 1) * gapPx) / columns)`.
- Horizontal padding of the container matches `gapPx` so the first/last column align with viewport edges.
- Scroll snapping: `scrollSnapType = dragging ? "none" : "x mandatory"` to prevent resistance during drag.

### Height Measurement

- `useLayoutEffect` with `ResizeObserver` on the scroll container to maintain `columnHeight = container.clientHeight`.
- `SortableArtifact` sets `overflow-y-auto` with `maxHeight = columnHeight` so tall items scroll internally.

### Drag Behaviour

- `PointerSensor` activation constraint: distance `6px`.
- `handleDragStart` → set `activeId`, `dragging=true`.
- `handleDragMove` → if near container edges, call `container.scrollBy({ left: ±SPEED })`.
- `handleDragEnd` → `arrayMove` items, call `onReorder(nextList)` to persist order.

---

## 5. Sortable Artifact (`SortableArtifact`)

- Wraps each artifact per the `useSortable` result.
- Applies transform + transition from DnD kit.
- Styles: `inline-flex flex-col align-top shrink-0 h-full`, `cursor: grab/grabbing`.
- Inner wrapper: `overflow-y-auto`, `maxHeight = columnHeight`, child content has `rounded-lg overflow-hidden`.
- While dragging: set `opacity: 0.1` to ghost original element.

### Drag Overlay (`ArtifactPreview`)

- Mirrors card styling; uses `overflow-y-auto` and `maxHeight` to match column height.

---

## 6. Artifact Renderers

### Images (`ImageViewer`)
- Uses Next.js `<Image>` for Supabase URLs, fallback `<img>`.
- Classes: `w-full h-auto` to allow natural height.

### Video (`VideoPlayer`)
- `<video controls playsInline class="w-full h-auto">`.

### PDF (`PDFViewer`)
- `<iframe src="{url}#toolbar=0&navpanes=0" class="w-full h-auto" allow="fullscreen" />`.

### URL Embed (`URLEmbed`)

**Goal**: Maintain true device viewport while scaling to column width.

1. Metadata includes `{ viewport: "laptop" | "ipadAir" | "iphone15pro", width, height }`.
2. At render time:
   - Determine canonical dimensions with `getViewportDimensions()`.
   - `ResizeObserver` calculates `scale = containerWidth / viewportWidth`.
   - Wrapper height = `viewportHeight * scale`.
   - Render iframe inside absolutely positioned element with `width/height` = canonical pixels and `transform: scale(scale)` (origin top-left). This avoids reloading at small breakpoints.
3. Fallback card if iframe blocks embedding (`/api/embed/preview` checks X-Frame-Options/CSP).

---

## 7. Dropzone & Uploads

### `DropzoneUploader`

- Global `window` drag events manage `dragDepth` counter.
- If files dropped: call `onFiles(files)` from parent.
- If URL dropped: call `onUrl(text)`.
- Renders overlay only while dragging to avoid blocking pointer events.

### `ArtifactAdder` Modal

- Trigger button: circular `+` with framer-motion animations.
- Modal includes file picker and URL embed section.
- Viewport presets (shared `VIEWPORTS` map) — storing `width/height/viewport` in artifact metadata.
- ESC closes modal (keydown listener when open).

### Upload Flow

1. For each selected file:
   - POST `/api/upload` (multipart) with `project_id`.
   - Response includes `{ publicUrl, path }`.
   - Create artifact via `/api/projects/{id}/artifacts` with `type` derived from MIME, `source_url` (public URL), `file_path`.
2. After uploads: call `mutate` on SWR to refresh artifacts.

### URL Embeds

- `ArtifactAdder` POST includes metadata for viewport.
- `PresentationPage.handleUrlAdd` is still available for dropzone usage (no metadata) — optionally extend to detect metadata by calling shared helper.

---

## 8. Reorder Persistence

- `ArtifactsGrid` expects `onReorder(nextArtifacts)` to update server.
- Current API patch (if implemented) accepts: `{ order: [artifactIds...] }`.
- On success, revalidate SWR cache.

---

## 9. Styling Notes

- Dark theme palette: gradient background (`from #1c1f23 to #181c20`).
- Cards: no heavy borders/shadows; 8px rounding on inner content to avoid truncated scroll illusions.
- Gaps/padding tuned to 32px to prevent fractional widths.
- Scrollbars hidden with `.hide-scrollbar` utility for pointer devices; show automatically on first wheel event.

---

## 10. Suggested File Structure

```
components/
  presentation/
    ArtifactsGrid.tsx
    SortableArtifact.tsx
    ArtifactPreview.tsx
    EditableTitle.tsx
  artifacts/
    ImageViewer.tsx
    VideoPlayer.tsx
    PDFViewer.tsx
    URLEmbed.tsx
  upload/
    DropzoneUploader.tsx
    ArtifactAdder.tsx
lib/
  viewports.ts
pages/
  presentation/[shareToken]/page.tsx (or equivalent route)
```

---

## 11. Implementation Checklist for New Repo

1. Install dependencies (`dnd-kit`, `framer-motion`, Radix Slider, etc.).
2. Recreate shared `VIEWPORTS` helper and types.
3. Implement API endpoints or service calls for:
   - Fetching project by share token.
   - Listing/creating artifacts.
   - Uploading files to storage.
   - Optional: metadata fetch endpoint.
4. Port components preserving props and CSS classes.
5. Ensure layout container parent supplies full height (`h-dvh` with flex column). The grid section must have `flex-1 min-h-0` for correct child sizing.
6. Verify drag+scroll interactions in desktop and trackpad environments.
7. Confirm iframe scaling for each viewport preset after resizing window and changing column count.

---

This summary should give another agent enough context to rebuild the presentation canvas faithfully in a fresh project. Keep the DnD/column logic together (Grid + SortableArtifact + Preview), share viewport helpers, and wire uploads + metadata flows to match the API surface described above.
