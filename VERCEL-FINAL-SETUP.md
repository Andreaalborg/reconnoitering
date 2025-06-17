# Vercel Final Setup - reconnoitering-wvya

## Status
- **reconnoitering**: Første prosjekt, ingen env variables
- **reconnoitering-wvya**: Har NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, sannsynligvis riktig prosjekt

## Steg 1: Verifiser riktig prosjekt

### Sjekk reconnoitering-wvya:
1. Gå inn i prosjektet `reconnoitering-wvya`
2. Se på "Domains" - hva er production URL?
3. Besøk denne URL-en - fungerer den (selv med hvit skjerm)?
4. Se på Deployments - er dette aktivt brukt?

### Hvis reconnoitering-wvya er riktig:
Production URL er sannsynligvis: `https://reconnoitering-wvya.vercel.app`

## Steg 2: Legg til manglende Environment Variables

I `reconnoitering-wvya`, gå til Settings → Environment Variables og legg til:

### 1. MONGODB_URI
```
Key: MONGODB_URI
Value: mongodb+srv://intsenai:20fNK8j2r8MQhHD3@cluster0.34dwe.mongodb.net/?retryWrites=true&w=majority
Environment: ✓ Production, ✓ Preview, ✓ Development
```

### 2. NEXTAUTH_URL
```
Key: NEXTAUTH_URL
Value: https://reconnoitering-wvya.vercel.app
Environment: ✓ Production
```
**VIKTIG**: Bruk den faktiske production URL du ser under Domains!

### 3. NEXTAUTH_SECRET
```
Key: NEXTAUTH_SECRET
Value: THIS_IS_A_VERY_SECURE_SECRET_FOR_RECONNOITERING_APP
Environment: ✓ Production, ✓ Preview, ✓ Development
```

### 4. Sjekk GOOGLE_MAPS (allerede eksisterer)
Sørg for at den eksisterende variabelen er:
```
Key: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
Value: [YOUR_EXISTING_API_KEY_FROM_VERCEL]
```

## Steg 3: Slett det andre prosjektet

Hvis reconnoitering-wvya fungerer:
1. Gå tilbake til team oversikt
2. Gå inn i `reconnoitering` (uten -wvya)
3. Settings → scroll ned → Delete Project
4. Bekreft sletting

## Steg 4: Redeploy

1. Gå til Deployments i `reconnoitering-wvya`
2. Klikk ... ved siden av siste deployment
3. Velg "Redeploy"
4. **FJERN** haken på "Use existing Build Cache"
5. Klikk "Redeploy"

## Steg 5: Test

Etter deployment er ferdig:
1. Besøk production URL
2. Åpne browser console (F12)
3. Se om det er andre feil enn de extension-relaterte

## Hvis det fortsatt er hvit skjerm

Test disse URL-ene:
- `https://reconnoitering-wvya.vercel.app/health`
- `https://reconnoitering-wvya.vercel.app/api/exhibitions`

Hvis API-en svarer med data, er backend OK og problemet er i frontend.

## Oppsummering av Environment Variables

Etter setup skal du ha disse 4:
1. MONGODB_URI ✓
2. NEXTAUTH_URL ✓ (med riktig production URL)
3. NEXTAUTH_SECRET ✓
4. NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ✓ (eksisterer allerede)

## Quick Debug

Hvis usikker på hvilken URL som er riktig:
1. I Vercel prosjekt, gå til Settings → Domains
2. Den som IKKE har branch-navn og er merket "Production" er riktig
3. Denne URL-en skal brukes i NEXTAUTH_URL