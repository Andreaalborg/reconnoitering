# Fiks for Hvit Skjerm i Vercel

## Problem
Appen bygger uten feil men viser hvit skjerm i produksjon.

## Løsning

### 1. Sjekk Miljøvariabler i Vercel Dashboard

Gå til Vercel Dashboard → Settings → Environment Variables og sørg for at disse er satt:

```
MONGODB_URI=mongodb+srv://intsenai:20fNK8j2r8MQhHD3@cluster0.34dwe.mongodb.net/?retryWrites=true&w=majority
NEXTAUTH_URL=https://reconnoitering-g3fa-andrea-alborgs-projects.vercel.app
NEXTAUTH_SECRET=THIS_IS_A_VERY_SECURE_SECRET_FOR_RECONNOITERING_APP
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

**VIKTIG**: Bytt ut `NEXTAUTH_URL` med din faktiske Vercel URL!

### 2. Redeploy med Clear Cache

1. Gå til Vercel Dashboard
2. Gå til Settings → Functions
3. Klikk "Clear Cache"
4. Gå tilbake til Overview
5. Klikk "Redeploy" → "Redeploy with existing Build Cache" OFF

### 3. Sjekk Function Logs

1. Gå til Functions tab i Vercel
2. Se etter feil i:
   - `api/exhibitions`
   - `api/auth/[...nextauth]`
   - Andre API routes

### 4. Test med Health Check

Besøk: `https://din-app.vercel.app/health`

Dette bør vise en enkel side med miljøvariabler hvis appen kjører.

### 5. Sjekk Browser Console

De feilene du ser i console er fra browser extensions, IKKE fra appen:
- KaTeX warning - fra en matematikk extension
- Storage access - kan være fra ad blockers eller andre extensions

Prøv i inkognito-modus eller annen browser.

### 6. Hvis fortsatt hvit skjerm

Legg til denne debugging i `src/app/page.tsx`:

```javascript
useEffect(() => {
  console.log('Home page mounted');
  console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'Using relative URLs');
}, []);
```

### 7. Alternativ Løsning - Middleware

Hvis NextAuth fortsatt gir problemer, lag `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log all requests in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware:', request.nextUrl.pathname);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## Rask Sjekkliste

1. ✅ Miljøvariabler satt i Vercel?
2. ✅ Riktig NEXTAUTH_URL?
3. ✅ MongoDB Atlas whitelist inkluderer 0.0.0.0/0?
4. ✅ Clear cache og redeploy?
5. ✅ Sjekket Function logs?
6. ✅ Testet /health endpoint?
7. ✅ Prøvd inkognito-modus?

## Deployment Kommandoer

```bash
# Commit endringer
git add .
git commit -m "Fix: Add health check and debug white screen issue"
git push origin main

# Force redeploy fra Vercel CLI (hvis installert)
vercel --prod --force
```