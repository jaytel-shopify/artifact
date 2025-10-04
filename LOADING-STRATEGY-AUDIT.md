# Loading Strategy Audit & Recommendations

## 📊 Current State Analysis

### **How Artifacts Load When Switching Pages**

**Current Implementation** (`hooks/usePageArtifacts.ts`):
```typescript
const { data: artifacts = [], error, isLoading, mutate } = useSWR<Artifact[]>(
  pageId ? `page-artifacts-${pageId}` : null,
  () => (pageId ? fetcher(pageId) : []),
  { revalidateOnFocus: false }  // ← Only this option set
);
```

**What Happens**:
```
Page 1 (5 videos):
  → Key: "page-artifacts-abc123"
  → Fetches from Quick.db
  → SWR caches for 2 seconds (default)
  → Videos load in browser

Switch to Page 2 (3 images):
  → Key: "page-artifacts-def456"
  → Fetches from Quick.db
  → SWR caches
  → Images load

Back to Page 1:
  → Key: "page-artifacts-abc123"
  → Cache expired (if > 2s)
  → RE-FETCHES from Quick.db ❌
  → Videos RE-LOAD in browser ❌
```

---

## 🚨 Current Issues

### **1. Database Refetching**
- **Problem**: SWR's default `dedupingInterval` is only 2000ms (2 seconds)
- **Impact**: Switching pages > 2s apart = refetch from Quick.db
- **Severity**: Medium (unnecessary database calls)

### **2. Media Asset Reloading**
- **Problem**: Browser reloads videos/images when DOM re-renders
- **Impact**: Videos restart, flicker on page switch
- **Severity**: High (bad UX, wastes bandwidth)

### **3. No Cache Strategy**
- **Problem**: No explicit cache duration set
- **Impact**: Data can stale unexpectedly
- **Severity**: Low (mostly works, could be better)

---

## ✅ What's Working

### **Good**:
- ✅ SWR caches data per page (separate cache keys)
- ✅ `revalidateOnFocus: false` (doesn't refetch on tab switch)
- ✅ Projects page has 30s cache + 60s refresh

### **Could Be Better**:
- ⚠️ Artifacts cache only 2 seconds
- ⚠️ No keepPreviousData (shows loading between pages)
- ⚠️ Videos/images reload on page switch

---

## 💡 Recommended Solution

### **Phase 1: Extend SWR Cache** (5 minutes)

Update `usePageArtifacts` options:

```typescript
const { data: artifacts = [], error, isLoading, mutate } = useSWR<Artifact[]>(
  pageId ? `page-artifacts-${pageId}` : null,
  () => (pageId ? fetcher(pageId) : []),
  { 
    revalidateOnFocus: false,
    dedupingInterval: 300000,      // 5 minutes (don't refetch)
    keepPreviousData: true,        // Show old data while loading new
    revalidateOnMount: false,      // Only fetch if cache empty
  }
);
```

**Benefits**:
- ✅ Page 1 artifacts cached for 5 minutes
- ✅ Switch to Page 2, back to Page 1 < 5min = instant (no refetch)
- ✅ keepPreviousData = smooth transition, no flicker

**Trade-off**:
- Changes to artifacts take up to 5 min to reflect (acceptable - user can manually refresh)

---

### **Phase 2: Prevent Video Reload** (15 minutes)

Videos reload because React unmounts/remounts them. Solution:

**Option A: Keep Videos in DOM (Hidden)**
```typescript
{/* Render all pages' canvases, hide inactive ones */}
{pages.map(page => (
  <div 
    key={page.id} 
    style={{ display: page.id === currentPageId ? 'block' : 'none' }}
  >
    <Canvas artifacts={artifactsForPage[page.id]} />
  </div>
))}
```

**Pros**:
- ✅ Videos stay loaded
- ✅ No reload when switching
- ✅ Instant page switches

**Cons**:
- ⚠️ All pages loaded in memory (could be heavy)
- ⚠️ All videos loaded at once (bandwidth)

**Option B: Cache Video Elements** (Complex)
- Use React.memo + custom video component
- Maintain video state across page switches
- More complex implementation

**My Recommendation**: Option A if < 10 pages, otherwise accept the reload

---

### **Phase 3: Smart Preloading** (20 minutes)

Preload next/previous page artifacts:

```typescript
// Preload adjacent pages
useEffect(() => {
  if (!currentPageId) return;
  
  const currentIndex = pages.findIndex(p => p.id === currentPageId);
  const nextPage = pages[currentIndex + 1];
  const prevPage = pages[currentIndex - 1];
  
  // Prefetch next page artifacts
  if (nextPage) {
    getArtifactsByPage(nextPage.id).catch(() => {});
  }
  
  // Prefetch previous page artifacts
  if (prevPage) {
    getArtifactsByPage(prevPage.id).catch(() => {});
  }
}, [currentPageId, pages]);
```

**Benefits**:
- ✅ Next/prev page load instantly
- ✅ Most common navigation pattern optimized
- ✅ Minimal overhead (just 2 extra fetches)

---

## 📊 Performance Analysis

### **Current Behavior** (Without fixes):

```
Page 1 → Page 2 (after 3 seconds):
  - Fetch Page 2 artifacts from Quick.db (200ms)
  - Load 3 images from CDN (500ms)
  - Total: 700ms

Page 2 → Page 1 (returning):
  - RE-FETCH Page 1 artifacts from Quick.db (200ms) ❌
  - RE-LOAD 5 videos from CDN (2000ms) ❌
  - Total: 2200ms ❌
```

### **With Phase 1 Fix** (Extended cache):

```
Page 1 → Page 2 → Page 1 (within 5 min):
  - Serve Page 1 artifacts from SWR cache (0ms) ✅
  - Videos still reload (2000ms) ⚠️
  - Total: 2000ms
```

### **With Phase 1 + Phase 2** (Keep in DOM):

```
Page 1 → Page 2 → Page 1:
  - Switch display: none → block (0ms) ✅
  - Videos already loaded (0ms) ✅
  - Total: Instant! ✅
```

---

## 🎯 My Recommendation

### **Implement Phase 1 Now** (5 minutes)

Extend SWR cache to 5 minutes:
- Simple change
- Big impact
- No downsides

**Skip Phase 2 for now** (videos reload isn't terrible)
- More complex
- Only needed if users complain
- Can add later if needed

**Maybe Phase 3** (if you want extra polish)
- Nice-to-have
- Optimizes navigation
- Worth it if users switch pages often

---

## 🔍 Data Flow Audit

### **What Gets Cached** (Currently):

| Data | Cache Key | Duration | Behavior |
|------|-----------|----------|----------|
| Project | `project-token-{token}` | Forever (until reload) | ✅ Good |
| Pages | `pages-{projectId}` | Forever | ✅ Good |
| Artifacts | `page-artifacts-{pageId}` | **2 seconds** | ❌ Too short |
| Projects list | `projects-folders-{email}` | 30 seconds | ✅ Good |
| Folders | Part of projects fetch | 30 seconds | ✅ Good |

**Problem**: Artifacts cache is too short (2s default)

**Solution**: Extend to 5 minutes

---

## 🎬 Browser Asset Caching

### **Media Assets** (Videos, Images):

**Current**:
- Videos: Loaded fresh each time canvas renders
- Images: Browser cache helps, but React unmount causes reload
- PDFs: Same as images

**Why They Reload**:
1. Page switch → Canvas component unmounts
2. Canvas remounts with new artifacts
3. `<video>` and `<img>` tags are new DOM elements
4. Browser fetches assets again (even if cached)

**Solutions**:
- Keep DOM elements (Phase 2)
- Or accept the reload (reasonable)

---

## ✅ Immediate Action

I recommend implementing **Phase 1** right now:

```typescript
// In hooks/usePageArtifacts.ts
{ 
  revalidateOnFocus: false,
  dedupingInterval: 300000,    // 5 min - don't refetch
  keepPreviousData: true,      // Smooth transitions
  revalidateOnMount: false,    // Only if cache empty
}
```

**Impact**:
- ✅ Page switches < 5min = instant (no database fetch)
- ✅ Smooth transitions (no loading flicker)
- ✅ Less database load
- ✅ Better UX

---

## 🤔 Questions for You

Before I implement:

1. **Phase 1** (extend cache to 5 min)?
   - **My rec**: YES - simple, big impact

2. **Phase 2** (keep videos in DOM)?
   - **My rec**: SKIP for now - complex, only helps if lots of videos

3. **Phase 3** (preload adjacent pages)?
   - **My rec**: MAYBE - nice for heavy users

4. **Acceptable trade-off**: 
   - Videos reload when switching pages?
   - **My opinion**: Yes - it's normal behavior for video players

---

## 📝 Summary

**Current State**:
- ❌ Refetches artifacts every 2+ seconds
- ❌ Videos reload on page switch
- ⚠️ Could be better

**After Phase 1** (recommended):
- ✅ No refetch for 5 minutes
- ❌ Videos still reload (acceptable)
- ✅ Much better overall

**After All Phases** (overkill):
- ✅ No refetch
- ✅ No video reload
- ✅ Perfect UX
- ⚠️ Complex code

**My vote**: Do Phase 1 now, evaluate Phase 2/3 later based on user feedback.

---

Want me to implement Phase 1 (5 min cache)?

