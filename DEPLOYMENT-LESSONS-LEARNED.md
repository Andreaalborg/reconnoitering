# Deployment Lessons Learned - Reconnoitering Project

## Oversikt
Dette dokumentet oppsummerer alle problemer, løsninger og lærdommer fra deployment av Reconnoitering-prosjektet fra Vercel til Netlify.

## Timeline og Problemer

### 1. Initial Problem - Vercel Build Feil
**Problem**: TypeScript type mismatch
```
Type error: Type 'null' is not assignable to type '{ lat: number; lng: number; } | undefined'
```

**Løsning**: 
- Endret `useState<T | null>(null)` til `useState<T | undefined>(undefined)`
- Fikset TypeScript strict null checks i `mongodb.ts` med `!` operator

**Lærdom**: 
- Alltid kjør `npx tsc --noEmit` lokalt før push
- Vercel har strengere TypeScript checking enn lokal dev

### 2. Hvit Skjerm Problem
**Problem**: Appen bygget uten feil men viste bare hvit skjerm i produksjon

**Feilsøking gjort**:
1. Sjekket environment variables ✓
2. Sjekket MongoDB connection ✓
3. Sjekket browser console - bare extension errors
4. Laget debug endpoints (`/api/debug`, `/api/simple-test`) ✓
5. Laget test sider (`/test-page`, `/basic`, `/no-auth`)

**Oppdagelse**: ALLE sider var blanke, selv statiske HTML filer!

**Lærdom**: 
- Hvis selv statiske filer ikke fungerer, er det et platform/deployment problem
- Start debugging med enkleste mulige test (statisk HTML)

### 3. Multiple Vercel Projects Problem
**Problem**: 8 Vercel-prosjekter bygget samtidig når vi pushet til GitHub

**Årsak**: Flere import av samme GitHub repo over tid

**Løsning**:
- Identifiserte riktig prosjekt (det med environment variables)
- Slettet 7 duplikate prosjekter
- Beholdt kun ett aktivt prosjekt

**Lærdom**:
- Sjekk alltid for eksisterende prosjekter før ny import
- Slett gamle/ubrukte prosjekter for å unngå forvirring

### 4. NextAuth Session Problem
**Problem**: Build feilet med "Cannot destructure property 'data' of useSession() as it is undefined"

**Årsak**: Fjernet NextAuthProvider fra layout under debugging

**Løsning**: La tilbake NextAuthProvider i root layout

**Lærdom**:
- NextAuth krever SessionProvider wrapper
- Alle komponenter som bruker `useSession` vil feile uten provider

### 5. Environment Variables Leak
**Problem**: Google Maps API key ble eksponert i Git history

**Årsak**: API key var hardkodet i dokumentasjonsfiler

**Løsning**:
1. Fjernet API key fra alle .md filer
2. Erstattet med placeholder verdier
3. Genererte ny API key

**Lærdom**:
- ALDRI inkluder real API keys i dokumentasjon
- Bruk alltid placeholders: `YOUR_API_KEY_HERE`
- Google scanner GitHub for lekkede keys

### 6. Vercel Platform Issue
**Problem**: Selv etter alle fixes, Vercel viste fortsatt blank sider

**Symptomer**:
- Build success
- Alle API routes returnerte blank
- Static HTML returnerte blank
- View source var helt tom

**Løsning**: Byttet til Netlify

**Lærdom**:
- Noen ganger er problemet plattformen, ikke koden
- Ha backup deployment platform klar
- Hvis localhost fungerer perfekt, mistevek deployment platform

## Tekniske Lærdommer

### 1. Environment Variables
```env
# Kritiske variabler som MÅ settes:
MONGODB_URI=             # Database connection
NEXTAUTH_URL=            # MÅ matche deployment URL eksakt
NEXTAUTH_SECRET=         # For session encryption
NEXT_PUBLIC_*=           # For client-side variabler
```

### 2. Build Optimizations
```json
// package.json
"vercel-build": "NODE_OPTIONS='--max_old_space_size=4096 --no-warnings' next build --no-lint"
```
- Økt memory for store builds
- Disabled linting i production build for hastighet

### 3. MongoDB Atlas Setup
- IP Whitelist MÅ inkludere `0.0.0.0/0` for cloud deployments
- Connection string må ha `?retryWrites=true&w=majority`

### 4. Next.js App Directory
- Alle client components trenger `'use client'` directive
- API routes bruker `route.ts` ikke `page.tsx`
- Dynamic routes håndteres med `[param]` folders

### 5. Debugging Strategi
```javascript
// Lag alltid simple test endpoints
export async function GET() {
  return Response.json({ 
    status: 'ok',
    env: {
      hasDb: !!process.env.MONGODB_URI,
      // ALDRI eksponer faktiske verdier!
    }
  });
}
```

## Best Practices Lært

### 1. Pre-Deployment Checklist
- [ ] Kjør `npx tsc --noEmit` for TypeScript errors
- [ ] Test production build lokalt: `npm run build && npm start`
- [ ] Verifiser alle environment variables
- [ ] Sjekk for hardkodede verdier/secrets
- [ ] Test med `.env.production.local` lokalt

### 2. Deployment Debugging
1. Start med enkleste test (static HTML)
2. Test API routes direkte
3. Sjekk browser console OG network tab
4. Verifiser View Source har innhold
5. Sjekk platform logs (Functions/Runtime)

### 3. Security
- Bruk GitHub Secrets for sensitive data
- Aldri commit `.env` filer
- Roter API keys hvis eksponert
- Bruk placeholders i dokumentasjon

### 4. Platform Valg
**Vercel Pros**: 
- Laget for Next.js
- Automatisk optimization
- God GitHub integration

**Netlify Pros**:
- Mer stabil for komplekse apps
- Bedre error messages
- Enklere debugging

### 5. Git Workflow
```bash
# Alltid før push:
git status          # Sjekk hva som endres
git diff            # Review endringer
npm run build       # Test build lokalt
```

## Konklusjon

### Hva Gikk Galt
1. Multiple Vercel projects forårsaket forvirring
2. Environment variables ble ikke riktig konfigurert
3. API key leak krevde regenerering
4. Vercel platform issue var umulig å debugge

### Hva Gikk Riktig  
1. Systematisk debugging approach
2. Laget test endpoints for isolert testing
3. Dokumenterte alt underveis
4. Byttet platform når nødvendig

### Viktigste Lærdommer
1. **Start enkel** - Test med basic HTML først
2. **Ikke anta** - Verifiser hver antagelse
3. **Localhost ≠ Production** - Test production build
4. **Platform matters** - Ha backup klar
5. **Security first** - Aldri hardkod secrets

### For Fremtiden
1. Bruk CI/CD pipeline med automated tests
2. Set opp staging environment
3. Implementer proper error logging (Sentry)
4. Ha deployment rollback plan
5. Dokumenter deployment process

## Ressurser
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Netlify Next.js Guide](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Environment Variables Best Practices](https://www.twilio.com/blog/working-with-environment-variables-in-node-js-html)

---
Dokumentert: 2025-06-18
Total tid brukt på debugging: ~3 timer
Løsning: Migrert fra Vercel til Netlify