# Environment Variables Template

Create a `.env.local` file in your project root with these variables:

```bash
# Supabase Configuration
# Get these from your Supabase project dashboard at https://supabase.com/dashboard/project/[project-id]/settings/api

# Your Supabase project URL (public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase anon/public key (public, safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Your Supabase service role key (private, server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application URL (for redirects and CORS)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup Instructions:

### 1. Supabase Dashboard
- Go to **Settings → API** to get URL and keys
- Go to **Authentication → Providers** to enable Google OAuth
- Set **Site URL** to: `http://localhost:3000` (local) or `https://your-app.vercel.app` (production)
- Add **redirect URLs**: 
  - `http://localhost:3000/auth/callback` 
  - `https://your-app.vercel.app/auth/callback`

### 2. Google Cloud Console
- Create **OAuth 2.0 credentials**
- Set **authorized origins**: `http://localhost:3000`, `https://your-app.vercel.app`
- Set **redirect URIs**: `https://your-project-id.supabase.co/auth/v1/callback`
- Copy **Client ID** and **Secret** to Supabase Google provider settings

### 3. Vercel (for production)
- Set all `NEXT_PUBLIC_*` variables in environment settings
- Set `SUPABASE_SERVICE_ROLE_KEY` as a secret environment variable
- Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
