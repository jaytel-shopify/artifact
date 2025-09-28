# 🌐 Vercel URL Configuration Guide

Based on your screenshot, here's what you need to update:

## ✅ Your Google OAuth Setup Looks Correct!

Your authorized origins and redirect URIs are properly configured:
- ✅ `http://localhost:3000` (local development)
- ✅ `http://artifact-shopify.vercel.app` (production)

## 🔧 What You Need to Update:

### **1. Supabase Dashboard Settings**

Go to your **Supabase Dashboard → Authentication → Settings**:

#### **Site URL:**
- Set to: `https://artifact-shopify.vercel.app` (your production domain)

#### **Additional Redirect URLs:**
Add these **one per line**:
```
http://localhost:3000/auth/callback
https://artifact-shopify.vercel.app/auth/callback
http://localhost:3000
https://artifact-shopify.vercel.app
```

### **2. Vercel Environment Variables**

In your **Vercel Dashboard → Project → Settings → Environment Variables**:

```bash
# Set these for Production
NEXT_PUBLIC_SUPABASE_URL=https://kylgjtenrlolmblppu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=https://artifact-shopify.vercel.app
```

### **3. Your Local .env.local**

```bash
# For local development
NEXT_PUBLIC_SUPABASE_URL=https://kylgjtenrlolmblppu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 Key Changes Made:

### **Fixed Routing:**
- ✅ **Homepage** is now the projects dashboard (`/`)
- ✅ **No more `/projects`** route - everything is on the root
- ✅ **Dynamic redirects** - uses current domain for OAuth callbacks

### **Dynamic Domain Detection:**
```typescript
// Auth automatically detects current domain
const currentOrigin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;
```

### **Updated Middleware:**
- ✅ **Root route protected** - `/` requires authentication
- ✅ **Proper redirects** - unauthenticated users go to `/auth/login`
- ✅ **Callback handling** - OAuth success redirects to `/`

## 🔍 Why It Was Redirecting to Localhost:

The issue was that the **Supabase Auth UI** was using a hardcoded `process.env.NEXT_PUBLIC_APP_URL` which was set to `localhost:3000`. Now it **dynamically detects** the current domain.

## ✅ After These Changes:

### **Local Development:**
- Visit `http://localhost:3000` → Auth required → Login → Projects dashboard

### **Production:**
- Visit `https://artifact-shopify.vercel.app` → Auth required → Login → Projects dashboard
- OAuth callback properly redirects to `https://artifact-shopify.vercel.app`

## 🚀 Test This:

1. **Update Vercel environment variables**
2. **Update Supabase redirect URLs**  
3. **Redeploy** (should auto-deploy from your GitHub push)
4. **Test**: Visit production URL → Should redirect to login → Should redirect back to production domain

**The redirect loop issue should be completely resolved!** 🎯
