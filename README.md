# Artifact

**A collaborative presentation tool for design artifacts, built on Shopify's Quick platform.**

Artifact allows teams to create multi-page presentations with images, videos, PDFs, and live web embeds. Projects can be shared with colleagues and collaboratively edited in real-time.

🌐 **Live Site**: [https://artifact.quick.shopify.io](https://artifact.quick.shopify.io)

---

## 🎯 What is Artifact?

Artifact is an internal Shopify tool for creating and sharing visual presentations. Think of it as a canvas for design reviews, prototype showcases, and visual documentation.

### Key Features

**Project Management**
- Create unlimited projects with custom names
- Multi-page support (organize artifacts across multiple pages)
- Drag-and-drop page reordering
- Auto-generated unique share links

**Artifact Types**
- 📸 **Images** - PNG, JPG, WebP, GIF
- 🎥 **Videos** - MP4, MOV with controls and autoplay
- 📄 **PDFs** - Inline PDF viewer
- 🔗 **URLs** - Live iframe embeds or link cards
- 🎨 **Figma** - Embed Figma prototypes

**Collaboration**
- Share projects via link
- Invite collaborators by email
- Permission system: Owner, Collaborator, Viewer
- Read-only mode for viewers

**Presentation Mode**
- Adjustable column view (1-8 columns)
- Drag-and-drop artifact reordering
- Full-screen artifact viewing
- Responsive layout

---

## 🏗️ Architecture

Artifact is a **pure client-side static site** built with:

- **Framework**: Next.js 15 (Static Export)
- **UI**: React 19 + Tailwind CSS
- **Authentication**: Quick.id (automatic for Shopify employees)
- **Database**: Quick.db (JSON-based NoSQL)
- **File Storage**: Quick.fs (CDN-backed storage)
- **Hosting**: Quick platform (artifact.quick.shopify.io)

### Why Quick?

Quick is Shopify's internal platform for rapidly deploying static sites with serverless APIs. Benefits:

- ✅ No backend code needed
- ✅ Automatic authentication
- ✅ Built-in database and storage
- ✅ Fast deployments (~10-15 seconds)
- ✅ Automatic HTTPS and CDN
- ✅ Internal-only (Google Auth required)

---

## 🚀 Deployment

### Prerequisites

1. **Install Quick CLI** (one-time setup):
   ```bash
   npm install -g @shopify/quick
   ```

2. **Ensure you're authenticated** with Shopify

### Production Deployment (Main Site)

⚠️ **Only Jaytel can deploy to the main site**

```bash
# Build the static site
pnpm build

# Deploy to production
quick deploy dist artifact

# When prompted: Type 'y' to overwrite
```

**Live URL**: https://artifact.quick.shopify.io

### PR/Testing Deployments (Contributors)

If you're contributing and want to test your changes:

```bash
# Build your changes
pnpm build

# Deploy to your own test subdomain
quick deploy dist artifact-pr-[your-name]

# Example:
# quick deploy dist artifact-pr-john
# Your test site: https://artifact-pr-john.quick.shopify.io
```

**Important**: 
- Do NOT deploy to `artifact` (reserved for Jaytel/production)
- Use `artifact-pr-[yourname]` for testing
- Submit a Pull Request when ready
- Jaytel will review and deploy to production

---

## 💻 Development Workflow

### ⚠️ Important: Local Development Limitations

**This app cannot run fully on localhost** because Quick SDK APIs (quick.db, quick.fs, quick.id) only work on deployed Quick sites.

Running `pnpm dev` will show a warning screen explaining this limitation.

### Recommended Workflow

1. **Make code changes** in your editor
2. **Build** the static site:
   ```bash
   pnpm build
   ```
3. **Deploy** to your test subdomain:
   ```bash
   quick deploy dist artifact-pr-[yourname]
   ```
4. **Test** on your deployed site
5. **Iterate** (repeat steps 1-4)
6. **Submit PR** when ready

**Pro tip**: Keep your browser open to your test URL and just refresh after each deploy (~15 seconds).

### Quick Deploy Script

```bash
# Build and deploy in one command
pnpm deploy

# Or use the manual commands:
pnpm build && quick deploy dist artifact-pr-[yourname]
```

### What You CAN Do Locally

You can still work on UI/styling locally for quick feedback:

```bash
pnpm dev
# Visit http://localhost:3000
```

**Use localhost for**:
- ✅ Component layout and styling
- ✅ CSS/Tailwind adjustments  
- ✅ Visual design changes
- ✅ TypeScript compilation

**But you'll need to deploy to test**:
- ❌ Authentication
- ❌ Database operations
- ❌ File uploads
- ❌ Any Quick SDK features

---

## 🗂️ Project Structure

```
artifact/
├── app/                          # Next.js app directory
│   ├── (dashboard)/projects/     # Projects list page
│   ├── p/                         # Presentation viewer (/p?token=XXX)
│   ├── auth/login/               # Login page
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── sharing/                  # Share dialog, collaborators, badges
│   ├── artifacts/                # Artifact viewers (image, video, PDF, URL)
│   ├── presentation/             # Canvas, sortable artifacts
│   ├── layout/                   # Header, sidebar
│   ├── upload/                   # File upload components
│   └── ui/                       # Shadcn UI components
│
├── hooks/
│   ├── useProject.ts             # Project management
│   ├── usePages.ts               # Page management
│   ├── useArtifacts.ts          # Artifact management
│   └── useProjectPermissions.ts  # Permission checks
│
├── lib/
│   ├── quick.ts                  # Quick SDK TypeScript types
│   ├── quick-db.ts               # Database service layer
│   ├── quick-storage.ts          # File storage helpers
│   ├── artifactNames.ts          # Auto-generate artifact names
│   └── viewports.ts              # Viewport presets for URLs
│
└── dist/                         # Build output (deployed to Quick)
```

---

## 📚 Quick SDK Documentation

### Database (quick.db)

All data is stored in Quick's JSON database:

**Collections**:
- `projects` - User projects
- `pages` - Pages within projects
- `artifacts` - Images, videos, PDFs, URLs on pages
- `project_access` - Collaborative edit permissions

**Example**:
```typescript
const collection = quick.db.collection("projects");
await collection.create({ name: "My Project", creator_id: user.email });
const projects = await collection.find();
```

### File Storage (quick.fs)

Files are uploaded to Quick's CDN:

```typescript
const result = await quick.fs.uploadFile(file, {
  onProgress: (progress) => console.log(progress.percentage)
});
// Returns: { url, fullUrl, size, mimeType }
```

### Authentication (quick.id)

Automatic authentication for Shopify employees:

```typescript
const user = await quick.id.waitForUser();
// Returns: { email, fullName, slackHandle, slackImageUrl, ... }
```

**See `AGENTS.md` and `CLAUDE.md` for complete Quick API documentation.**

---

## 🔐 Permissions System

### Three Permission Levels

**Owner** (Project Creator)
- Full control over project
- Edit project name
- Add/remove collaborators
- Delete project
- All editing capabilities

**Collaborator** (Invited Editor)
- Can add/delete/reorder artifacts
- Can create/delete/reorder pages
- Can upload files
- Cannot edit project name
- Cannot manage collaborators
- Shows green "Collaborator" badge

**Viewer** (Default for Everyone)
- Can view all content
- Can navigate pages
- Cannot edit anything
- Shows blue "View only" badge

### How to Collaborate

1. **Owner**: Click "Share" → "Collaborators" tab
2. **Type username**: `john.doe` (auto-adds @shopify.com)
3. **Press Enter** to add
4. **Copy link** shown below and send to john.doe
5. **Collaborator** opens link and can now edit!

---

## 🧪 Testing & Debug Tools

### Dev Debug Panel

Press the **`/`** key anywhere in a project to open the debug panel.

**Features**:
- Toggle read-only mode simulation
- View current user info
- View project details
- Test permission states

**Use cases**:
- Test viewer experience without logging into another account
- Verify permission logic
- Debug issues

---

## 🗃️ Database Schema

### Projects
```typescript
{
  id: string                    // Auto-generated by Quick.db
  name: string
  creator_id: string            // Owner's email
  share_token: string           // 12-char random token
  settings: {
    default_columns: number
    allow_viewer_control: boolean
    background_color: string
  }
  created_at: string            // Auto-generated
  updated_at: string            // Auto-generated
}
```

### Pages
```typescript
{
  id: string
  project_id: string            // Reference to project
  name: string
  position: number              // For ordering
  created_at: string
  updated_at: string
}
```

### Artifacts
```typescript
{
  id: string
  project_id: string
  page_id: string
  type: "figma" | "url" | "image" | "video" | "pdf"
  source_url: string
  file_path: string | null      // For uploaded files
  name: string
  position: number              // For ordering
  metadata: object              // Type-specific metadata
  created_at: string
  updated_at: string
}
```

### Project Access
```typescript
{
  id: string
  project_id: string
  user_email: string            // Collaborator's email
  role: "editor" | "viewer"
  created_at: string
  updated_at: string
}
```

---

## 🛠️ Tech Stack

- **Next.js 15** - React framework (static export mode)
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **Radix UI** - Accessible primitives
- **Framer Motion** - Animations
- **SWR** - Data fetching and caching
- **DnD Kit** - Drag and drop
- **Quick Platform** - Hosting, database, storage, auth

---

## 📝 Scripts

```bash
# Development (UI only - Quick SDK won't work)
pnpm dev

# Build static site
pnpm build

# Preview build locally
pnpm preview

# Deploy to Quick (production - Jaytel only)
pnpm deploy

# Deploy to test subdomain (contributors)
pnpm build && quick deploy dist artifact-pr-[yourname]
```

---

## 🤝 Contributing

### Workflow

1. **Create a branch** for your feature/fix
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** in your editor

3. **Deploy to your test site** (not production!)
   ```bash
   pnpm build
   quick deploy dist artifact-pr-[yourname]
   # Example: artifact-pr-john
   ```

4. **Test** on your deployed Quick site
   ```bash
   # Your test URL:
   https://artifact-pr-[yourname].quick.shopify.io
   ```

5. **Commit and push** your changes
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```

6. **Submit a Pull Request** on GitHub
   - Describe your changes
   - Include link to your test deployment
   - Jaytel will review and deploy to production

### Important Guidelines

- ⚠️ **DO NOT** deploy to `artifact` subdomain (production)
- ✅ **DO** deploy to `artifact-pr-[yourname]` for testing
- ✅ Test all features on your deployment before submitting PR
- ✅ Include screenshots or video if UI changes
- ✅ Update documentation if needed

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clean and rebuild
rm -rf .next dist
pnpm build
```

### Deploy Fails
```bash
# Check authentication
quick whoami

# Force deploy
quick deploy dist artifact-pr-[yourname] --force
```

### Features Don't Work on Localhost
This is expected! Quick SDK (quick.db, quick.fs, quick.id) only works on deployed Quick sites. You must deploy to test these features.

### Quick SDK Not Loading
- Ensure you've deployed to a Quick subdomain
- Check browser console for errors
- Verify script tag loads: `/client/quick.js`

---

## 📖 Additional Documentation

- **`DEPLOYMENT.md`** - Detailed deployment guide
- **`MIGRATION-PLAN.md`** - Supabase → Quick migration details
- **`SHARING-IMPLEMENTATION-PLAN.md`** - Sharing system architecture
- **`PHASE-3-ENHANCED-PLAN.md`** - Collaborative editing details
- **`AGENTS.md`** / **`CLAUDE.md`** - Quick platform API reference

---

## 🎨 Design System

### Colors (Dark Mode)
- Background Primary: `#0a0a0a`
- Background Secondary: `#171717`
- Border Primary: `#262626`
- Text Primary: `#ffffff`
- Accent: Blue/Green for badges

### Typography
- Font: Geist Sans & Geist Mono
- Sizes: 12px - 24px

### Spacing
- Uses CSS custom properties
- Consistent 8px grid system

---

## 🔑 Environment Variables

**None required!** 

Quick platform handles all configuration automatically. No `.env` files needed.

---

## 🏆 Migration History

This app was migrated from a traditional Next.js + Supabase architecture to Quick:

**Before**:
- Next.js with Server Components
- Supabase Postgres database
- Supabase Storage
- Supabase Auth (Google OAuth)
- 18 API routes
- Environment variables required

**After**:
- Pure static site (client-side only)
- Quick.db (JSON database)
- Quick.fs (file storage)
- Quick.id (automatic auth)
- Zero API routes
- No environment variables

**Benefits**:
- ⚡ Faster deployment
- 🎯 Simpler architecture
- 🔒 Built-in auth
- 💰 No external services
- 🚀 Optimized for Shopify internal use

---

## 📊 Tech Decisions

### Why Quick?
- Internal Shopify tool (perfect for internal apps)
- Automatic employee authentication
- No infrastructure management
- Fast iteration cycles

### Why Static Export?
- Better performance
- No server costs
- Easier to reason about
- Cacheable assets

### Why Client-Side Only?
- Quick SDK is browser-based
- Simpler deployment
- Aligns with Quick's architecture

---

## 🚧 Known Limitations

1. **Local development** - Must deploy to Quick to test full functionality
2. **Quick.db queries** - No SQL joins or complex queries (use JavaScript filtering)
3. **File size limits** - 20MB per file (Quick.fs limitation)
4. **Shopify-only** - Only Shopify employees can access (by design)

---

## 📞 Support

**Owner/Maintainer**: Jaytel Provence (jaytel.provence@shopify.com)

**Issues**: Open a GitHub issue or reach out on Slack

**Deployment Access**: Contact Jaytel for production deployment rights

---

## 📄 License

Internal Shopify tool - Not for public distribution

---

## 🙏 Acknowledgments

Built by Product Design Studio.

---

**Happy presenting!** 🎨✨
