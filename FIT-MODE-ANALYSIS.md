# "Fit to Viewport" Mode - Complete Analysis

## 🎯 Feature Requirements

**Trigger**: When columns = 1  
**UI**: Show "Fit" toggle next to column slider  
**Behavior**:

| Mode | Width | Height | Result |
|------|-------|--------|--------|
| **Normal** (Fit OFF) | 100% of viewport | auto | May overflow vertically |
| **Fit** (Fit ON) | auto | 100% of canvas | Entire artifact visible, centered |

---

## 📊 Current DOM Structure Audit

### **Full Hierarchy**:

```html
<AppLayout> (h-screen, flex flex-col)
  <AppHeader /> (fixed height: var(--header-height))
  
  <div> (flex flex-1, main content area)
    <PageNavigationSidebar /> (width: var(--sidebar-width), conditional)
    
    <main> (flex-1, margin-left adjusts for sidebar)
      <div> (h-full, pt-[spacing-md])  ← Canvas wrapper
        <Canvas> (h-full)
          <DndContext>
            <div className="h-full">
              <LayoutGroup>
                <div 
                  ref={containerRef}
                  className="w-full h-full overflow-x-auto overflow-y-hidden flex items-stretch"
                >
                  <!-- Horizontal scroll container -->
                  
                  <SortableArtifact 
                    width={columnWidth}      ← Calculated: "33.33%" or "100%"
                    columnHeight={columnHeight}  ← Calculated from container
                  >
                    <div style={{ minHeight: "100%" }}>
                      <div 
                        className="overflow-y-auto"
                        style={{ maxHeight: columnHeight }}
                      >
                        <EditableArtifactTitle />
                        
                        <ArtifactCell>
                          <VideoPlayer className="w-full h-auto" />
                          <!-- or -->
                          <ImageViewer className="w-full h-auto" />
                          <!-- or -->
                          <URLEmbed />
                          <!-- or -->
                          <PDFViewer />
                        </ArtifactCell>
                      </div>
                    </div>
                  </SortableArtifact>
                  
                </div>
              </LayoutGroup>
            </div>
          </DndContext>
        </Canvas>
      </div>
    </main>
  </div>
</AppLayout>
```

---

## 📐 Current Sizing Logic

### **Column Width Calculation** (`Canvas.tsx` line ~87):

```typescript
const columnWidth = `${100 / columns}%`;
// columns = 1 → "100%"
// columns = 2 → "50%"
// columns = 3 → "33.33%"
```

### **Column Height Calculation** (`Canvas.tsx` line ~96):

```typescript
useLayoutEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  const h = el.clientHeight;
  setColumnHeight(h);
}, []);
```

Returns full available height of canvas container.

### **Current Artifact Sizing**:

**Videos** (`VideoPlayer.tsx`):
```html
<video className="w-full h-auto" />
```
- Width: 100% of column
- Height: auto (maintains aspect ratio)
- **Problem at 1 column**: Height can exceed viewport

**Images** (`ImageViewer.tsx`):
```html
<img className="w-full h-auto" />
```
- Same as videos

**URLs** (`URLEmbed.tsx`):
- Uses fixed dimensions + scale transform
- Different logic entirely

**PDFs** (`PDFViewer.tsx`):
- Uses iframe
- Fixed sizing

---

## 💡 Proposed Solution

### **Concept**:

When `columns === 1` AND `fitMode === true`:

1. **Container changes**:
   - Switch from `flex items-stretch` to `flex items-center justify-center`
   - Remove horizontal scroll behavior

2. **Artifact sizing**:
   - Videos/Images: `max-height: 100%` + `max-width: 100%` + `object-fit: contain`
   - Width becomes `auto` (maintains aspect ratio)
   - Height constrained to canvas height

3. **Centering**:
   - Artifacts centered horizontally
   - Artifacts centered vertically

---

## 🎨 Implementation Strategy

### **Step 1: Add Fit Toggle UI**

**Location**: `components/layout/AppHeader.tsx`

```typescript
{/* Column Count Slider */}
{showColumnControls && onColumnsChange && (
  <div className="flex items-center gap-3">
    {/* Existing slider */}
    
    {/* Fit toggle (only when columns === 1) */}
    {columns === 1 && (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Fit</span>
        <Switch 
          checked={fitMode}
          onCheckedChange={onFitModeChange}
        />
      </div>
    )}
  </div>
)}
```

### **Step 2: Pass Fit Mode State**

**Add to**:
- `app/p/page.tsx` - Store fitMode state
- `AppLayout` → `AppHeader` props
- `AppLayout` → `Canvas` props

```typescript
const [fitMode, setFitMode] = useState(false);

// Reset fitMode when columns change away from 1
useEffect(() => {
  if (columns !== 1) {
    setFitMode(false);
  }
}, [columns]);
```

### **Step 3: Update Canvas Styling**

**File**: `components/presentation/Canvas.tsx`

```typescript
export default function Canvas({
  columns,
  artifacts,
  fitMode = false,  
