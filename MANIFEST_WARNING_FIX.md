# Manifest.webmanifest Warning Fix

## Issue
Vercel deployment showed the warning:
```
WARNING: Unable to find source file for page /manifest.webmanifest/route with extensions: tsx, ts, jsx, js, this can cause functions config from `vercel.json` to not be applied
```

## Root Cause
The `manifest.webmanifest` file was incorrectly placed in the `app/` directory. In Next.js App Router:
- Static files should be in the `public/` directory
- Files in `app/` directory are expected to be route handlers or page components

## Solution
Moved the `manifest.webmanifest` file from `app/` to `public/` directory:
```bash
mv app/manifest.webmanifest public/manifest.webmanifest
```

## How It Works
1. Files in the `public/` directory are served statically at the root path
2. The reference in `app/layout.tsx` (`manifest: '/manifest.webmanifest'`) will correctly resolve to the file in the public directory
3. No route handler is needed for static files

## Benefits
- Eliminates the Vercel warning
- Follows Next.js best practices for static file serving
- Ensures proper caching and CDN distribution of the manifest file
- Prevents issues with function configuration in `vercel.json`

## Verification
After deployment, the manifest should be accessible at:
```
https://mailweaver.farzanfa.com/manifest.webmanifest
```