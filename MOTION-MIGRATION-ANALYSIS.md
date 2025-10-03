# Motion Migration Analysis

## Executive Summary

This document analyzes the current drag-and-drop implementation in the Artifact project and provides a comprehensive plan for migrating to Motion (formerly Framer Motion) to achieve smoother interactions without breaking existing functionality.

**Good News:** The project already has `framer-motion@12.23.19` installed! We can leverage this immediately.

---

## Current Implementation Analysis

### Tech Stack (Drag & Drop)
- **Library:** `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`
- **Strategy:** `horizontalListSortingStrategy`
- **Collision Detection:** `closestCenter`
- **Activation Constraint:** 6px distance (prevents accidental drags)

### Key Files & Components

#### 1. **Canvas.tsx** (Main Container)
```typescript
Location: components/presentation/Canvas.tsx
Lines: 1-344
```

**Current Behavior:**
- Horizontal scrolling container with artifacts
- Dynamic column width calculation: `calc((100% - ${(columns - 1) * gapPx}px) / ${columns})`
- Scroll-snap enabled (disabled during drag)
- Auto-scroll at edges during drag (120px threshold, 28px/frame speed)
- DragOverlay shows preview during drag
- Uses `arrayMove` from @dnd-kit to reorder

**State Management:**
- `items`: Local state synced with props
- `activeId`: Currently dragged item
- `dragging`: Boolean flag for drag state
- `columnHeight`: Dynamically calculated container height

**Animations:**
- `requestAnimationFrame` used on drag end for smooth state transitions
- Transition: `width 260ms cubic-bezier(0.33, 1, 0.68, 1)` on column resize
- Opacity drops to 0.1 on dragging item

#### 2. **SortableArtifact.tsx** (Individual Item Wrapper)
```typescript
Location: components/presentation/SortableArtifact.tsx
Lines: 1-59
```

**Current Behavior:**
- Uses `useSortable` hook from @dnd-kit
- Applies transform and transition from dnd-kit
- Cursor changes: `grab` → `grabbing`
- Width is dynamically passed from parent
- Has nested scrollable content area

#### 3. **ArtifactPreview.tsx** (Drag Overlay)
```typescript
Location: components/presentation/ArtifactPreview.tsx
Lines: 1-56
```

**Current Behavior:**
- Renders in DragOverlay during drag
- Shows title + content preview
- Pointer events disabled
- Respects maxHeight constraint

### Column Resizing Logic

**Location:** `app/p/page.tsx` + `components/layout/AppHeader.tsx`

**Current Behavior:**
- Slider control (1-8 columns)
- Stored in localStorage as `columns_in_view`
- Change triggers re-calculation of `columnWidth` via useMemo
- Each artifact transitions width over 260ms with easing

**Formula:**
```javascript
columnWidth = calc((100% - ${(columns - 1) * 32}px) / ${columns})
```

### Current Pain Points

1. **Visual Jumps:** When items reorder, the transition feels abrupt
2. **Column Resize:** Width transitions are okay but could be smoother with layout animations
3. **Drag Preview:** The DragOverlay approach works but creates a "pop" effect
4. **Scroll + Drag:** Auto-scroll logic is manual and could be more fluid
5. **No Layout Animations:** Items don't smoothly animate into their new positions

---

## Motion (Framer Motion) API Analysis

Based on the [Motion documentation](https://llms.motion.dev/), here are the relevant APIs:

### 1. **Reorder Components** ⚠️ LIMITED FOR OUR USE CASE

**API:**
```jsx
import { Reorder } from "framer-motion";

<Reorder.Group axis="x" values={items} onReorder={setItems}>
  {items.map((item) => (
    <Reorder.Item key={item.id} value={item}>
      {/* content */}
    </Reorder.Item>
  ))}
</Reorder.Group>
```

**Pros:**
- Simple, built-in reordering
- Smooth animations out of the box
- Handles state management

**Cons (CRITICAL):**
- ❌ **Not designed for scrollable containers**
- ❌ **No support for horizontal scroll with drag**
- ❌ **Limited customization for complex layouts**

**Verdict:** `Reorder` is too limited for our horizontal scrolling canvas. We need a hybrid approach.

---

### 2. **LayoutGroup** ✅ PERFECT FOR COLUMN RESIZE

**API:**
```jsx
import { LayoutGroup, motion } from "framer-motion";

<LayoutGroup>
  {items.map(item => (
    <motion.div layout key={item.id}>
      {/* content */}
    </motion.div>
  ))}
</LayoutGroup>
```

**Pros:**
- Automatically animates layout changes
- Synchronizes animations across components
- Smoothly handles width/position changes
- Works perfectly with dynamic columns

**Use Case for Us:**
- Wrap artifacts in `LayoutGroup`
- When columns change, Motion will smoothly animate width/position transitions
- No more manual transition CSS needed

---

### 3. **useDragControls** ✅ EXCELLENT FOR CUSTOM DRAG HANDLES

**API:**
```jsx
import { motion, useDragControls } from "framer-motion";

const dragControls = useDragControls();

<div onPointerDown={(e) => dragControls.start(e)}>
  Drag Handle
</div>
<motion.div drag="x" dragControls={dragControls} dragListener={false} />
```

**Pros:**
- Manual control over drag initiation
- Can create custom drag handles
- Fine-grained control

**Use Case for Us:**
- Could add drag handles to artifact titles
- Better control over when dragging starts

---

### 4. **motion.div with layout prop** ✅ KEY FOR SMOOTH REORDERING

**API:**
```jsx
<motion.div
  layout
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ layout: { duration: 0.3 } }}
>
  {/* content */}
</motion.div>
```

**Pros:**
- `layout` prop automatically animates position/size changes
- Smooth reordering when items move
- Can customize transition timing

**Use Case for Us:**
- Replace SortableArtifact wrapper with motion.div
- Use layout animations for position changes

---

### 5. **AnimatePresence** ⭐ BONUS FOR ADD/REMOVE

**API:**
```jsx
import { AnimatePresence, motion } from "framer-motion";

<AnimatePresence>
  {items.map(item => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    />
  ))}
</AnimatePresence>
```

**Use Case for Us:**
- Smooth add/delete animations for artifacts

---

## Recommended Migration Strategy

### ⚠️ IMPORTANT DECISION: Hybrid Approach

**Why not pure Motion Reorder?**
- Our horizontal scrolling canvas is too complex
- We need edge-based auto-scrolling
- We need fine control over drag thresholds

**Recommended Approach:**
1. **Keep @dnd-kit for drag-and-drop logic** (it works well!)
2. **Add Motion for layout animations** (LayoutGroup + layout prop)
3. **Use Motion for smoother transitions** (spring physics)

This gives us the best of both worlds:
- Robust drag-and-drop from dnd-kit
- Smooth visual animations from Motion

---

## Migration Plan: Phased Approach

### Phase 1: Add Layout Animations (LOW RISK) ✅

**Goal:** Eliminate jumps during column resize and reordering

**Changes to Canvas.tsx:**
```jsx
import { LayoutGroup, motion } from "framer-motion";

// Wrap container in LayoutGroup
<LayoutGroup>
  <div ref={containerRef} className="...">
    <SortableContext items={items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
      {items.map((artifact) => (
        <SortableArtifact key={artifact.id} artifact={artifact} width={columnWidth}>
          {/* existing content */}
        </SortableArtifact>
      ))}
    </SortableContext>
  </div>
</LayoutGroup>
```

**Changes to SortableArtifact.tsx:**
```jsx
import { motion } from "framer-motion";

// Replace outer div with motion.div
return (
  <motion.div
    ref={setNodeRef}
    layout // ⭐ KEY: This enables automatic layout animations
    transition={{
      layout: { type: "spring", bounce: 0.15, duration: 0.4 }
    }}
    style={{
      width,
      minHeight: "100%",
      scrollSnapAlign: "start",
      opacity: isDragging ? 0.1 : 1,
      cursor: isDragging ? "grabbing" : "grab",
      touchAction: "manipulation",
      // Remove manual transition - Motion handles this now
      transform: CSS.Transform.toString(transform),
    }}
    {...attributes}
    {...listeners}
  >
    {children}
  </motion.div>
);
```

**Expected Improvements:**
- Smooth width animations when columns change
- Smooth position animations when items reorder
- No more manual transition CSS

**Risk:** LOW - We're just adding animation layer on top

---

### Phase 2: Improve Drag Visual Feedback (MEDIUM RISK) ⭐

**Goal:** Smoother drag preview and better visual feedback

**Changes to Canvas.tsx:**
```jsx
// Instead of DragOverlay, use Motion's whileDrag
<SortableContext>
  {items.map((artifact) => (
    <SortableArtifact 
      key={artifact.id} 
      artifact={artifact}
      isDragging={activeId === artifact.id}
    >
      {/* ... */}
    </SortableArtifact>
  ))}
</SortableContext>

// Remove DragOverlay completely
```

**Changes to SortableArtifact.tsx:**
```jsx
return (
  <motion.div
    layout
    animate={{
      scale: isDragging ? 1.02 : 1,
      zIndex: isDragging ? 50 : 1,
      opacity: isDragging ? 0.9 : 1,
    }}
    transition={{
      scale: { type: "spring", stiffness: 300, damping: 20 },
      opacity: { duration: 0.2 }
    }}
    // ... rest
  >
    {children}
  </motion.div>
);
```

**Expected Improvements:**
- No "pop" when drag starts
- Smooth scale animation on drag
- Better visual continuity

**Risk:** MEDIUM - Changes visual behavior, needs testing

---

### Phase 3: Add Enter/Exit Animations (LOW RISK) ✅

**Goal:** Smooth animations when adding/deleting artifacts

**Changes to Canvas.tsx:**
```jsx
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";

<LayoutGroup>
  <div ref={containerRef}>
    <AnimatePresence initial={false} mode="popLayout">
      <SortableContext>
        {items.map((artifact) => (
          <SortableArtifact
            key={artifact.id}
            artifact={artifact}
            // Motion will handle enter/exit
          />
        ))}
      </SortableContext>
    </AnimatePresence>
  </div>
</LayoutGroup>
```

**Changes to SortableArtifact.tsx:**
```jsx
return (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: isDragging ? 0.1 : 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{
      layout: { type: "spring", bounce: 0.15, duration: 0.4 },
      opacity: { duration: 0.2 },
      scale: { type: "spring", bounce: 0.2, duration: 0.4 }
    }}
    // ... rest
  />
);
```

**Expected Improvements:**
- Artifacts fade in on add
- Artifacts fade out on delete
- Other artifacts smoothly adjust positions

---

### Phase 4: Optional - Custom Drag Controls (ADVANCED) 🚀

**Goal:** Even more control over drag interactions

**Potential Implementation:**
```jsx
import { useDragControls } from "framer-motion";

function SortableArtifact({ artifact, children }) {
  const motionDragControls = useDragControls();
  const dndKitHook = useSortable({ id: artifact.id });
  
  // Use Motion's drag controls for visual smoothness
  // Use dnd-kit for actual reordering logic
  
  return (
    <motion.div
      drag="x"
      dragControls={motionDragControls}
      dragListener={false}
      onDragStart={() => {
        // Notify dnd-kit
      }}
      // ...
    />
  );
}
```

**This is experimental and may require significant refactoring.**

---

## Testing Checklist

After each phase, test:

- [ ] **Drag & Drop:** Can still reorder artifacts
- [ ] **Column Resize:** Smoothly transitions when changing column count
- [ ] **Add Artifact:** New artifacts appear smoothly
- [ ] **Delete Artifact:** Removed artifacts exit smoothly, others reposition
- [ ] **Horizontal Scroll:** Still works during and after drag
- [ ] **Auto-scroll at edges:** Still functions when dragging near edges
- [ ] **Touch devices:** Drag works on mobile/tablet
- [ ] **Performance:** No janky frames (check with React DevTools Profiler)
- [ ] **Context menu:** Still accessible on artifacts
- [ ] **Title editing:** Still works on artifacts

---

## Performance Considerations

### Motion Optimizations to Apply

1. **Use `layoutId` for shared element transitions (if needed later)**
```jsx
<motion.div layoutId="artifact-123" />
```

2. **Reduce Motion Preference**
```jsx
import { useReducedMotion } from "framer-motion";

const shouldReduceMotion = useReducedMotion();

<motion.div
  animate={{
    scale: shouldReduceMotion ? 1 : 1.02
  }}
/>
```

3. **Optimize Re-renders**
- Ensure `artifact` objects have stable references
- Memoize child components if needed

---

## Expected Visual Improvements

### Before (Current):
- ❌ Column resize: Width changes with easing but items "jump" into place
- ❌ Reorder: Items snap to new positions
- ❌ Drag: Preview "pops" into overlay, original goes invisible
- ❌ Add: Items appear instantly
- ❌ Delete: Items disappear instantly, others snap to fill space

### After (With Motion):
- ✅ Column resize: Smooth width + position animations
- ✅ Reorder: Smooth slide animations to new positions
- ✅ Drag: Subtle scale + opacity change, no "pop"
- ✅ Add: Fade in + scale up animation
- ✅ Delete: Fade out + scale down, others smoothly reposition

---

## Code References

### Key Motion Props to Use

```jsx
// Layout animations
<motion.div layout />

// Spring physics
transition={{ 
  type: "spring", 
  bounce: 0.15, 
  duration: 0.4 
}}

// Layout transition
transition={{
  layout: { type: "spring", bounce: 0.15 }
}}

// Enter/exit
initial={{ opacity: 0, scale: 0.8 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.8 }}
```

### Recommended Easing Values

```javascript
// Smooth, natural feel
{ type: "spring", bounce: 0.15, duration: 0.4 }

// Snappy but not jarring
{ type: "spring", bounce: 0.2, duration: 0.3 }

// Very smooth, elegant
{ type: "spring", bounce: 0.1, duration: 0.5 }
```

---

## Implementation Priority

1. **Start with Phase 1** - Lowest risk, highest impact
2. **Test thoroughly** - Ensure no regressions
3. **Move to Phase 3** - Low risk, nice improvement
4. **Then Phase 2** - Bigger change, more testing needed
5. **Consider Phase 4** - Only if first phases prove successful

---

## Rollback Strategy

If issues arise:
1. Motion is additive - can remove `layout` prop without breaking anything
2. dnd-kit logic stays intact throughout
3. Each phase is independent and can be rolled back

---

## Alternative: Full Motion Reorder (NOT RECOMMENDED)

**Why not recommended:**
- Reorder.Group doesn't support horizontal scroll containers well
- We'd lose edge auto-scroll functionality
- More risk, less control
- Would require rewriting significant logic

**If you want to try anyway:**
- Remove all @dnd-kit code
- Use `Reorder.Group` with `axis="x"`
- Manually implement scroll logic
- Much higher risk of bugs

---

## Conclusion

The **hybrid approach** (Phases 1-3) is the safest and most effective path:
- Keeps proven dnd-kit drag logic
- Adds Motion's smooth layout animations
- Low risk, high reward
- Incremental rollout

**Recommended Next Step:**
Start with **Phase 1** - add `LayoutGroup` and `layout` prop. This single change will dramatically improve the feel of column resizing and reordering with minimal risk.

---

## Resources

- [Motion Documentation](https://motion.dev/)
- [Motion Layout Animations](https://motion.dev/docs/react-layout-animations)
- [Motion Reorder Components](https://motion.dev/docs/react-reorder)
- [dnd-kit Documentation](https://docs.dndkit.com/)

---

**Questions or concerns?** Let me know before starting implementation!

