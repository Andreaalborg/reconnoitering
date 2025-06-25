# Environment Variables for Netlify

## Kopier disse til Netlify Dashboard → Site Settings → Environment Variables

### 1. MONGODB_URI
```
Key: MONGODB_URI
Value: mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER].mongodb.net/?retryWrites=true&w=majority
Environment: ✓ Production, ✓ Preview, ✓ Development
```

### 2. NEXTAUTH_URL
```
Key: NEXTAUTH_URL
Value: https://[DIN-NETLIFY-URL].netlify.app
Environment: ✓ Production
```
**VIKTIG**: Bytt ut [DIN-NETLIFY-URL] med din faktiske Netlify URL!
- For nytt prosjekt vil det være noe som: `reconnoitering.netlify.app`
- IKKE inkluder trailing slash (/)

### 3. NEXTAUTH_SECRET
```
Key: NEXTAUTH_SECRET
Value: THIS_IS_A_VERY_SECURE_SECRET_FOR_RECONNOITERING_APP
Environment: ✓ Production, ✓ Preview, ✓ Development
```

### 4. NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```
Key: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
Value: [DIN-NYE-GOOGLE-MAPS-API-KEY]
Environment: ✓ Production, ✓ Preview, ✓ Development
```
**VIKTIG**: Bruk den nye API keyen du genererte, IKKE den gamle!

## Eksempel for nytt prosjekt

Hvis din nye Netlify URL er `reconnoitering.netlify.app`:

```
MONGODB_URI=mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER].mongodb.net/?retryWrites=true&w=majority
NEXTAUTH_URL=https://reconnoitering.netlify.app
NEXTAUTH_SECRET=THIS_IS_A_VERY_SECURE_SECRET_FOR_RECONNOITERING_APP
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=[din-nye-api-key-her]
```

## Viktige Noter

1. **NEXTAUTH_URL** må matche eksakt med Netlify deployment URL
2. **NEXT_PUBLIC_** prefix er påkrevd for client-side variabler
3. MongoDB URI er allerede konfigurert med IP whitelist (0.0.0.0/0)
4. Etter å legge til variables, må du redeploy
5. For mer detaljert dokumentasjon, se `ENVIRONMENT-VARIABLES-PRODUCTION.md`

## Sjekkliste

- [ ] Alle 4 variables lagt til
- [ ] NEXTAUTH_URL matcher deployment URL
- [ ] Google Maps API key er ny (ikke den lekkede)
- [ ] Alle har riktige environment checkboxes
- [ ] Redeployed etter å ha lagt til variables