# Sharing System Implementation Plan

## Executive Summary

This document outlines a **3-phase approach** to implementing a complete sharing and permissions system for the Artifact app, allowing projects to be shared with other Shopify employees with granular access control.

---

## 🎯 Goals

1. **Phase 1**: Basic sharing - copy link and share with anyone
2. **Phase 2**: Read-only mode - visual distinction between creators and viewers
3. **Phase 3**: Collaborative editing - grant edit permissions to specific users

---

## Phase 1: Basic Share Dialog (30-45 minutes)

### Goal
Enable project creators to easily share their projects with other Shopify employees via a shareable link.

### User Story
> "As a project creator, I want to copy a shareable link so I can send it to my colleagues via Slack or email."

---

### Tasks

#### 1.1 Create ShareDialog Component
**File**: `components/sharing/ShareDialog.tsx`

**Features**:
- Display the full shareable URL
- Copy to clipboard button
- Visual feedback on copy
- Show project name
- Instructions for recipients

**Implementation**:
```typescript
interface ShareDialogProps {
  projectId: string;
  projectName: string;
  shareToken: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({
  projectId,
  projectName,
  shareToken,
  isOpen,
  onClose,
}: ShareDialogProps) {
  const shareUrl = `https://artifact.quick.shopify.io/p?token=${shareToken}`;
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard!");
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share "{projectName}"</DialogTitle>
          <DialogDescription>
            Anyone at Shopify can view this project with the link below
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Share URL Display */}
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button onClick={copyToClipboard} variant="outline">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">How to share:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copy the link above</li>
              <li>Send it to colleagues via Slack or email</li>
              <li>They'll be able to view your project immediately</li>
            </ol>
          </div>

          {/* Future: Permissions section will go here */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### 1.2 Update AppHeader to Use ShareDialog
**File**: `components/layout/AppHeader.tsx`

**Changes**:
- Replace placeholder content with `<ShareDialog />`
- Pass project data to dialog
- Handle open/close state

#### 1.3 Add Copy Icon
**File**: `components/layout/AppHeader.tsx`

Import `Copy` and `Check` icons from `lucide-react`.

---

### Testing Checklist

- [ ] Click "Share" button opens dialog
- [ ] Dialog shows correct project name
- [ ] Share URL is correct format
- [ ] Copy button copies to clipboard
- [ ] "Copied!" feedback appears
- [ ] Toast notification shows
- [ ] URL works when pasted in browser
- [ ] Dialog can be closed

---

### Deliverables

1. New component: `components/sharing/ShareDialog.tsx`
2. Updated: `components/layout/AppHeader.tsx`
3. Working share link copy functionality

---

## Phase 2: Read-Only Mode (1-2 hours)

### Goal
Visually distinguish between creators (can edit) and viewers (read-only) with appropriate UI changes.

### User Story
> "As a viewer, I want to clearly see that I'm in read-only mode so I don't try to edit things I can't change."

---

### Tasks

#### 2.1 Create Permission Hook
**File**: `hooks/useProjectPermissions.ts`

```typescript
export function useProjectPermissions(project: Project | null) {
  const { user } = useAuth();
  
  const isCreator = useMemo(() => {
    if (!project || !user) return false;
    return project.creator_id === user.email;
  }, [project, user]);

  const canEdit = isCreator; // Future: Also check project_access table
  const canView = true; // Everyone at Shopify can view

  return {
    isCreator,
    canEdit,
    canView,
    isReadOnly: !canEdit,
  };
}
```

#### 2.2 Create ReadOnlyBanner Component
**File**: `components/sharing/ReadOnlyBanner.tsx`

**Features**:
- Shows at top of canvas for non-creators
- Displays creator's name
- Explains read-only status
- Dismissible (persists in localStorage)

```typescript
export function ReadOnlyBanner({ creatorEmail }: { creatorEmail: string }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("read-only-banner-dismissed");
    if (stored === "true") setDismissed(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("read-only-banner-dismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-blue-600" />
        <span className="text-sm">
          <strong>View Only:</strong> This project is owned by {creatorEmail}. 
          You can view but cannot make changes.
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={handleDismiss}>
        Dismiss
      </Button>
    </div>
  );
}
```

#### 2.3 Update AppLayout for Read-Only Mode
**File**: `components/layout/AppLayout.tsx`

**Changes**:
- Accept `isReadOnly` prop
- Conditionally render `<ReadOnlyBanner />`
- Hide "Add Artifact" button for viewers
- Disable drag-and-drop for viewers

#### 2.4 Update Canvas for Read-Only Mode
**File**: `components/presentation/Canvas.tsx`

**Changes**:
- Accept `isReadOnly` prop
- Disable artifact reordering for viewers
- Hide delete buttons for viewers
- Disable artifact title editing for viewers

#### 2.5 Update Presentation Page
**File**: `app/p/page.tsx`

**Changes**:
- Use `useProjectPermissions()` hook
- Pass `isReadOnly` to all components
- Conditionally render upload dropzone

#### 2.6 Update Sidebar for Read-Only Mode
**File**: `components/layout/PageNavigationSidebar.tsx`

**Changes**:
- Hide "Add Page" button for viewers
- Disable page renaming for viewers
- Disable page deletion for viewers
- Disable page reordering for viewers

---

### UI Changes Summary

**For Creators** (no change):
- See all edit controls
- Can modify everything
- No banner

**For Viewers**:
- ❌ No "Add Artifact" button
- ❌ No artifact delete buttons
- ❌ No artifact reordering
- ❌ No "Add Page" button
- ❌ No page delete/rename options
- ❌ No project name editing
- ✅ Blue banner: "View Only: This project is owned by..."
- ✅ All view/navigation controls work

---

### Testing Checklist

**As Creator:**
- [ ] Can edit project name
- [ ] Can add/delete/reorder artifacts
- [ ] Can create/delete/reorder pages
- [ ] No read-only banner appears

**As Viewer (different user):**
- [ ] Read-only banner appears at top
- [ ] Cannot see "Add Artifact" button
- [ ] Cannot delete artifacts
- [ ] Cannot reorder artifacts
- [ ] Cannot edit artifact names
- [ ] Cannot add/delete pages
- [ ] Cannot edit project name
- [ ] Can view everything
- [ ] Can navigate pages
- [ ] Can zoom/scroll

---

### Deliverables

1. New hook: `hooks/useProjectPermissions.ts`
2. New component: `components/sharing/ReadOnlyBanner.tsx`
3. Updated: `components/layout/AppLayout.tsx`
4. Updated: `components/presentation/Canvas.tsx`
5. Updated: `components/layout/PageNavigationSidebar.tsx`
6. Updated: `app/p/page.tsx`

---

## Phase 3: Collaborative Editing (3-4 hours)

### Goal
Allow project creators to grant edit permissions to specific Shopify employees, enabling true collaboration.

### User Story
> "As a project creator, I want to invite my teammates to collaborate so we can both add and edit artifacts together."

---

### Tasks

#### 3.1 Create CollaboratorsManager Component
**File**: `components/sharing/CollaboratorsManager.tsx`

**Features**:
- List current collaborators
- Add collaborator by email
- Remove collaborator
- Change role (editor/viewer)
- Shows user's Slack avatar (from Quick.id)

```typescript
interface Collaborator {
  user_email: string;
  role: "editor" | "viewer";
  added_at: string;
}

export function CollaboratorsManager({
  projectId,
  creatorEmail,
}: {
  projectId: string;
  creatorEmail: string;
}) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);

  // Load collaborators
  useEffect(() => {
    async function loadCollaborators() {
      const access = await getProjectAccessList(projectId);
      setCollaborators(access);
    }
    loadCollaborators();
  }, [projectId]);

  // Add collaborator
  async function handleAdd() {
    if (!newEmail.trim()) return;
    
    setAdding(true);
    try {
      await grantProjectAccess(projectId, newEmail.trim(), "editor");
      
      // Reload collaborators
      const access = await getProjectAccessList(projectId);
      setCollaborators(access);
      
      setNewEmail("");
      toast.success(`Granted edit access to ${newEmail}`);
    } catch (error) {
      toast.error("Failed to add collaborator");
    } finally {
      setAdding(false);
    }
  }

  // Remove collaborator
  async function handleRemove(email: string) {
    try {
      await revokeProjectAccess(projectId, email);
      setCollaborators(prev => prev.filter(c => c.user_email !== email));
      toast.success(`Removed ${email}`);
    } catch (error) {
      toast.error("Failed to remove collaborator");
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Collaborators */}
      <div>
        <h3 className="text-sm font-medium mb-2">Collaborators</h3>
        
        {/* Owner */}
        <div className="flex items-center justify-between p-2 bg-muted rounded">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-600" />
            <span className="text-sm">{creatorEmail}</span>
          </div>
          <span className="text-xs text-muted-foreground">Owner</span>
        </div>

        {/* Collaborators List */}
        {collaborators.map((collab) => (
          <div key={collab.user_email} className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">{collab.user_email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground capitalize">{collab.role}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(collab.user_email)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}

        {collaborators.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No collaborators yet
          </p>
        )}
      </div>

      {/* Add Collaborator */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Add Collaborator</h3>
        <div className="flex gap-2">
          <Input
            placeholder="colleague@shopify.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <Button onClick={handleAdd} disabled={adding || !newEmail.trim()}>
            {adding ? "Adding..." : "Add"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Collaborators can add, edit, and delete artifacts and pages
        </p>
      </div>
    </div>
  );
}
```

#### 3.2 Update ShareDialog to Include Collaborators
**File**: `components/sharing/ShareDialog.tsx`

**Changes**:
- Add tabs: "Share Link" and "Collaborators"
- Only show "Collaborators" tab to project creator
- Integrate `<CollaboratorsManager />` component

```typescript
<Tabs defaultValue="link">
  <TabsList>
    <TabsTrigger value="link">Share Link</TabsTrigger>
    {isCreator && <TabsTrigger value="collaborators">Collaborators</TabsTrigger>}
  </TabsList>
  
  <TabsContent value="link">
    {/* Share link copy UI */}
  </TabsContent>
  
  {isCreator && (
    <TabsContent value="collaborators">
      <CollaboratorsManager
        projectId={projectId}
        creatorEmail={creatorEmail}
      />
    </TabsContent>
  )}
</Tabs>
```

#### 3.3 Update useProjectPermissions Hook
**File**: `hooks/useProjectPermissions.ts`

**Changes**:
- Check `project_access` collection
- Return `true` for `canEdit` if:
  - User is creator, OR
  - User is in project_access with role "editor"

```typescript
export function useProjectPermissions(project: Project | null) {
  const { user } = useAuth();
  const [accessList, setAccessList] = useState<any[]>([]);

  useEffect(() => {
    async function checkAccess() {
      if (!project?.id) return;
      const access = await getProjectAccessList(project.id);
      setAccessList(access);
    }
    checkAccess();
  }, [project?.id]);

  const isCreator = useMemo(() => {
    if (!project || !user) return false;
    return project.creator_id === user.email;
  }, [project, user]);

  const canEdit = useMemo(() => {
    if (isCreator) return true;
    
    // Check if user has editor access
    const hasEditorAccess = accessList.some(
      (a) => a.user_email === user?.email && a.role === "editor"
    );
    
    return hasEditorAccess;
  }, [isCreator, accessList, user]);

  return {
    isCreator,
    canEdit,
    canView: true,
    isReadOnly: !canEdit,
    isCollaborator: canEdit && !isCreator,
  };
}
```

#### 3.4 Add Collaborator Badge
**File**: `components/sharing/CollaboratorBadge.tsx`

Show a badge for collaborators (not creators) at the top of the canvas:

```typescript
export function CollaboratorBadge({ creatorEmail }: { creatorEmail: string }) {
  return (
    <div className="bg-green-500/10 border border-green-500/20 p-2 rounded-lg flex items-center gap-2">
      <Users className="h-4 w-4 text-green-600" />
      <span className="text-sm">
        <strong>Collaborator:</strong> You can edit this project (owned by {creatorEmail})
      </span>
    </div>
  );
}
```

#### 3.5 Update Presentation Page for Collaborative Editing
**File**: `app/p/page.tsx`

**Changes**:
- Use `useProjectPermissions()` hook
- Show `<CollaboratorBadge />` if user is collaborator
- Enable all edit controls if `canEdit === true`

---

### Testing Checklist

**As Creator:**
- [ ] Can see "Collaborators" tab
- [ ] Can add collaborator by email
- [ ] Can see collaborator in list
- [ ] Can remove collaborator
- [ ] Collaborator appears with "editor" role

**As Invited Collaborator:**
- [ ] Green badge shows at top: "Collaborator: You can edit..."
- [ ] Can add/delete/reorder artifacts
- [ ] Can create/delete/reorder pages
- [ ] Can edit artifact names
- [ ] Can upload files
- [ ] Cannot edit project name (only owner can)
- [ ] Cannot manage collaborators list

**As Viewer (not invited):**
- [ ] Read-only banner shows
- [ ] Cannot edit anything
- [ ] All edit controls hidden

---

### Deliverables

1. Updated hook: `hooks/useProjectPermissions.ts`
2. New component: `components/sharing/CollaboratorsManager.tsx`
3. New component: `components/sharing/CollaboratorBadge.tsx`
4. Updated: `components/sharing/ShareDialog.tsx` (with tabs)
5. Updated: `app/p/page.tsx`
6. Updated: `lib/quick-db.ts` (use project_access functions)

---

## Implementation Timeline

| Phase | Duration | Complexity | Dependencies |
|-------|----------|------------|--------------|
| Phase 1: Share Dialog | 30-45 min | Low | None |
| Phase 2: Read-Only Mode | 1-2 hours | Medium | Phase 1 |
| Phase 3: Collaborative Editing | 2-3 hours | Medium-High | Phase 1 & 2 |
| **Total** | **4-6 hours** | - | - |

---

## Database Schema (Already Ready!)

### `projects` Collection
```typescript
{
  id: string
  name: string
  creator_id: string      // Owner's email
  share_token: string     // For public sharing
  settings: {...}
}
```

### `project_access` Collection (New usage)
```typescript
{
  id: string
  project_id: string      // Reference to project
  user_email: string      // Collaborator's email
  role: "editor" | "viewer"  // Permission level
  created_at: string
  updated_at: string
}
```

**Note**: The `project_access` collection and CRUD functions already exist in `lib/quick-db.ts`!

---

## Permission Matrix

| Feature | Creator | Collaborator (Editor) | Viewer |
|---------|---------|----------------------|--------|
| View project | ✅ | ✅ | ✅ |
| Navigate pages | ✅ | ✅ | ✅ |
| View artifacts | ✅ | ✅ | ✅ |
| Edit project name | ✅ | ❌ | ❌ |
| Add/delete artifacts | ✅ | ✅ | ❌ |
| Reorder artifacts | ✅ | ✅ | ❌ |
| Upload files | ✅ | ✅ | ❌ |
| Create/delete pages | ✅ | ✅ | ❌ |
| Reorder pages | ✅ | ✅ | ❌ |
| Manage collaborators | ✅ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ |

---

## UI/UX Mockups

### Phase 1: Share Dialog
```
┌─────────────────────────────────────┐
│ Share "My Project"              [X] │
├─────────────────────────────────────┤
│                                     │
│ Anyone at Shopify can view this    │
│ project with the link below:       │
│                                     │
│ [https://artifact.quick.shopify...] │
│                         [📋 Copy]   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ How to share:               │   │
│ │ 1. Copy the link above      │   │
│ │ 2. Send via Slack or email  │   │
│ │ 3. Recipients can view      │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Phase 2: Read-Only Banner
```
┌─────────────────────────────────────────────────────┐
│ 👁️ View Only: This project is owned by             │
│ john@shopify.com. You can view but cannot make     │
│ changes.                             [Dismiss]      │
└─────────────────────────────────────────────────────┘
```

### Phase 3: Collaborators Tab
```
┌─────────────────────────────────────┐
│ Share "My Project"              [X] │
├─────────────────────────────────────┤
│ [Share Link] [Collaborators]       │
├─────────────────────────────────────┤
│ Collaborators                       │
│                                     │
│ 👑 john@shopify.com         Owner   │
│ 👥 jane@shopify.com  Editor [Remove]│
│ 👥 bob@shopify.com   Editor [Remove]│
│                                     │
│ ───────────────────────────────────│
│                                     │
│ Add Collaborator                    │
│ [colleague@shopify.com]    [Add]   │
│                                     │
│ ℹ️ Collaborators can add, edit,    │
│   and delete artifacts and pages   │
└─────────────────────────────────────┘
```

### Phase 3: Collaborator Badge
```
┌─────────────────────────────────────────────────────┐
│ 👥 Collaborator: You can edit this project         │
│ (owned by john@shopify.com)                         │
└─────────────────────────────────────────────────────┘
```

---

## Quick.db Operations

### Check if User Can Edit (Phase 2 & 3)
```typescript
const permissions = useProjectPermissions(project);
if (permissions.canEdit) {
  // Show edit controls
}
```

### Grant Access (Phase 3)
```typescript
await grantProjectAccess(
  projectId,
  "colleague@shopify.com",
  "editor"
);
```

### Revoke Access (Phase 3)
```typescript
await revokeProjectAccess(
  projectId,
  "colleague@shopify.com"
);
```

### List Collaborators (Phase 3)
```typescript
const collaborators = await getProjectAccessList(projectId);
// Returns: [{ user_email, role, created_at, updated_at }]
```

---

## Edge Cases to Handle

### Phase 1
- ✅ Long project names truncate nicely
- ✅ Copy fails gracefully (show error toast)

### Phase 2
- ✅ Creator always has full permissions
- ✅ Read-only banner can be dismissed
- ✅ Dismissal persists across sessions

### Phase 3
- ✅ Cannot add same email twice
- ✅ Cannot remove project owner
- ✅ Invalid email validation
- ✅ Must be @shopify.com domain
- ✅ Owner can remove any collaborator
- ✅ Collaborators cannot remove each other

---

## Security Considerations

### Current (All Phases)
- ✅ Quick automatically handles Shopify employee authentication
- ✅ Only Shopify employees can access any project
- ✅ Share tokens are random 12-char strings (hard to guess)

### Phase 2
- ✅ Permission checks happen in React (UI level)
- ⚠️ Any Shopify employee can still technically call Quick.db APIs
- 💡 This is acceptable for internal tools

### Phase 3
- ✅ Collaborator management restricted to creator
- ✅ Email validation prevents typos
- 💡 Consider: Add email verification (check if user exists in Shopify)

---

## Future Enhancements (Beyond Phase 3)

### Real-Time Collaboration Indicators
- Show who's currently viewing/editing
- Live cursors for collaborators
- Presence indicators
- **Requires**: Quick.socket integration

### Notification System
- Notify collaborators when added
- Notify when artifacts are added
- **Requires**: Quick.slack integration

### Activity Log
- Track who made what changes
- Audit trail for compliance
- **Requires**: New `activity_log` collection

### Public Sharing (External)
- Generate time-limited public links
- No authentication required
- **Requires**: Separate public token system

---

## Testing Strategy

### Unit Tests (Optional)
- `useProjectPermissions` hook logic
- `canEditProject()` function
- Email validation

### Integration Tests
- Create project → Share → Access as different user
- Add collaborator → Verify permissions
- Remove collaborator → Verify revoked access

### Manual Testing
- Test with 2+ Shopify employee accounts
- Test permissions matrix thoroughly
- Test edge cases (invalid emails, etc.)

---

## Rollout Plan

### Phase 1 Release
- Deploy basic share dialog
- Announce: "New feature: Share projects via link!"
- Gather feedback on UX

### Phase 2 Release (1 week later)
- Deploy read-only mode
- Announce: "Improved sharing: Clear view-only mode"
- Monitor for permission bugs

### Phase 3 Release (2 weeks later)
- Deploy collaborative editing
- Announce: "Team collaboration: Invite colleagues to edit"
- Provide documentation and examples

---

## Success Metrics

### Phase 1
- ✅ Share button click rate
- ✅ Links copied to clipboard
- ✅ Shared projects accessed

### Phase 2
- ✅ Read-only sessions (viewer != creator)
- ✅ Zero permission errors reported
- ✅ User understanding of view-only mode

### Phase 3
- ✅ Projects with collaborators (%)
- ✅ Average collaborators per project
- ✅ Collaborator activity (edits made)
- ✅ Collaboration-related support tickets

---

## Files Overview

### New Files to Create
```
components/sharing/
├── ShareDialog.tsx           (Phase 1 - basic, Phase 3 - extended)
├── ReadOnlyBanner.tsx        (Phase 2)
├── CollaboratorBadge.tsx     (Phase 3)
└── CollaboratorsManager.tsx  (Phase 3)

hooks/
└── useProjectPermissions.ts  (Phase 2)
```

### Files to Modify
```
components/layout/
├── AppHeader.tsx             (Phase 1 - wire up ShareDialog)
├── AppLayout.tsx             (Phase 2 - add ReadOnlyBanner)
└── PageNavigationSidebar.tsx (Phase 2 - disable editing)

components/presentation/
├── Canvas.tsx                (Phase 2 - disable editing)
└── EditableTitle.tsx         (Phase 2 - disable for non-creator)

app/
└── p/page.tsx                (Phase 2 & 3 - permission integration)

lib/
└── quick-db.ts               (Already has all functions needed!)
```

---

## API Functions (Already Implemented!)

All required Quick.db functions already exist in `lib/quick-db.ts`:

```typescript
✅ getProjectAccessList(projectId)
✅ grantProjectAccess(projectId, userEmail, role)
✅ revokeProjectAccess(projectId, userEmail)
✅ canEditProject(projectId, userEmail)
```

**We just need to wire up the UI!**

---

## Recommended Order of Implementation

### Week 1: Foundation
1. **Phase 1** - Share Dialog (get basic sharing working)
2. Test with team, gather feedback

### Week 2: Polish
3. **Phase 2** - Read-Only Mode (improve viewer experience)
4. Test permissions thoroughly

### Week 3: Collaboration
5. **Phase 3** - Collaborative Editing (enable team workflows)
6. Beta test with selected teams

### Week 4: Refinement
7. Fix bugs, improve UX
8. Add analytics/metrics
9. Full rollout

---

## Dependencies & Prerequisites

### NPM Packages (Already Installed)
- ✅ `lucide-react` - Icons (Share, Copy, Check, Eye, Users, Crown)
- ✅ `sonner` - Toast notifications
- ✅ `@radix-ui/react-dialog` - Dialog component
- ✅ `@radix-ui/react-tabs` - Tabs component (Phase 3)

### Quick.db Collections
- ✅ `projects` - Already exists
- ✅ `project_access` - Already has CRUD functions

### Quick SDK Features
- ✅ `quick.id` - User email for permissions
- ✅ `quick.db` - Data persistence

---

## Risk Assessment

### Phase 1: Low Risk
- Simple UI component
- Read-only functionality
- No database changes

### Phase 2: Medium Risk
- Permission logic must be correct
- Must not break existing functionality
- Thorough testing needed

### Phase 3: Medium-High Risk
- Complex permission checks
- Multi-user edge cases
- Requires careful testing

---

## Questions to Answer Before Starting

1. **Phase 1**:
   - Should we also generate QR codes for easier mobile sharing?
   - Should share link include project name in URL?

2. **Phase 2**:
   - Should viewers see a "Request Edit Access" button?
   - Should we track view analytics (who viewed when)?

3. **Phase 3**:
   - Should collaborators be notified via Slack when added?
   - Should we allow "viewer" role or just "editor"?
   - Should owner be able to transfer ownership?

---

## Rollback Plan

Each phase can be rolled back independently:

```bash
# Revert to previous commit
git revert HEAD

# Rebuild and deploy
pnpm build && quick deploy dist artifact
```

---

**Ready to start Phase 1?** Let me know and I'll begin implementing the basic share dialog! 🚀

