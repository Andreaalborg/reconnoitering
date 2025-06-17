# Vercel Cleanup Guide - Fikse Multiple Deployments

## Problem
Du har 8 prosjekter som alle bygger når du pusher til GitHub. Dette skal IKKE skje - du skal kun ha 1 prosjekt.

## Løsning - Steg for Steg

### 1. Identifiser det riktige prosjektet

Gå til: https://vercel.com/andreaalborgs-projects

Se på alle 8 prosjektene og finn ut:
- Hvilket som har flest deployments
- Hvilket som har den nyeste successful deployment
- Hvilket som har domenet du faktisk bruker

### 2. Finn Production URL

For hvert prosjekt:
1. Klikk inn på prosjektet
2. Se på "Domains" seksjonen
3. Noter ned hvilken URL som er "Production"
4. Det riktige prosjektet vil ha en URL som fungerer

### 3. Sjekk Environment Variables

For hvert prosjekt:
1. Gå til Settings → Environment Variables
2. Se hvilket prosjekt som HAR environment variables satt opp
3. Hvis du finner et prosjekt med variables - dette er sannsynligvis det riktige

### 4. Slett de overflødige prosjektene

**VIKTIG: Før du sletter, dobbeltsjekk at du har valgt riktig prosjekt å beholde!**

For hvert prosjekt du vil slette:
1. Gå til Settings (i prosjektet)
2. Scroll helt ned til "Delete Project"
3. Klikk "Delete"
4. Bekreft slettingen

### 5. Konfigurer det gjenværende prosjektet

På prosjektet du beholder:

#### A. Sjekk Git Integration
1. Gå til Settings → Git
2. Sjekk at det er koblet til riktig GitHub repo
3. Sjekk at Production Branch er "main"

#### B. Legg til Environment Variables
1. Gå til Settings → Environment Variables
2. Legg til disse:

```
MONGODB_URI=mongodb+srv://intsenai:20fNK8j2r8MQhHD3@cluster0.34dwe.mongodb.net/?retryWrites=true&w=majority
NEXTAUTH_SECRET=THIS_IS_A_VERY_SECURE_SECRET_FOR_RECONNOITERING_APP
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

**For NEXTAUTH_URL:**
- Se hva som står under "Domains" i Settings
- Bruk den URL-en som er merket som "Production"
- Format: `NEXTAUTH_URL=https://[din-production-url]`

### 6. Redeploy

1. Gå til Deployments
2. Klikk på tre prikker (...) ved siste deployment
3. Velg "Redeploy"
4. VIKTIG: Fjern haken på "Use existing Build Cache"
5. Klikk "Redeploy"

## Hvordan unngå dette i fremtiden

### Når du importerer et prosjekt:
1. Sjekk ALLTID om prosjektet allerede eksisterer
2. Ikke importer samme repo flere ganger
3. Hvis du må re-importe, slett det gamle først

### Best Practice:
- Ha kun ETT Vercel-prosjekt per GitHub repository
- Bruk branches for preview deployments, ikke separate prosjekter

## Hvis du er usikker på hvilket prosjekt du skal beholde

Ta screenshots av:
1. Deployment listen for hvert prosjekt
2. Domains seksjonen for hvert prosjekt
3. Environment Variables (hvis de finnes)

Send disse til meg så kan jeg hjelpe deg identifisere det riktige.

## Quick Checklist

- [ ] Identifisert hvilket av de 8 prosjektene som er det riktige
- [ ] Notert Production URL fra det riktige prosjektet
- [ ] Sjekket om environment variables eksisterer
- [ ] Slettet de 7 overflødige prosjektene
- [ ] Lagt til alle environment variables i det gjenværende prosjektet
- [ ] Satt NEXTAUTH_URL til riktig production URL
- [ ] Redeployed med cleared cache

## Eksempel på riktig NEXTAUTH_URL

Hvis din production domain er: `reconnoitering.vercel.app`
Da skal NEXTAUTH_URL være: `https://reconnoitering.vercel.app`

Hvis din production domain er: `reconnoitering-andreaalborgs-projects.vercel.app`
Da skal NEXTAUTH_URL være: `https://reconnoitering-andreaalborgs-projects.vercel.app`

**IKKE bruk preview URLs som inneholder branch-navn!**