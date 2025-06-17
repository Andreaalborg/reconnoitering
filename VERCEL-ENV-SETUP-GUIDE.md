# Steg-for-steg Guide: Sette Miljøvariabler i Vercel

## 1. Logg inn på Vercel
Gå til: https://vercel.com/login

## 2. Finn ditt prosjekt
- Når du er logget inn, vil du se en liste over dine prosjekter
- Klikk på prosjektet "reconnoitering" (eller hva det heter hos deg)

## 3. Gå til Settings
- Når du er inne i prosjektet, se på topp-menyen
- Du vil se: Overview | Analytics | Speed Insights | Logs | **Settings**
- Klikk på **"Settings"**

## 4. Finn Environment Variables
- I venstre sidemeny under Settings, scroll ned til du finner:
  - General
  - Domains
  - Integrations
  - Git
  - Functions
  - **Environment Variables** ← Klikk her!

## 5. Legg til/Oppdater Miljøvariabler

Du vil se en side med:
- Et felt for "Key" (navn på variabelen)
- Et felt for "Value" (verdien)
- Checkboxer for Production, Preview, Development

### Legg til disse variablene:

**Variabel 1:**
- Key: `MONGODB_URI`
- Value: `mongodb+srv://intsenai:20fNK8j2r8MQhHD3@cluster0.34dwe.mongodb.net/?retryWrites=true&w=majority`
- Environment: ✅ Production, ✅ Preview, ✅ Development

**Variabel 2:**
- Key: `NEXTAUTH_URL`
- Value: `https://reconnoitering-g3fa-andrea-alborgs-projects.vercel.app`
- Environment: ✅ Production
- For Preview: La Vercel auto-generere
- For Development: `http://localhost:3000`

**Variabel 3:**
- Key: `NEXTAUTH_SECRET`
- Value: `THIS_IS_A_VERY_SECURE_SECRET_FOR_RECONNOITERING_APP`
- Environment: ✅ Production, ✅ Preview, ✅ Development

**Variabel 4:**
- Key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Value: `YOUR_GOOGLE_MAPS_API_KEY_HERE`
- Environment: ✅ Production, ✅ Preview, ✅ Development

## 6. Lagre hver variabel
- Etter å ha fylt ut Key og Value, klikk "Save" knappen

## 7. Redeploy prosjektet
- Gå tilbake til "Overview" (i topp-menyen)
- Du vil se en liste over deployments
- Klikk på de tre prikkene (...) ved siden av den nyeste deployment
- Velg "Redeploy"
- I popup-vinduet, sørg for at "Use existing Build Cache" er **AV** (unchecked)
- Klikk "Redeploy"

## Alternativ måte (hvis du ikke finner Environment Variables)

1. Fra prosjekt-oversikten, klikk på "Settings" (tannhjul-ikon)
2. Se etter en seksjon som heter "Environment Variables"
3. Hvis du ikke ser den, kan den være under "Project Settings"

## Hvordan finne din riktige Vercel URL

Din faktiske URL vises på flere steder:
1. I "Overview" siden, under prosjektnavnet
2. Under "Domains" i Settings
3. I URL-en når du besøker din app

Den skal se slik ut:
`https://[prosjektnavn]-[random-id]-[brukernavn].vercel.app`

I ditt tilfelle ser det ut til å være:
`https://reconnoitering-g3fa-andrea-alborgs-projects.vercel.app`

## Viktige tips

1. **NEXTAUTH_URL må være eksakt lik din Vercel URL** - ingen skrivefeil!
2. **NEXT_PUBLIC_** prefix er viktig for variabler som brukes i frontend
3. Etter å ha lagt til variabler, må du alltid redeploy
4. Hvis du endrer variabler, kan det ta 1-2 minutter før endringene trer i kraft

## Feilsøking

Hvis du fortsatt ikke finner Environment Variables:
1. Sjekk at du er logget inn med riktig konto
2. Sjekk at du har tilgang til prosjektet (er eier eller har blitt invitert)
3. Prøv å refreshe siden (Ctrl+F5)
4. Prøv en annen nettleser

## Screenshot-hjelpere

Hvis du tar screenshots av Vercel-grensesnittet og sender til meg, kan jeg hjelpe deg med å finne riktig sted!