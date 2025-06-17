# Løsning: Blank Skjerm i Vercel

## Problemet
API-ene returnerer også blank skjerm, noe som betyr at det er et server-side problem, ikke bare frontend.

## Mulige Årsaker

### 1. MongoDB Connection Issue (MEST SANNSYNLIG)
MongoDB kan ikke koble til fra Vercel fordi:
- IP whitelist i MongoDB Atlas ikke inkluderer Vercel
- Feil connection string

### 2. NextAuth Configuration Issue
NextAuth kan blokkere alle requests hvis ikke riktig konfigurert.

## Løsning Steg-for-Steg

### Steg 1: Fiks MongoDB Atlas IP Whitelist

1. **Gå til MongoDB Atlas**
   - Logg inn på: https://cloud.mongodb.com
   - Bruk credentials for MongoDB (ikke din app)

2. **Finn ditt Cluster**
   - Cluster navnet er sannsynligvis "Cluster0"

3. **Network Access**
   - I venstre meny, klikk "Network Access"
   - Klikk "ADD IP ADDRESS"
   - Klikk "ALLOW ACCESS FROM ANYWHERE"
   - Dette legger til `0.0.0.0/0` (nødvendig for Vercel)
   - Klikk "Confirm"

4. **Vent 2-3 minutter** for at endringen skal tre i kraft

### Steg 2: Verifiser MongoDB URI

Sjekk at MongoDB URI i Vercel er EKSAKT lik:
```
mongodb+srv://intsenai:20fNK8j2r8MQhHD3@cluster0.34dwe.mongodb.net/?retryWrites=true&w=majority
```

Vanlige feil:
- Ekstra spaces
- Manglende `?retryWrites=true&w=majority`
- Feil i brukernavn/passord

### Steg 3: Test API Direkte

Etter MongoDB fix, test:
1. https://reconnoitering-wvya.vercel.app/api/debug
2. https://reconnoitering-wvya.vercel.app/api/test

Hvis disse returnerer JSON data, fungerer backend!

### Steg 4: Emergency Fix - Disable NextAuth Temporarily

Hvis fortsatt problemer, lag denne filen for å teste:

**src/app/api/health/route.ts**
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nodeEnv: process.env.NODE_ENV
    }
  });
}
```

### Steg 5: Sjekk Vercel Logs

1. I Vercel Dashboard → Functions tab
2. Se etter røde error logs
3. Vanlige feil:
   - "MongoServerError: bad auth"
   - "Connection timeout"
   - "Access denied"

### Steg 6: Full Redeploy

Etter MongoDB fix:
1. Vercel Dashboard → Settings → Functions
2. "Clear Cache"
3. Redeploy med cleared cache

## Quick Checklist

- [ ] MongoDB Atlas har `0.0.0.0/0` i IP whitelist
- [ ] MongoDB URI er korrekt i Vercel env variables
- [ ] Alle 4 environment variables er satt
- [ ] Node.js version er 20.x (ikke 22.x)
- [ ] Cache er cleared
- [ ] Redeployed etter alle endringer

## Hvis Fortsatt Ikke Fungerer

### Test Lokalt med Production Env
```bash
# Lag .env.production.local
cp .env.production .env.production.local

# Test production build
npm run build
npm start
```

Hvis det fungerer lokalt men ikke i Vercel, er det 100% et environment/configuration problem.

### Nuclear Option
1. Eksporter alle environment variables
2. Slett Vercel prosjektet
3. Opprett nytt prosjekt
4. Importer fra GitHub på nytt
5. Sett alle environment variables
6. Deploy

## MongoDB er IKKE installert lokalt
MongoDB kjører i skyen (MongoDB Atlas). Du trenger IKKE:
- MongoDB installert på din PC
- MongoDB kjørende lokalt
- Noen database server

Alt kjører i MongoDB Atlas cloud service.

## Konklusjon
Problemet er mest sannsynlig at MongoDB Atlas blokkerer Vercel. Fix IP whitelist og alt skal fungere!