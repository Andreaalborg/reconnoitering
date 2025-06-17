# Vercel Troubleshooting Guide

## 1. Hvordan finne din riktige Vercel URL

### Metode 1: Fra Vercel Dashboard
1. Logg inn på vercel.com
2. Klikk på prosjektet ditt
3. På "Overview" siden vil du se:
   - **"Domains"** seksjon - her står din hoveddomene
   - **"Visit"** knapp - hover over denne for å se URL
   - Under "Production Deployment" - URL vises der

### Metode 2: Fra Deployment Liste
1. I prosjekt-oversikten, se på "Deployments" listen
2. Find den som er merket "Production" (har en grønn dot)
3. URL-en vises ved siden av deployment

### Metode 3: Fra Domains Settings
1. Gå til Settings → Domains
2. Her ser du alle domener knyttet til prosjektet
3. Den som er merket som "Production" er hoveddomenet

## 2. Problem: Ingen Environment Variables

Dette kan skje hvis:

### A) Du har flere Vercel-kontoer
- Sjekk at du er logget inn med riktig konto
- Se øverst til høyre for brukernavn/team navn

### B) Du har flere teams/organisasjoner
- Sjekk at prosjektet er under riktig team
- Se etter team-selector øverst i Vercel

### C) Variablene ble slettet
- Dette kan skje ved re-import av prosjekt
- Eller hvis noen andre med tilgang har endret dem

### Løsning:
```bash
# Fra kommandolinjen, sjekk hvilken Vercel-konto som er aktiv:
vercel whoami

# List alle prosjekter:
vercel list

# Sjekk environment variables via CLI:
vercel env ls
```

## 3. Problem: Flere Builds Samtidig

Dette er typisk forårsaket av:

### A) Flere Git Branches
- Hver branch trigger sin egen preview deployment
- Sjekk Settings → Git → "Ignored Build Step"

### B) Webhooks eller Integrasjoner
- GitHub integration kan trigger flere builds
- Sjekk Settings → Git → Deploy Hooks

### C) Monorepo eller Flere Prosjekter
- Hvis du har flere Vercel-prosjekter koblet til samme repo
- Hver trigger sin build

### Løsning for Multiple Builds:

1. **Gå til Settings → Git**
2. **Under "Deploy Hooks"** - slett unødvendige hooks
3. **Under "Ignored Build Step"** - legg til:
   ```bash
   git diff HEAD^ HEAD --quiet .
   ```
   Dette skipper builds hvis ingen filer er endret

4. **Sjekk for duplikate prosjekter:**
   - Gå til Vercel dashboard hovedside
   - Se om du har flere prosjekter med samme GitHub repo
   - Slett duplikater

## 4. Hurtigfix for Environment Variables

### Via Vercel CLI (hvis du har den installert):
```bash
# Installer Vercel CLI først (hvis ikke installert)
npm i -g vercel

# Logg inn
vercel login

# Link til prosjekt
vercel link

# Sett environment variables
vercel env add MONGODB_URI
vercel env add NEXTAUTH_URL 
vercel env add NEXTAUTH_SECRET
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Deploy
vercel --prod
```

### Manuelt via Dashboard:
Hvis du virkelig ikke finner Environment Variables:

1. **Prøv direkte URL:**
   ```
   https://vercel.com/[ditt-brukernavn]/[prosjekt-navn]/settings/environment-variables
   ```

2. **Sjekk Project Settings:**
   - Noen ganger er det under en "Configure Project" knapp
   - Eller under "Project Settings" → "Environment Variables"

## 5. Finne alle dine Vercel-prosjekter

For å se om du har duplikater:

1. Gå til: https://vercel.com/dashboard
2. Se etter alle prosjekter som heter "reconnoitering" eller lignende
3. Sjekk hvilket som er koblet til din GitHub repo

## 6. Debug Informasjon å Samle

Ta screenshots eller noter:
1. **Exact URL** når du besøker appen (fra adressefeltet)
2. **Prosjektnavn** i Vercel (øverst på prosjektsiden)
3. **Team/Account navn** (øverst høyre i Vercel)
4. **GitHub repo** som er koblet (under Settings → Git)

## 7. Nuclear Option - Start på Nytt

Hvis ingenting fungerer:

1. **Eksporter environment variables** (hvis du finner dem)
2. **Slett prosjektet** fra Vercel
3. **Re-importer** fra GitHub:
   ```
   vercel import git https://github.com/[din-bruker]/reconnoitering
   ```
4. **Sett environment variables på nytt**
5. **Deploy**

## Tips for å finne riktig URL:
- Den production URL-en vil IKKE ha branch-navn i seg
- Den skal se ut som: `https://[prosjektnavn].vercel.app`
- Eller: `https://[prosjektnavn]-[teamname].vercel.app`
- IKKE: `https://[prosjektnavn]-[branch]-[teamname].vercel.app` (dette er preview)

Send meg gjerne:
1. Screenshot av Vercel dashboard
2. URL-en du ser når du besøker appen
3. Hva som står under "Domains" i Settings

Da kan jeg hjelpe deg mer spesifikt!