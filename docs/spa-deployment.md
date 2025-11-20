# SPA Deployment Guide

This app is configured as a **Single Page Application (SPA)** without Server-Side Rendering (SSR). All routing happens client-side, making it perfect for static hosting platforms like Quick.

## How It Works

### Static Export

The app is built with `output: "export"` in `next.config.ts`, which generates static HTML, CSS, and JavaScript files that can be hosted anywhere.

### Client-Side Routing

When users navigate within the app, Next.js's `useRouter` handles routing on the client side without page reloads.

### Deep Link Support

The key to making deep links work (e.g., `/p/abc123` or `/folder/xyz789`) on static hosting is the **custom 404 page** (`pages/404.js`).

#### How Deep Links Work:

1. **User visits a deep link** (e.g., `https://artifact.quick.shopify.io/p/abc123`)
2. **Static host can't find the file** (there's no `/p/abc123/index.html`)
3. **Host serves `404.html`** as a fallback
4. **404 page JavaScript runs** and detects the intended path
5. **Next.js router navigates** to the correct route client-side
6. **App renders normally** as if user clicked a link

### The 404 Page

```javascript
// pages/404.js
export default function Custom404() {
  const router = useRouter();

  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;

    if (path !== "/404" && path !== "/404/") {
      router.replace(path + search + hash);
    }
  }, [router]);

  return <LoadingSpinner />;
}
```

This page:

- Shows a loading spinner briefly
- Reads the current URL path
- Uses Next.js router to navigate to that path client-side
- Allows the app to render the correct page

## Building & Deploying

### Build Command

```bash
pnpm build
```

This generates static files in the `/dist` directory.

### Deploy to Quick

```bash
pnpm deploy        # Deploy to 'artifact' subdomain
pnpm deploy:jesper # Deploy to 'artifact-pr-jesper' subdomain
pnpm deploy:staging # Deploy to 'staging-artifact' subdomain
```

### What Gets Deployed

Only the `/dist` folder is deployed, containing:

- `index.html` - Home page
- `404.html` - Fallback for all non-existent routes
- `p/[id].html` - Template for project pages (unused in production)
- `folder/[id].html` - Template for folder pages (unused in production)
- `_next/` - JavaScript bundles and assets
- Static assets (images, fonts, etc.)

## Configuration

### Next.js Config (`next.config.ts`)

```typescript
{
  output: "export",        // Generate static files
  distDir: "dist",         // Output to /dist
  trailingSlash: false,    // Clean URLs without trailing slashes
  images: {
    unoptimized: true      // Required for static export
  }
}
```

### Package Scripts

```json
{
  "build": "next build",
  "deploy": "pnpm build && quick deploy dist artifact"
}
```

## Testing Locally

### Development Server

```bash
pnpm dev
```

Uses Next.js dev server with hot reload. All routes work normally.

### Production Preview

```bash
pnpm preview
```

Serves the built `/dist` folder locally using `npx serve`, simulating production hosting.

**Important**: When using `serve`, the 404 fallback routing works automatically because `serve` is configured to use `404.html` as a fallback.

### Testing Deep Links

After running `pnpm preview`:

1. Visit http://localhost:3000
2. Navigate to a project or folder
3. Copy the URL (e.g., http://localhost:3000/p/abc123)
4. Open that URL in a new tab directly
5. You should see a brief loading spinner, then the correct page

## Limitations of Static Export

### What Doesn't Work:

- ❌ Server-Side Rendering (SSR)
- ❌ API Routes (`/pages/api/*`)
- ❌ Image Optimization API
- ❌ Incremental Static Regeneration (ISR)
- ❌ Middleware
- ❌ Server Components (RSC)

### What Works Great:

- ✅ Client-side routing
- ✅ Dynamic routes with client-side data fetching
- ✅ Static assets
- ✅ All React features
- ✅ Third-party APIs (Quick, etc.)
- ✅ Real-time features (WebSockets, etc.)

## Troubleshooting

### Deep links show 404 or don't work

**Cause**: The 404.html file wasn't deployed or the hosting platform doesn't support it.

**Solution**:

- Ensure `pages/404.js` exists
- Run `pnpm build` to generate `dist/404.html`
- Verify `dist/404.html` exists before deploying
- Quick should automatically serve 404.html for non-existent routes

### Blank page on deep links

**Cause**: JavaScript error preventing the 404 redirect logic from running.

**Solution**:

- Check browser console for errors
- Ensure the Quick script (`/client/quick.js`) loads successfully
- Verify all environment variables are set

### Routes work in dev but not production

**Cause**: Development server handles routing differently than static hosting.

**Solution**: Always test with `pnpm preview` before deploying.

## Architecture

```
User visits /p/abc123
         ↓
Quick tries to find /p/abc123/index.html
         ↓
File doesn't exist
         ↓
Quick serves /404.html
         ↓
404.html loads with full Next.js app
         ↓
JavaScript detects path is /p/abc123
         ↓
Next.js router navigates to /p/abc123
         ↓
React components render
         ↓
useSWR fetches data from Quick DB
         ↓
Page displays normally
```

## Best Practices

1. **Always test production builds locally** with `pnpm preview`
2. **Check the dist folder** after building to ensure 404.html exists
3. **Use Next.js router** for all navigation (`<Link>` or `router.push()`)
4. **Avoid hard links** (`<a href="...">`) for internal navigation
5. **Client-side data fetching only** (useSWR, useEffect, etc.)

## Quick Deployment Notes

Quick is specifically designed for static sites and works perfectly with this SPA setup:

- ✅ Automatically serves 404.html as fallback
- ✅ No server configuration needed
- ✅ Fast CDN delivery
- ✅ Google auth built-in
- ✅ Quick APIs work seamlessly (db, fs, socket, etc.)
