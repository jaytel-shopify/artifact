# Deployment Guide for Quick Platform

## ✅ Phase 1 Complete: Static Export Ready

Your Artifact app is now configured for static deployment to Quick!

---

## 🚀 Quick Deployment

### Prerequisites
1. Install Quick CLI globally:
   ```bash
   npm install -g @shopify/quick
   ```

2. Ensure you're on the Shopify network or VPN

### Deploy to Quick

#### Standard Deployment Command
```bash
quick deploy dist artifact
```

**When prompted to overwrite**: Always type `y` and press Enter

#### Using the Deploy Script (Alternative)
```bash
pnpm deploy
```

This will:
1. Build the static site to `/dist`
2. Run `quick deploy dist artifact`
3. Prompt for confirmation if the site already exists (type `y` to proceed)

#### Step-by-Step Manual Deployment
```bash
# 1. Build the static site
pnpm build

# 2. Deploy to Quick
quick deploy dist artifact

# 3. When asked "Site already exists. Overwrite? (y/n)"
# Type: y
```

### Your Live Site
After deployment, your site will be available at:
**https://artifact.quick.shopify.io**

---

## 🔧 What Changed in Phase 1

### 1. Next.js Configuration (`next.config.ts`)
- ✅ Enabled `output: "export"` for static HTML generation
- ✅ Set `distDir: "dist"` for Quick deployment
- ✅ Enabled `trailingSlash: true` for better static routing
- ✅ Set `images.unoptimized: true` (required for static export)
- ✅ Added Quick domain to `remotePatterns`

### 2. Converted to Client-Side Only
- ✅ All pages marked with `"use client"`
- ✅ Removed all API routes (`/app/api/*`)
- ✅ Removed server-side auth callback
- ✅ Removed debug pages

### 3. Routing Changes
- ✅ Changed `/presentation/[shareToken]` → `/p?token=XXX`
  - Dynamic routes don't work well with static export
  - Now uses query parameters: `/p?token=abc123xyz`
  - Wrapped in Suspense boundary for useSearchParams

### 4. Package.json Scripts
```json
{
  "deploy": "pnpm build && quick deploy dist artifact",
  "preview": "pnpm build && npx serve dist"
}
```

---

## 📦 Build Output

```
dist/
├── index.html              (Homepage → Projects page)
├── auth/
│   └── login/
│       └── index.html      (Login page)
├── p/
│   └── index.html          (Presentation viewer)
├── projects/
│   ├── index.html          (Projects list)
│   └── new/
│       └── index.html      (Create new project)
├── settings/
│   └── index.html          (Settings page)
├── _next/                  (JavaScript bundles & assets)
├── favicons/               (App icons)
└── [static assets]         (Images, SVGs, etc.)
```

**Total Size**: ~2-3 MB

---

## 💻 Development Workflow

### ⚠️ Local Development Not Supported

**This app cannot run on localhost** because Quick SDK APIs (quick.db, quick.fs, quick.id) only work on deployed Quick sites.

If you try to run `pnpm dev`, you'll see a warning screen explaining this limitation.

---

### ✅ Recommended Development Workflow

Quick deployments are **fast** (~10-15 seconds), so the workflow is:

```bash
# 1. Make code changes in your editor

# 2. Build the static site
pnpm build

# 3. Deploy to Quick
quick deploy dist artifact
# Type: y

# 4. Test on the deployed site
# Visit: https://artifact.quick.shopify.io

# 5. Repeat!
```

**Pro tip**: Keep your browser open to https://artifact.quick.shopify.io and just refresh after each deploy.

---

### 🎨 What You CAN Do Locally

You can still work on **UI/styling** locally:

```bash
pnpm dev
```

Use this for:
- ✅ Component layout and styling
- ✅ CSS/Tailwind adjustments
- ✅ Visual design changes
- ✅ TypeScript compilation checks

But you'll see a deployment message overlay since Quick SDK won't work.

---

### 🚀 Quick Deploy Shortcut

For convenience, use the deploy script:

```bash
pnpm deploy
```

This runs `pnpm build && quick deploy dist artifact` in one command.

---

## ⚠️ Important Notes

### Current Limitations

1. **No Backend**: All API routes have been removed
   - Projects/Pages/Artifacts operations **will fail** until Phase 4 (Quick.db migration)
   - File uploads **will fail** until Phase 3 (Quick.fs migration)

2. **Auth Works**: Quick.id authentication is functional on deployed sites
   - Auto-authenticates Shopify employees
   - User avatar, name, and email available

3. **Routing Change**: Update any links to presentations:
   - **Old**: `/presentation/abc123xyz`
   - **New**: `/p?token=abc123xyz`

### What to Test After Deployment

✅ **Should Work**:
- Authentication (Quick.id)
- Page navigation
- UI rendering
- Static content

❌ **Won't Work Yet** (waiting for Phase 3 & 4):
- Creating/viewing projects
- Creating/editing pages
- Uploading artifacts
- Viewing artifact data
- Any database operations

---

## 🔄 Updating Your Deployment

To update the deployed site:

```bash
# Make your changes...
git add .
git commit -m "Your changes"

# Rebuild and redeploy
quick deploy dist artifact

# When prompted: "Site already exists. Overwrite? (y/n)"
# Type: y
```

**Quick Tip**: Always type `y` when prompted to overwrite - this updates your live site with the latest changes.

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clean and rebuild
rm -rf .next dist
pnpm build
```

### Deployment Fails
```bash
# Check you're logged in
quick whoami

# Try forcing the deployment
quick deploy dist artifact --force
```

### Site Shows 404
- Ensure the site name matches: `artifact` (not `artifact-app`)
- Check Quick dashboard: https://quick.shopify.io
- Verify deployment completed successfully

### Quick SDK Not Loading
- Check browser console for errors
- Verify script tag in `app/layout.tsx`: `<script src="/client/quick.js" async />`
- Only works on deployed Quick sites (not localhost)

---

## 📋 Next Steps

### Phase 2: ✅ COMPLETED
- ✅ Migrated to Quick.id authentication

### Phase 3: 🔜 File Storage Migration
- Replace `/api/upload` with `quick.fs`
- Update file upload components
- Migrate existing files to Quick storage

### Phase 4: 🔜 Database Migration  
- Replace all Supabase database calls with `quick.db`
- Update hooks (`useProject`, `usePages`, `useArtifacts`)
- Implement Quick.db service layer
- Test CRUD operations
- Enable real-time subscriptions

---

## 📚 Resources

- **Quick Platform**: https://quick.shopify.io
- **Quick Documentation**: (see CLAUDE.md in this repo)
- **Next.js Static Export**: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- **Migration Plan**: See MIGRATION-PLAN.md for full details

---

## 🎉 Success Criteria

You'll know Phase 1 is successful when:
- ✅ Build completes without errors
- ✅ `dist/` folder contains static HTML files
- ✅ Site deploys to Quick successfully
- ✅ Authentication works on the deployed site
- ✅ All pages load correctly
- ✅ No server-side code remains

**Current Status**: ✅ Phase 1 Complete!

---

**Last Updated**: October 3, 2025
**Quick Site**: https://artifact.quick.shopify.io

## 📝 Quick Reference

**Deploy Command:**
```bash
quick deploy dist artifact
```

**When prompted to overwrite:** Type `y` ✅

