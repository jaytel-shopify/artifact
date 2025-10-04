# Phase 3: Collaborative Editing - Enhanced Plan

## 🎯 Goals

1. ✅ Simple email input: Type `jaytel.provence` → auto-adds `@shopify.com`
2. ✅ Quick multi-user adding: Press Enter to add, keep typing for next person
3. ✅ Slack notifications when collaborators are added
4. ✅ Clean UI matching current design aesthetic
5. ✅ Proper permission checks

---

## 🎨 UX Flow

### Adding Collaborators

```
Type: "jaytel.provence"
Show preview: jaytel.provence@shopify.com ↵

Press Enter → Added! → "jaytel.provence@shopify.com"
                       Slack notification sent ✓

Type: "john.doe"
Show preview: john.doe@shopify.com ↵

Press Enter → Added! → "john.doe@shopify.com"
                       Slack notification sent ✓

Keep adding...
```

### UI Mockup

```
┌─────────────────────────────────────────┐
│ Share "My Project"              [Tabs]  │
├─────────────────────────────────────────┤
│ [Share Link] [Collaborators]           │
├─────────────────────────────────────────┤
│                                         │
│ Who has access                          │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ 👑 jaytel.provence@shopify.com  │   │
│ │    Owner                        │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ 👤 john.doe@shopify.com         │   │
│ │    Can edit              [Remove]│   │
│ └─────────────────────────────────┘   │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ 👤 jane.smith@shopify.com       │   │
│ │    Can edit              [Remove]│   │
│ └─────────────────────────────────┘   │
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ Add people                              │
│ ┌─────────────────────────────────┐   │
│ │ jaytel.provence                 │   │
│ │ @shopify.com             ↵ Enter│   │
│ └─────────────────────────────────┘   │
│                                         │
│ ℹ️ Type username and press Enter to   │
│   add. They'll be notified via Slack. │
└─────────────────────────────────────────┘
```

---

## 🛠️ Implementation Details

### 1. Email Input Component

**Component**: `CollaboratorEmailInput`

**Features**:
- Shows username input + `@shopify.com` suffix
- Live preview of full email
- Press Enter to add
- Press Escape to clear
- Validation: Only allows valid usernames (letters, dots, hyphens)

```typescript
function CollaboratorEmailInput({ onAdd }: { onAdd: (email: string) => void }) {
  const [username, setUsername] = useState("");
  const fullEmail = `${username}@shopify.com`;

  const handleAdd = () => {
    if (!username.trim()) return;
    
    // Validate username format
    if (!isValidUsername(username)) {
      toast.error("Invalid username format");
      return;
    }
    
    onAdd(fullEmail);
    setUsername(""); // Clear for next person
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center border rounded-md overflow-hidden">
          <Input
            placeholder="jaytel.provence"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setUsername("");
            }}
            className="border-0 focus-visible:ring-0"
          />
          <div className="px-3 text-sm text-muted-foreground bg-muted border-l">
            @shopify.com
          </div>
        </div>
        <Button 
          onClick={handleAdd} 
          disabled={!username.trim()}
          size="sm"
        >
          Add
        </Button>
      </div>
      {username && (
        <div className="text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> to add: {fullEmail}
        </div>
      )}
    </div>
  );
}

function isValidUsername(username: string): boolean {
  // Allow letters, dots, hyphens, numbers
  return /^[a-z0-9.-]+$/.test(username) && username.length > 0;
}
```

---

### 2. Slack Notification

**Using**: `quick.slack.sendMessage()`

**When to send**:
- When someone is added as collaborator
- Send to the collaborator's Slack DM

**Message format**:
```typescript
async function notifyCollaboratorAdded(
  collaboratorEmail: string,
  projectName: string,
  shareToken: string,
  addedBy: string
) {
  const slackId = collaboratorEmail.split('@')[0]; // Convert email to Slack handle
  const projectUrl = `https://artifact.quick.shopify.io/p?token=${shareToken}`;

  await quick.slack.sendMessage(slackId, "", {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${addedBy}* invited you to collaborate on a project in Artifact`
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Project:*\n${projectName}`
          },
          {
            type: "mrkdwn",
            text: `*Role:*\nEditor`
          }
        ]
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Open Project"
            },
            url: projectUrl,
            style: "primary"
          }
        ]
      }
    ]
  });
}
```

---

### 3. Multi-Add Pattern

**UX Flow**:
```
1. Type "jaytel.provence"
2. Press Enter
   → Added to list
   → Slack sent
   → Input clears
   → Focus stays in input

3. Type "john.doe"
4. Press Enter
   → Added to list
   → Slack sent
   → Input clears

5. Repeat as needed!
```

**Implementation**:
```typescript
const [pendingUsername, setPendingUsername] = useState("");
const [adding, setAdding] = useState(false);

async function handleAddCollaborator() {
  const email = `${pendingUsername}@shopify.com`;
  
  setAdding(true);
  try {
    // 1. Add to database
    await grantProjectAccess(projectId, email, "editor");
    
    // 2. Send Slack notification
    await notifyCollaboratorAdded(
      email,
      projectName,
      shareToken,
      currentUser.fullName
    );
    
    // 3. Update local state
    setCollaborators(prev => [...prev, { user_email: email, role: "editor" }]);
    
    // 4. Clear and focus for next person
    setPendingUsername("");
    inputRef.current?.focus();
    
    toast.success(`Added ${email} - Slack notification sent`);
  } catch (error) {
    toast.error("Failed to add collaborator");
  } finally {
    setAdding(false);
  }
}
```

---

## 📋 Phase 3 Todo List

### Step 1: Update TypeScript Types
- Add Slack notification types to `lib/quick.ts`

### Step 2: Create Slack Helper
**File**: `lib/quick-slack.ts`
- `notifyCollaboratorAdded()`
- `notifyCollaboratorRemoved()` (optional)

### Step 3: Create Email Input Component
**File**: `components/sharing/CollaboratorEmailInput.tsx`
- Username input with @shopify.com suffix
- Live preview
- Enter to add
- Validation

### Step 4: Create Collaborators Manager
**File**: `components/sharing/CollaboratorsManager.tsx`
- List current collaborators
- Add new collaborators (uses EmailInput)
- Remove collaborators
- Shows owner at top

### Step 5: Update ShareDialog with Tabs
**File**: `components/sharing/ShareDialog.tsx`
- Add Tabs component
- "Share Link" tab (existing)
- "Collaborators" tab (new)

### Step 6: Update Permissions Hook
**File**: `hooks/useProjectPermissions.ts`
- Check `project_access` collection
- Return true for `canEdit` if user is collaborator

### Step 7: Add Collaborator Badge
**File**: `components/sharing/CollaboratorBadge.tsx`
- Green badge: "Collaborator: Can edit"
- Shows for invited editors (not owner, not viewers)

### Step 8: Update Presentation Page
**File**: `app/p/page.tsx`
- Show CollaboratorBadge when appropriate

### Step 9: Build, Deploy, Test
- Test adding collaborators
- Test Slack notifications
- Test multi-add flow
- Test permissions

---

## 🎬 Example Usage

**Owner adds 3 collaborators**:
```
Types: "jaytel.provence" [Enter]
  → ✅ Added jaytel.provence@shopify.com
  → 📱 Slack sent to jaytel.provence

Types: "john.doe" [Enter]
  → ✅ Added john.doe@shopify.com
  → 📱 Slack sent to john.doe

Types: "jane.smith" [Enter]
  → ✅ Added jane.smith@shopify.com
  → 📱 Slack sent to jane.smith

Done! 3 collaborators added in ~15 seconds
```

**Collaborator receives Slack**:
```
┌────────────────────────────────────┐
│ Jaytel Provence invited you to    │
│ collaborate on a project in        │
│ Artifact                           │
│                                    │
│ Project: My Design Review          │
│ Role: Editor                       │
│                                    │
│          [Open Project]            │
└────────────────────────────────────┘
```

---

## ⚡ Estimated Timeline

| Task | Time |
|------|------|
| Slack helper function | 15 min |
| Email input component | 20 min |
| Collaborators manager | 30 min |
| ShareDialog tabs | 15 min |
| Permissions hook update | 15 min |
| Collaborator badge | 10 min |
| Integration & testing | 30 min |
| **Total** | **~2 hours** |

---

## 🔒 Permission Matrix (After Phase 3)

| Action | Owner | Collaborator | Viewer |
|--------|-------|--------------|--------|
| View project | ✅ | ✅ | ✅ |
| Edit project name | ✅ | ❌ | ❌ |
| Add/delete artifacts | ✅ | ✅ | ❌ |
| Upload files | ✅ | ✅ | ❌ |
| Create/delete pages | ✅ | ✅ | ❌ |
| Manage collaborators | ✅ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ |

---

## 🎯 Success Criteria

After Phase 3, you should be able to:
- ✅ Type `john.doe` and add `john.doe@shopify.com`
- ✅ Add 5 people in under 30 seconds
- ✅ Each person gets Slack notification immediately
- ✅ Collaborators can edit (not just view)
- ✅ Owner can remove collaborators
- ✅ Visual badges show who's who (Owner/Collaborator/Viewer)

---

**Ready to implement?** This will make your app truly collaborative! 🚀

