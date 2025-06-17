# Debug Guide - Hvit Skjerm i Vercel

## Problem
Deployment er vellykket men viser hvit skjerm på https://reconnoitering-wvya.vercel.app/

## Debug Steg

### 1. Test API Endpoints
Åpne disse URL-ene i nettleseren:

1. **Debug endpoint**: https://reconnoitering-wvya.vercel.app/api/debug
   - Sjekker om environment variables er satt

2. **Health check**: https://reconnoitering-wvya.vercel.app/health
   - Enkel side som viser om React kjører

3. **Exhibitions API**: https://reconnoitering-wvya.vercel.app/api/exhibitions
   - Sjekker om database connection fungerer

### 2. Sjekk Browser Console
1. Åpne https://reconnoitering-wvya.vercel.app/
2. Høyreklikk → Inspect → Console
3. Se etter røde feilmeldinger (ignorer KaTeX warnings)
4. Ta screenshot av eventuelle feil

### 3. Sjekk Network Tab
1. I Developer Tools, gå til Network tab
2. Refresh siden (F5)
3. Se etter røde requests (failed)
4. Sjekk spesielt:
   - Er det 404 errors?
   - Er det 500 errors?
   - Laster JavaScript-filer?

### 4. Vercel Function Logs
1. I Vercel Dashboard → Functions tab
2. Se etter feil i:
   - `api/exhibitions`
   - `api/auth/[...nextauth]`
   - Andre API routes

### 5. Framework Settings å Dobbeltsjekke

I Vercel Settings → General:

**Riktige settings:**
- Framework Preset: `Next.js`
- Build Command: `npm run vercel-build`
- Output Directory: (la stå tom for Next.js default)
- Install Command: `npm install`
- Development Command: `next`

**Node.js Version:**
- Prøv å endre fra 22.x til 20.x
- Node 22 er veldig ny og kan ha kompatibilitetsproblemer

### 6. Mulige Årsaker og Løsninger

#### A. Client-side JavaScript Error
**Symptom**: Hvit skjerm, ingen innhold
**Løsning**: Sjekk console for JavaScript errors

#### B. Hydration Mismatch
**Symptom**: Content flashes then disappears
**Løsning**: Sjekk for 'use client' direktiver

#### C. API/Database Connection
**Symptom**: Loading spinner eller error state
**Løsning**: Test API endpoints direkte

#### D. Build Output Problem
**Symptom**: 404 på main JavaScript bundle
**Løsning**: Sjekk Build logs for warnings

### 7. Quick Fix Attempts

#### Attempt 1: Clear Cache og Redeploy
1. Settings → Functions → Clear Cache
2. Redeploy med "Use existing Build Cache" OFF

#### Attempt 2: Endre Node Version
1. Settings → General → Node.js Version
2. Endre til 20.x
3. Redeploy

#### Attempt 3: Sjekk Build Output
1. Gå til siste deployment
2. Klikk på "Building" fasen
3. Se etter:
   - "Compiled successfully"
   - Antall routes generert
   - Output size warnings

### 8. Hvis ingenting fungerer

Push denne endringen for å tvinge en full rebuild:

```javascript
// I src/app/page.tsx, legg til helt øverst:
console.log('Homepage loading...', {
  env: process.env.NODE_ENV,
  url: process.env.NEXTAUTH_URL
});
```

### 9. Sammenlign med localhost

Kjør lokalt og sjekk:
```bash
npm run build
npm start
```

Besøk http://localhost:3000 - fungerer det der?

## Sjekkliste

- [ ] Testet /api/debug endpoint
- [ ] Sjekket browser console for errors
- [ ] Sjekket Network tab for failed requests
- [ ] Sjekket Vercel Function logs
- [ ] Prøvd Node.js 20.x istedenfor 22.x
- [ ] Clearet cache og redeployed
- [ ] Sjekket Build logs for warnings

## Send meg denne infoen:

1. Hva viser https://reconnoitering-wvya.vercel.app/api/debug
2. Screenshot av browser console errors
3. Hvilke requests feiler i Network tab
4. Eventuelle errors fra Vercel Functions logs