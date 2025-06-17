# Vercel Deployment Guide for Reconnoitering

## Oversikt
Denne guiden dokumenterer alle kjente problemer og løsninger for Vercel-deployment av Reconnoitering-prosjektet.

## Vanlige Deployment-problemer

### 1. TypeScript Type-feil

#### Problem
Build feiler med TypeScript type-feil som:
```
Type error: Type 'null' is not assignable to type '{ lat: number; lng: number; } | undefined'.
```

#### Løsning
- Sørg for at alle typer matcher eksakt mellom komponenter
- Bruk `undefined` i stedet for `null` når en komponent forventer optional props
- Kjør `npx tsc --noEmit` lokalt for å sjekke type-feil før push

### 2. Hvit Skjerm etter Vellykket Deployment

#### Mulige årsaker og løsninger:

**a) Miljøvariabler mangler eller er feil konfigurert**
- Sjekk at alle miljøvariabler er satt i Vercel Dashboard
- Nødvendige variabler:
  ```
  MONGODB_URI=
  NEXTAUTH_URL=https://ditt-domene.vercel.app
  NEXTAUTH_SECRET=
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
  ```
- Husk at `NEXT_PUBLIC_` prefix er nødvendig for variabler som brukes på klient-siden

**b) Build-cache problemer**
- Gå til Vercel Dashboard → Settings → Functions
- Trykk "Clear Cache" og redeploy

**c) Runtime-feil som ikke fanges opp under build**
- Sjekk Vercel Functions logs for runtime-feil
- Se etter console errors i nettleser-konsollen

### 3. MongoDB Connection Issues

#### Problem
"MongoServerError: bad auth" eller connection timeouts

#### Løsning
- Sjekk at IP whitelist i MongoDB Atlas inkluderer `0.0.0.0/0` for Vercel
- Verifiser at bruker/passord er korrekt i connection string
- Bruk connection pooling og proper cleanup

### 4. Memory og Build-optimaliseringer

#### Gjeldende optimalisering i `package.json`:
```json
"vercel-build": "NODE_OPTIONS='--max_old_space_size=4096 --no-warnings' next build --no-lint"
```

## Pre-deployment Sjekkliste

### 1. Lokale Tester
```bash
# Type-sjekk
npx tsc --noEmit

# Test production build (krever Node.js >= 18.17.0)
npm run build

# Start production server lokalt
npm start
```

### 2. Miljøvariabler
Lag en `.env.production.local` fil for testing:
```env
MONGODB_URI=din-mongodb-uri
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=din-secret
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=din-api-key
```

### 3. Git Status
```bash
# Sjekk at alle endringer er committed
git status

# Se over endringene
git diff

# Commit med beskrivende melding
git add .
git commit -m "Fix: TypeScript type mismatch for userPosition prop"
```

## Vercel-spesifikke Innstillinger

### vercel.json
```json
{
  "functions": {
    "src/app/api/admin/migrate/route.ts": {
      "maxDuration": 60
    },
    "src/app/api/admin/update-tracker/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### Build & Development Settings
- Framework Preset: Next.js
- Build Command: `npm run vercel-build`
- Output Directory: `.next`
- Install Command: `npm install`

## Debugging Tips

### 1. Sjekk Vercel Build Logs
- Se etter warnings som kan indikere problemer
- Merk deg om alle dependencies installeres korrekt

### 2. Runtime Logs
- Gå til Functions tab i Vercel Dashboard
- Sjekk logs for hver API route

### 3. Client-side Debugging
Hvis du får hvit skjerm:
1. Åpne browser DevTools
2. Sjekk Console for JavaScript-feil
3. Sjekk Network tab for failede requests
4. Se om miljøvariabler leses korrekt (console.log dem midlertidig)

## Best Practices

### 1. Alltid Test Lokalt Først
- Kjør full build lokalt
- Test alle kritiske features
- Sjekk at miljøvariabler fungerer

### 2. Gradvis Deployment
- Deploy til preview branch først
- Test preview URL grundig
- Merge til main når alt fungerer

### 3. Overvåking
- Sett opp error tracking (f.eks. Sentry)
- Monitor API response times
- Sjekk Analytics for 404s og errors

## Vanlige Kommandoer

```bash
# Full lokal test-sekvens
npx tsc --noEmit           # Type-sjekk
npm run build              # Test build
npm start                  # Test production server

# Deploy til Vercel
git add .
git commit -m "beskrivelse"
git push origin main       # Trigger automatisk deploy

# Force redeploy fra Vercel CLI
vercel --prod --force
```

## Nødprosedyrer

### Hvis deployment feiler:
1. Sjekk build logs i Vercel Dashboard
2. Revert til forrige fungerende commit hvis nødvendig
3. Test lokalt med eksakt samme Node-versjon som Vercel bruker

### Hvis appen viser hvit skjerm:
1. Sjekk browser console for errors
2. Verifiser at alle API routes fungerer via Postman/curl
3. Sjekk at static files serveres korrekt
4. Clear cache og redeploy

## Kontakt og Support
- Vercel Status: https://www.vercel-status.com/
- Next.js Docs: https://nextjs.org/docs
- Report issues: [Prosjektets GitHub]

---
Sist oppdatert: 2025-06-17