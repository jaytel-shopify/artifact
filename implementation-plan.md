# Design Presentation App - Technical Implementation Plan

## Project Overview
A web-based collaborative presentation tool for design artifacts that allows real-time synchronized viewing with local rendering for optimal quality. Users can create projects with unlimited horizontal artifacts, viewing 1-8 columns at a time through a viewport slider.

## Tech Stack

### Core Technologies
- **Frontend Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **Real-time Sync**: Liveblocks
- **Database**: Supabase (PostgreSQL + Real-time)
- **File Storage**: Supabase Storage or AWS S3
- **Deployment**: Vercel
- **Type Safety**: TypeScript

### Key Libraries
- `@liveblocks/client` - Real-time collaboration
- `@liveblocks/react` - React hooks for Liveblocks
- `react-intersection-observer` - Viewport detection for lazy loading
- `framer-motion` - Smooth animations
- `react-use-measure` - Dynamic size measurements
- `@radix-ui/react-slider` - Accessible slider component
- `react-dropzone` - File upload handling

## Project Setup

### 1. Initialize Next.js Project
```bash
npx create-next-app@latest presentation-app --typescript --tailwind --app
cd presentation-app
```

### 2. Install Dependencies
```bash
npm install @liveblocks/client @liveblocks/react @supabase/supabase-js 
npm install framer-motion react-intersection-observer react-use-measure
npm install @radix-ui/react-slider react-dropzone nanoid
npm install --save-dev @types/node
```

### 3. Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=
LIVEBLOCKS_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Database Schema

### Supabase Tables

#### `projects` table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  creator_id UUID NOT NULL,
  share_token VARCHAR(12) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{
    "default_columns": 3,
    "allow_viewer_control": true,
    "background_color": "#ffffff"
  }'
);
```

#### `artifacts` table
```sql
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('figma', 'url', 'image', 'video', 'pdf')),
  source_url TEXT NOT NULL,
  file_path TEXT, -- For uploaded files
  position INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_artifacts_project_position ON artifacts(project_id, position);
```

#### `project_access` table
```sql
CREATE TABLE project_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID,
  role VARCHAR(20) CHECK (role IN ('owner', 'presenter', 'viewer')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Application Structure

### Directory Structure
```
/app
  /api
    /liveblocks-auth
      route.ts          # Liveblocks authentication
    /projects
      route.ts          # Create/list projects
      /[id]
        route.ts        # Get/update/delete project
        /artifacts
          route.ts      # Manage artifacts
    /upload
      route.ts          # Handle file uploads
  /(auth)
    /login
      page.tsx
    /signup
      page.tsx
  /(dashboard)
    /projects
      page.tsx          # Projects list
      /new
        page.tsx        # Create project
  /presentation
    /[shareToken]
      page.tsx          # Main presentation view
  layout.tsx
  page.tsx              # Landing page

/components
  /presentation
    ArtifactRenderer.tsx
    ViewportControl.tsx
    PresenterControls.tsx
    ArtifactsGrid.tsx
    LivePresence.tsx
  /artifacts
    FigmaEmbed.tsx
    URLEmbed.tsx
    ImageViewer.tsx
    VideoPlayer.tsx
    PDFViewer.tsx
  /upload
    DropzoneUploader.tsx
    ArtifactAdder.tsx
  /ui
    Slider.tsx
    Button.tsx
    Card.tsx

/lib
  supabase.ts
  liveblocks.ts
  utils.ts

/hooks
  useProject.ts
  useArtifacts.ts
  useViewport.ts
  usePresenter.ts

/types
  index.ts
```

## Core Components Implementation

### 1. Type Definitions (`/types/index.ts`)

Define TypeScript interfaces:
- `Project`: id, name, creator_id, share_token, settings
- `Artifact`: id, project_id, type, source_url, position, metadata
- `ViewportState`: columns_in_view, scroll_x, focused_artifact_id
- `PresenterState`: presenter_id, is_presenting, viewport_state
- `LiveUser`: id, name, role, cursor_position

### 2. Liveblocks Configuration (`/lib/liveblocks.ts`)

Set up Liveblocks client with:
- Room provider wrapper component
- Authentication endpoint configuration
- Type-safe hooks using `createRoomContext`
- Define storage types for shared state

### 3. Main Presentation View (`/app/presentation/[shareToken]/page.tsx`)

#### Component Structure:
1. **Data Fetching**: 
   - Fetch project by share_token
   - Load all artifacts sorted by position
   - Initialize Liveblocks room with project ID

2. **State Management**:
   - Local state for columns_in_view (1-8)
   - Synced state for presenter viewport
   - Toggle for "follow presenter" mode

3. **Layout**:
   - Header with project name and presence avatars
   - Viewport control slider (1-8 columns)
   - Scrollable artifact container
   - Presenter controls (if user is presenter)

### 4. Artifacts Grid Component (`/components/presentation/ArtifactsGrid.tsx`)

#### Implementation Details:
1. **Container Setup**:
   - Use CSS Grid with dynamic columns
   - Calculate column width: `100vw / columns_in_view`
   - Horizontal scroll container
   - Top-aligned artifacts with auto height

2. **Artifact Rendering**:
   - Map artifacts to appropriate renderer components
   - Lazy load artifacts outside viewport
   - Use Intersection Observer for performance

3. **Synchronization**:
   - Subscribe to presenter's scroll position
   - Smooth scroll to presenter's viewport
   - Debounce scroll events (100ms)

### 5. Viewport Control (`/components/presentation/ViewportControl.tsx`)

#### Features:
1. **Slider Component**:
   - Range: 1-8 columns
   - Real-time preview while dragging
   - Keyboard accessible (arrow keys)
   - Display current column count

2. **Responsive Behavior**:
   - Save preference locally
   - Sync with presenter if following
   - Animate grid transition

### 6. Artifact Renderers

#### Base Renderer Interface:
Each renderer should implement:
- Loading state
- Error handling
- Aspect ratio preservation
- Click to focus/expand

#### Specific Renderers:

**FigmaEmbed.tsx**:
- Use Figma embed API
- Handle authentication if needed
- Responsive iframe sizing

**URLEmbed.tsx**:
- Sanitize URLs
- Handle X-Frame-Options restrictions
- Fallback to link if embed fails

**ImageViewer.tsx**:
- Progressive loading
- Click to zoom
- Support for various formats

**VideoPlayer.tsx**:
- Custom controls for consistency
- Synchronized play/pause with presenter
- Bandwidth-aware quality selection

**PDFViewer.tsx**:
- Use PDF.js or react-pdf
- Page navigation
- Zoom controls

### 7. Real-time Synchronization

#### Liveblocks Room Structure:
```typescript
{
  presence: {
    user: LiveUser,
    cursor: { x: number, y: number } | null
  },
  storage: {
    presenterState: PresenterState,
    viewportState: ViewportState,
    artifacts: Artifact[]
  },
  broadcast: {
    events: {
      PRESENTER_CHANGED: { presenter_id: string },
      VIEWPORT_UPDATED: ViewportState,
      ARTIFACT_FOCUSED: { artifact_id: string }
    }
  }
}
```

#### Sync Logic:
1. **Presenter Actions**:
   - Broadcast viewport changes
   - Emit focus events
   - Control playback states

2. **Viewer Following**:
   - Subscribe to presenter broadcasts
   - Smooth transitions to match presenter
   - Option to break away from following

### 8. Upload System (`/components/upload/ArtifactAdder.tsx`)

#### Implementation:
1. **UI Components**:
   - Modal or sidebar interface
   - Tabs for different artifact types
   - Drag-and-drop zone for files

2. **File Handling**:
   - Validate file types and sizes
   - Upload to Supabase Storage
   - Generate thumbnails for preview

3. **URL Input**:
   - Validate URL format
   - Test embeddability
   - Extract metadata (title, favicon)

### 9. API Routes

#### `/api/projects` (POST)
- Create new project
- Generate unique share_token
- Return project details

#### `/api/projects/[id]` (GET, PATCH, DELETE)
- Fetch project with artifacts
- Update project settings
- Delete project and cleanup storage

#### `/api/projects/[id]/artifacts` (GET, POST, PATCH, DELETE)
- CRUD operations for artifacts
- Handle position reordering
- Validate artifact types

#### `/api/upload` (POST)
- Handle multipart file uploads
- Store in Supabase Storage
- Return file URL and metadata

#### `/api/liveblocks-auth` (POST)
- Authenticate users for Liveblocks
- Set user permissions based on role
- Return access token

## Performance Optimizations

### 1. Lazy Loading
- Use Intersection Observer to detect visible artifacts
- Load artifacts in viewport + 1 column buffer
- Unload artifacts far outside viewport

### 2. Image Optimization
- Use Next.js Image component
- Generate responsive sizes
- Implement progressive loading

### 3. Caching Strategy
- Cache project data with SWR
- Prefetch adjacent artifacts
- Browser cache for static assets

### 4. Bundle Optimization
- Dynamic imports for artifact renderers
- Code split by route
- Minimize third-party dependencies

## Security Considerations

### 1. Authentication
- Implement user authentication (Supabase Auth or NextAuth)
- Validate permissions for each action
- Secure API routes with middleware

### 2. Content Security
- Sanitize all user inputs
- Validate embed URLs against allowlist
- Implement CSP headers

### 3. File Upload Security
- Validate MIME types
- Limit file sizes
- Scan for malware (optional)

### 4. Rate Limiting
- Limit API requests per user
- Throttle real-time updates
- Implement upload quotas

## Deployment Steps

### 1. Environment Setup
- Configure Vercel project
- Set environment variables
- Connect to GitHub repository

### 2. Database Migration
- Run Supabase migrations
- Seed initial data
- Set up database backups

### 3. Liveblocks Setup
- Create Liveblocks project
- Configure webhooks
- Set up room permissions

### 4. Monitoring
- Set up error tracking (Sentry)
- Configure analytics
- Monitor performance metrics

## Testing Strategy

### 1. Unit Tests
- Test artifact renderers
- Test viewport calculations
- Test sync logic

### 2. Integration Tests
- Test API endpoints
- Test file upload flow
- Test real-time synchronization

### 3. E2E Tests
- Test complete user flows
- Test presenter/viewer interactions
- Test responsive behavior

## MVP Features (Phase 1 - Week 1-2)

1. Project creation with share links
2. Upload and display images
3. Basic grid layout (no sync)
4. Column count adjustment (1-8)
5. URL embed support

## Phase 2 Features (Week 3-4)

1. Liveblocks integration
2. Presenter mode
3. Synchronized scrolling
4. Real-time presence
5. Video and PDF support

## Phase 3 Features (Week 5-6)

1. Figma embed integration
2. Artifact reordering
3. Annotation tools
4. Performance optimizations
5. Mobile responsive design

## Additional Considerations

### Browser Compatibility
- Test on Chrome, Firefox, Safari, Edge
- Ensure mobile browser support
- Handle WebRTC for real-time features

### Accessibility
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management

### Internationalization
- Prepare for multi-language support
- Use date/time formatting libraries
- RTL layout considerations

## Success Metrics

1. **Performance**: <2s initial load time
2. **Real-time**: <100ms sync latency
3. **Reliability**: 99.9% uptime
4. **Scale**: Support 50+ concurrent viewers
5. **Quality**: No quality loss vs direct viewing