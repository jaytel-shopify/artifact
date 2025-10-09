# SPA Routing Guide

## For Developers

This project now uses **hash-based routing** for a true Single-Page Application experience.

## How to Navigate

### 1. **Using the Navigation Hook**

Import and use `useHashNavigation()` instead of Next.js's `useRouter()`:

```tsx
import { useHashNavigation } from '@/components/Router';

function MyComponent() {
  const router = useHashNavigation();
  
  // Navigate to a route
  router.push('/projects');
  
  // Navigate with query params
  router.push('/p?token=abc123');
  
  // Replace current route
  router.replace('/settings');
  
  // Prefetch (no-op in SPA, but API-compatible)
  router.prefetch('/folder?id=123');
}
```

### 2. **Getting Search Params**

Use `useHashSearchParams()` instead of Next.js's `useSearchParams()`:

```tsx
import { useHashSearchParams } from '@/components/Router';

function MyComponent() {
  const searchParams = useHashSearchParams();
  
  // Get a parameter
  const token = searchParams.get('token');
  const id = searchParams.get('id');
}
```

### 3. **URL Format**

All URLs now use hash-based routing:

```
Before (MPA):              After (SPA):
/projects              →   #/projects
/p?token=abc123        →   #/p?token=abc123
/folder?id=xyz         →   #/folder?id=xyz
/settings              →   #/settings
```

### 4. **Direct URL Access**

Users can access routes directly:
- `https://artifact.quick.shopify.io/#/projects`
- `https://artifact.quick.shopify.io/#/p?token=abc123`

The single `index.html` will load and the Router will handle the hash route.

## Available Routes

| Route | Description |
|-------|-------------|
| `#/` or `#/projects` | Projects list page |
| `#/p?token=xxx` | Project presentation/canvas |
| `#/folder?id=xxx` | Folder view |
| `#/settings` | Settings page |
| `#/auth/login` | Login page |
| `#/projects/new?folder=xxx` | Create new project |
| `#/follow-demo` | Follow feature demo |

## Important Notes

1. **All navigation is instant** - No page reloads
2. **Browser history works** - Back/forward buttons work correctly
3. **Deep linking works** - Share any URL with hash route
4. **No server required** - Pure client-side routing

## Migration Checklist

If adding new pages:

- ✅ Create component in `/components/pages/`
- ✅ Add route to `Router.tsx` in the `renderRoute()` function
- ✅ Use `useHashNavigation()` for navigation
- ✅ Use `useHashSearchParams()` for query params
- ✅ Never import from `next/navigation` in page components

## Example: Adding a New Route

```tsx
// 1. Create /components/pages/NewPage.tsx
export default function NewPage() {
  const router = useHashNavigation();
  return <div onClick={() => router.push('/projects')}>New Page</div>;
}

// 2. Add to /components/Router.tsx
import NewPage from '@/components/pages/NewPage';

export function Router() {
  const { hash } = useHashRouter();
  
  const renderRoute = () => {
    // ... existing routes
    if (hash === '/new-route') return <NewPage />;
    // ...
  };
  
  return <>{renderRoute()}</>;
}

// 3. Navigate to it
router.push('/new-route');
```

## Testing

```bash
# Build
pnpm build

# Preview locally
pnpm preview

# Open browser to http://localhost:3000
# Try: http://localhost:3000/#/projects
```
