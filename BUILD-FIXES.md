# 🔧 Build Fixes Documentation
**Last Updated:** 2025-06-20

## Overview
This document tracks all build errors encountered and their fixes during the deployment process.

## Netlify Build Errors Fixed

### 1. Import Error: connectDB not exported
**Error:**
```
Type error: Module '"@/lib/mongodb"' has no exported member 'connectDB'
```

**Files affected:**
- `/src/app/api/dev/make-admin/route.ts`
- `/src/app/api/dev/reset-admin/route.ts`

**Fix:**
Changed import from `import { connectDB } from '@/lib/mongodb'` to `import dbConnect from '@/lib/mongodb'`
and updated all function calls from `connectDB()` to `dbConnect()`

### 2. Missing formatDateString function
**Error:**
```
Type error: Cannot find name 'formatDateString'
```

**File affected:**
- `/src/app/calendar/page.tsx` (line 374)

**Fix:**
Added the missing function:
```typescript
function formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

### 3. getExhibitionsForDate wrong arguments
**Error:**
```
Type error: Expected 1 arguments, but got 2
```

**File affected:**
- `/src/app/calendar/page.tsx` (lines 383, 421)

**Fix:**
The function was defined to accept only one parameter but was being called with two.
Changed from: `getExhibitionsForDate(exhibitions, cell.date)`
To: `getExhibitionsForDate(cell.date)`

### 4. Missing handleDayClick function
**Error:**
```
Cannot find name 'handleDayClick'
```

**File affected:**
- `/src/app/calendar/page.tsx`

**Fix:**
Added the missing function that handles navigation when clicking on calendar days:
```typescript
const handleDayClick = (dateStr: string) => {
  router.push(`/date-search?date=${dateStr}`);
};
```

## Sentry Configuration Issues

### Warnings about deprecated configuration
**Warning:**
```
[@sentry/nextjs] DEPRECATION WARNING: It is recommended renaming your `sentry.client.config.ts` file
```

**Fix:**
1. Created `instrumentation.ts` file
2. Temporarily disabled Sentry in `next.config.mjs` by commenting out the `withSentryConfig` wrapper
3. Added `instrumentationHook: true` to experimental features

## Node.js Version Issues

### Initial Setup
**Issue:** Node.js v18.12.0 was too old for Next.js 14 (requires v18.17.0+)

**Fix:** Updated to Node.js v22.14.0

## Common Build Commands

### Local Testing
```bash
# Test build locally
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Clean build
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Netlify Deployment
```bash
# Push to trigger Netlify build
git add -A
git commit -m "Fix build errors"
git push origin main
```

## Environment Variables Required
Make sure these are set in Netlify:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 5. Missing Header import
**Error:**
```
Type error: Cannot find name 'Header'. Did you mean 'Headers'?
```

**File affected:**
- `/src/app/day-planner/page.tsx` (line 594)

**Fix:**
Added missing import: `import Header from '@/components/Header';`

## Notes for Future Builds
1. Always test `npm run build` locally before pushing
2. Check for TypeScript errors with `npx tsc --noEmit`
3. Remove all `/dev/` endpoints before production deployment
4. Keep Sentry temporarily disabled until dependency issues are resolved
5. Ensure all components are properly imported before use