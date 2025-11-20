# PWA Setup Documentation

This application is now configured as a Progressive Web App (PWA) that can be installed on devices and used standalone.

## What's Included

### 1. Web App Manifest (`/public/manifest.json`)

- Defines app name, description, and icons
- Sets display mode to "standalone" (hides browser UI)
- Configures theme colors and orientation
- Includes app shortcuts for quick access

### 2. Service Worker (`/public/sw.js`)

- Enables offline functionality
- Caches essential assets for faster loading
- Network-first strategy with cache fallback
- Automatic cache cleanup for old versions

### 3. Service Worker Registration (`/public/register-sw.js`)

- Automatically registers the service worker
- Handles service worker updates
- Listens for app install events
- Provides update notifications

### 4. PWA Meta Tags (in `app/layout.tsx`)

- Apple mobile web app support
- Viewport configuration for mobile devices
- Theme color for browser UI
- Manifest link

### 5. Install Prompt Component (`components/PWAInstallPrompt.tsx`)

- Optional UI component to prompt users to install the app
- Remembers user dismissal for 7 days
- Automatically hides when app is installed

## Testing the PWA

### Local Development

1. Build the app: `npm run build`
2. Serve the dist folder: `npx serve dist`
3. Open in Chrome and check DevTools > Application > Manifest
4. Test service worker in DevTools > Application > Service Workers

### Testing Install Prompt

1. Open the app in Chrome (desktop or mobile)
2. The browser will show an install prompt automatically
3. Or use the custom `PWAInstallPrompt` component

### Testing Offline Mode

1. Open DevTools > Network
2. Select "Offline" from the throttling dropdown
3. Refresh the page - it should still load from cache

## Using the Install Prompt Component

Add the component to your main layout or any page:

```tsx
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export default function Page() {
  return (
    <>
      {/* Your page content */}
      <PWAInstallPrompt />
    </>
  );
}
```

The component will:

- Only show when the app is installable
- Hide automatically on installed apps
- Remember user dismissal for 7 days
- Show a clean, dismissable UI prompt

## Deployment to Quick

When deploying to Quick with `quick deploy dist your-subdomain`:

1. All PWA files will be included automatically
2. Service worker will register on first visit
3. Users can install the app from their browser
4. The app will work offline after first visit

## Customization

### Change Theme Colors

Edit `public/manifest.json`:

```json
{
  "background_color": "#000000",
  "theme_color": "#000000"
}
```

### Add More Shortcuts

Edit `public/manifest.json` shortcuts array:

```json
{
  "shortcuts": [
    {
      "name": "New Project",
      "url": "/projects/new",
      "icons": [...]
    }
  ]
}
```

### Modify Cache Strategy

Edit `public/sw.js` to change caching behavior:

- Add more files to `PRECACHE_ASSETS`
- Change fetch strategy (network-first, cache-first, etc.)
- Adjust cache names and cleanup logic

### Update Service Worker Version

Change `CACHE_NAME` in `public/sw.js`:

```javascript
const CACHE_NAME = "artifact-v2"; // Increment version
```

## Browser Support

- **Chrome/Edge**: Full support (desktop & mobile)
- **Safari/iOS**: Full support with some limitations
- **Firefox**: Full support (desktop & mobile)
- **Samsung Internet**: Full support

## Best Practices

1. **Always increment cache version** when making changes
2. **Test offline mode** before deploying
3. **Keep service worker simple** - avoid complex logic
4. **Monitor cache size** - don't cache too much
5. **Handle updates gracefully** - prompt users to refresh

## Troubleshooting

### Service Worker Not Registering

- Check browser console for errors
- Ensure HTTPS (or localhost for development)
- Clear browser cache and try again

### App Not Installable

- Verify manifest.json is accessible
- Check that all required icons exist
- Ensure app is served over HTTPS

### Updates Not Showing

- Increment service worker version
- Clear application cache in DevTools
- Hard refresh (Cmd/Ctrl + Shift + R)

### Offline Mode Not Working

- Check Network tab in DevTools
- Verify service worker is active
- Ensure assets are being cached

## Additional Resources

- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest Spec](https://www.w3.org/TR/appmanifest/)
