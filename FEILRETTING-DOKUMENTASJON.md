# 🔧 Feilretting og Oppgraderingsdokumentasjon - Reconnoitering

## 📋 Oversikt
Denne filen dokumenterer alle identifiserte feil i prosjektet og fremgangsmåten for å løse dem systematisk.

**Dato opprettet:** ${new Date().toLocaleDateString('no-NO')}
**Prosjekt:** Reconnoitering (Next.js + TypeScript)

---

## 🚨 Kritiske Funnyer

### TypeScript Status: ✅ OK
- TypeScript-kompilatoren rapporterer ingen feil (`npx tsc --noEmit` = success)
- Alle type-relaterte problemer ser ut til å være løst

### ESLint Status: ✅ ALLE ERRORS FIKSET!
- **0 Errors** 🎉 (alle 11 unescaped entities fikset!)
- **17 Warnings** (useEffect dependencies - ikke kritisk)

### Runtime Status: ✅ NYLIG FORBEDRET!
- **Nye runtime-feil oppdaget og fikset** 🔧
- Applikasjonen kjører nå uten null reference errors

---

## 📊 Detaljert Feiloversikt

### ✅ ERRORS (ALLE LØST!)

#### 1. React Unescaped Entities - ✅ KOMPLETT LØST
**Antall filer berørt:** 3 (alle fikset)
**Type:** JSX/React kodestandarder

| Fil | Linje | Problem | Status |
|-----|-------|---------|--------|
| `src/app/about/page.tsx` | 33:90 | `didn't` → `didn&apos;t` | ✅ FIKSET |
| `src/app/about/page.tsx` | 68:95 | `We'd` → `We&apos;d` | ✅ FIKSET |
| `src/app/search/page.tsx` | 106:34 | `"` → `&quot;` | ✅ FIKSET |
| `src/app/search/page.tsx` | 106:48 | `"` → `&quot;` | ✅ FIKSET |
| `src/app/search/page.tsx` | 123:24 | `couldn't` → `couldn&apos;t` | ✅ FIKSET |
| `src/components/VerticalCalendar.tsx` | 140:66 | `Week's` → `Week&apos;s` | ✅ FIKSET |

#### 2. 'use client' Directive - ✅ KOMPLETT LØST
**Antall filer berørt:** 1 (fikset)
**Type:** Next.js build error

| Fil | Problem | Status |
|-----|---------|--------|
| `src/app/account/profile/page.tsx` | `'use client'` måtte være øverst | ✅ FIKSET |

#### 3. Runtime Null Reference Errors - ✅ NYLIG FIKSET!
**Antall filer berørt:** 3 (fikset)
**Type:** Null/undefined property access & React state errors

| Fil | Problem | Løsning | Status |
|-----|---------|----------|--------|
| `src/services/calendarExport.ts` | `exhibition.location.name` undefined | Lagt til null-sjekker | ✅ FIKSET |
| `src/services/calendarExport.ts` | Itinerary location undefined | Lagt til null-sjekker | ✅ FIKSET |
| `src/components/NearbyExhibitions.tsx` | `location.coordinates` undefined | Forbedret filter-logikk | ✅ FIKSET |
| `src/app/calendar/page.tsx` | `setState` kalt under render | Restrukturert `useEffect` | ✅ FIKSET |
| `src/app/calendar/page.tsx` | `exhibition.location.name` undefined | Lagt til null-sjekker | ✅ FIKSET |

### 🟡 WARNINGS (Bør fikses)

#### 1. React Hook useEffect Missing Dependencies
**Antall filer berørt:** 9
**Type:** React Hooks optimalisering

| Fil | Linje | Manglende Dependencies |
|-----|-------|----------------------|
| `src/app/calendar/page.tsx` | 168:6 | `selectedCity`, `selectedCountries` |
| `src/app/date-search/page.tsx` | 254:6 | `fetchExhibitionResults`, `fetchFilterOptions`, `formattedDefaultEnd`, `formattedToday` |
| `src/app/date-search/page.tsx` | 264:6 | `loadingExhibitions` |
| `src/app/day-planner/page.tsx` | 84:6 | `fetchExhibitions` |
| `src/app/day-planner/page.tsx` | 313:6 | `calculateRoutes`, `itinerary`, `routeCalculating`, `transportTime` |
| `src/app/exhibitions/page.tsx` | 97:6 | `initialCountryValues` |
| `src/app/exhibitions/page.tsx` | 103:6 | `fetchExhibitions` |
| `src/app/map/page.tsx` | 52:6 | `DEFAULT_CENTER` |
| `src/components/ExhibitionMap.tsx` | 76:6 | `getMapCenter`, `validExhibitions.length` |
| `src/components/ExhibitionMap.tsx` | 136:6 | `validExhibitions` |
| `src/components/Header.tsx` | 51:6 | `performSearch` |
| `src/components/NearbyExhibitions.tsx` | 108:6 | `calculateDistance` |

#### 2. Next.js Image Optimization
**Antall filer berørt:** 1
**Type:** Performance-optimalisering

| Fil | Linje | Problem | Løsning |
|-----|-------|---------|---------|
| `src/app/account/profile/page.tsx` | 225:23 | Bruker `<img>` i stedet for `<Image />` | Bytt til `next/image` |

---

## 🎯 Handlingsplan

### Fase 1: Kritiske Feil (ERRORS) 🔴
**Estimert tid:** 30-45 minutter
**Prioritet:** Høy

1. **Fix Unescaped Entities**
   - [ ] `src/app/about/page.tsx` (2 steder)
   - [ ] `src/app/search/page.tsx` (3 steder)
   - [ ] `src/components/VerticalCalendar.tsx` (1 sted)
   
   **Strategi:**
   - Bytt ut `'` med `&apos;` eller bruk backticks for template literals
   - Bytt ut `"` med `&quot;` eller bruk enkle anførselstegn

### Fase 2: React Hook Dependencies 🟡
**Estimert tid:** 2-3 timer
**Prioritet:** Middels

1. **Analyser hver useEffect**
   - Identifiser om dependencies faktisk trengs
   - Vurder useCallback/useMemo for funksjoner
   - Legg til dependencies eller bruk ESLint disable hvis det er intensjonelt

2. **Kategorisering:**
   - **Trygg å legge til:** Primitive verdier, stabile objekter
   - **Trenger useCallback:** Funksjoner som defineres i komponenten
   - **Kan ignoreres:** Stabile imports, konstanter

### Fase 3: Performance-optimalisering 🟢
**Estimert tid:** 15-30 minutter
**Prioritet:** Lav

1. **Bytt til Next.js Image**
   - [ ] `src/app/account/profile/page.tsx` - Bytt `<img>` til `<Image />`

---

## �� Fremgangsmåte

### Steg 1: Sikkerhetskopi
```bash
git add .
git commit -m "Pre-linting cleanup commit"
```

### Steg 2: Fix kritiske feil
Start med unescaped entities da disse er enkle å fikse og forhindrer bygning.

### Steg 3: Test etter hver fix
```bash
npm run lint
npm run build
```

### Steg 4: Dokumenter fremgang
Oppdater denne filen med status for hver fikset fil.

---

## ✅ Fremgangsstatus

### Kritiske Feil (ERRORS) - 🎉 ALLE LØST!
- [x] `src/app/about/page.tsx` - Unescaped entities ✅ KOMPLETT
- [x] `src/app/search/page.tsx` - Unescaped entities ✅ KOMPLETT
- [x] `src/components/VerticalCalendar.tsx` - Unescaped entities ✅ KOMPLETT

### Advarsler (WARNINGS) - Neste fase
#### useEffect Dependencies
- [ ] `src/app/calendar/page.tsx`
- [ ] `src/app/date-search/page.tsx` (2 steder)
- [ ] `src/app/day-planner/page.tsx` (2 steder)
- [ ] `src/app/exhibitions/page.tsx` (2 steder)
- [ ] `src/app/map/page.tsx`
- [ ] `src/components/ExhibitionMap.tsx` (2 steder)
- [ ] `src/components/Header.tsx`
- [ ] `src/components/NearbyExhibitions.tsx`

#### Image Optimization
- [ ] `src/app/account/profile/page.tsx`

### Fase 1.5: ✅ KOMPLETT - Runtime Feil
**Status:** ✅ ALLE FIKSET!
**Tid brukt:** ~30 minutter
**Resultat:** Applikasjonen kjører uten null reference crashes & render loops

### Fase 2: 🔄 TILGJENGELIG - React Hook Dependencies 
**Status:** Klar til å starte (valgfritt)
**Estimert tid:** 2-3 timer
**Prioritet:** Lav (kun advarsler)

**Resultat så langt:** Fra 4 kritiske feil + runtime crashes til 0 feil + stabil app! 🎉

---

## 💡 Tips og Notater

### For Unescaped Entities:
- Bruk `&apos;` for apostrof (')
- Bruk `&quot;` for anførselstegn (")
- Alternativt: Bruk template literals med backticks når det passer

### For useEffect Dependencies:
- **Ikke automatisk legg til alle dependencies** - vurder om de faktisk trengs
- Bruk `useCallback` for funksjoner som er dependencies
- Bruk `useMemo` for beregnede verdier
- Vurder å bruke ESLint disable kommentar hvis intensjonelt

### For Testing:
- Test hver side i nettleseren etter endringer
- Sjekk konsollen for nye feil
- Kjør `npm run build` for å sikre produksjonsklar kode

---

## 🔗 Ressurser

- [React ESLint Rules](https://github.com/jsx-eslint/eslint-plugin-react)
- [React Hooks ESLint Rules](https://reactjs.org/docs/hooks-rules.html)
- [Next.js Image Optimization](https://nextjs.org/docs/api-reference/next/image)

---

## 🔄 Node.js Oppgradering (2025-06-24)

### Problem
- Next.js lint krever Node.js >= 18.17.0
- Vi hadde Node.js 18.12.0
- Noen dependencies krever >= 18.18.0

### Løsning
1. **Oppgradert til Node.js 18.18.0** (ikke 22 for kompatibilitet)
2. **Installert via nvm i WSL**:
   ```bash
   nvm install 18.18.0
   nvm use 18.18.0
   nvm alias default 18.18.0
   ```
3. **Oppdatert .nvmrc** fil til 18.18.0
4. **Reinstallert dependencies** med `npm install --legacy-peer-deps`

### Resultat
- ✅ Lint fungerer nå
- ⚠️ 11 nye unescaped entities errors oppdaget
- ⚠️ 17 useEffect warnings fortsatt tilstede

### Viktig for fremtiden
- Bruk WSL/Ubuntu terminal, IKKE Windows PowerShell
- Kjør `source ~/.nvm/nvm.sh && nvm use 18.18.0` hvis Node resetter seg

---

## 🔧 Unescaped Entities Fix (2025-06-24)

### Filer fikset (11 errors totalt):
1. `src/app/admin/dashboard/page.tsx` - "Here's" → "Here&apos;s"
2. `src/app/contact/page.tsx` - 3 steder: "We've", "We'd", "We'll"
3. `src/app/exhibition/[id]/page.tsx` - "you're" → "you&apos;re"
4. `src/app/faq/page.tsx` - "Can't" og "you're"
5. `src/app/no-auth/page.tsx` - "don't" → "don&apos;t"
6. `src/app/page.tsx` - 3 steder: "world's", "What's", "Beginner's"

### Resultat:
- ✅ 0 Errors i ESLint
- Koden fungerer identisk som før
- Bare HTML-encoding endret, ingen funksjonalitet påvirket

---

## 🎨 Venue Closed Days Feature (2025-06-24)

### Implementert:
1. **Exhibition Cards** (`src/components/ExhibitionCard.tsx`):
   - Lagt til visning av venue closed days på exhibition cards
   - Formatering: "Closed on Mondays", "Closed on Mondays and Tuesdays" etc.
   - Vises i en liten tekst under datoene

2. **Exhibition Detail Page** (`src/app/exhibition/[id]/page.tsx`):
   - Oppdatert til å bruke venue defaultClosedDays
   - Vises i venue info seksjonen (amber farge)
   - Vises i "Plan your visit" seksjonen
   - Sjekker om venue er stengt i dag

3. **API Oppdatering** (`src/app/api/exhibitions/[id]/route.ts`):
   - Inkluderer nå defaultClosedDays når venue populeres

### Resultat:
- ✅ Closed days vises nå på alle exhibition cards
- ✅ Closed days vises tydeligere på exhibition detail sider
- ✅ Konsistent formatering på tvers av appen

---

## 🛡️ Rate Limiting Implementation (2025-06-24)

### Implementert beskyttelse på:
1. **User Registration** (`/api/user/register`)
   - 5 forsøk per 15 minutter per IP
   - Beskytter mot spam-registreringer

2. **Login** (`/api/auth/[...nextauth]`)
   - 5 forsøk per 15 minutter per IP
   - Beskytter mot brute force angrep

3. **Password Change** (`/api/user/password`)
   - 5 forsøk per 15 minutter per bruker+IP
   - Lagt til rate limiting (var ikke beskyttet før)

### Tekniske detaljer:
- In-memory storage (fungerer for single-instance)
- Automatisk opprydding hvert minutt
- Sentry logging for overvåking
- HTTP 429 respons med Retry-After header

### Dokumentasjon:
- Fullstendig dokumentasjon i `RATE-LIMITING-DOCUMENTATION.md`
- Inkluderer testing-instruksjoner og fremtidige forbedringer

---

## 📋 Environment Variables Audit (2025-06-24)

### Dokumentasjon opprettet:
1. **ENVIRONMENT-VARIABLES-PRODUCTION.md**
   - Komplett guide for produksjonsmiljøvariabler
   - Sikkerhetsnivå for hver variabel
   - Feilsøkingsguide
   - Best practices

2. **DEPLOYMENT-CHECKLIST.md**
   - Pre-deployment sjekkliste
   - Step-by-step deployment guide
   - Post-deployment verifisering
   - Rollback plan

3. **Oppdatert .env.example**
   - Kategorisert variabler (Required/Optional/Dev)
   - Lagt til hjelpsom kommentarer
   - Inkludert generering-instruksjoner

4. **Oppdatert ENVIRONMENT-VARIABLES-LIST.md**
   - Endret fra Vercel til Netlify
   - Oppdatert URLs og eksempler

### Identifiserte variabler:
- **Kritiske (4):** MONGODB_URI, NEXTAUTH_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- **Valgfrie (6):** SENDGRID_API_KEY, NEXT_PUBLIC_SENTRY_DSN, Sentry build vars, etc.
- **Ubrukte (4):** DATABASE_URL, NEXT_PUBLIC_MAPBOX_TOKEN, EMAIL_SERVER_*, NEXT_PUBLIC_BASE_URL

### Sikkerhetsstatus:
- ✅ Ingen hardkodede secrets funnet i koden
- ✅ Alle sensitive variabler dokumentert som SECRET
- ⚠️ MongoDB passord eksponert i dokumentasjon (bør roteres)
- ⚠️ NEXTAUTH_SECRET i docs er placeholder (bra!)

---

## 🛡️ Security Headers Implementation (2025-06-24)

### Implementert i next.config.mjs:
1. **Basis Security Headers**
   - X-Frame-Options: SAMEORIGIN (clickjacking beskyttelse)
   - X-Content-Type-Options: nosniff (MIME sniffing beskyttelse)
   - X-XSS-Protection: 1; mode=block (XSS beskyttelse)
   - Referrer-Policy: strict-origin-when-cross-origin

2. **Advanced Security Headers**
   - Strict-Transport-Security (HSTS): 2 års HTTPS enforcement
   - Permissions-Policy: Blokkerer kamera/mikrofon, tillater geolocation
   - Content-Security-Policy (CSP): Omfattende ressurskontroll

3. **CSP Konfigurering**
   - Tillater Google Maps og Sentry
   - Blokkerer farlige ressurser
   - unsafe-inline for Next.js/Tailwind kompatibilitet

### Dokumentasjon:
- Fullstendig guide i `SECURITY-HEADERS-DOCUMENTATION.md`
- Testing instruksjoner inkludert
- Fremtidige forbedringer planlagt

### Resultat:
- ✅ Beskyttelse mot XSS, clickjacking, MIME sniffing
- ✅ HTTPS enforcement med HSTS
- ✅ Ressurskontroll med CSP
- ⚠️ Trenger fintuning for produksjon (CORS, CSP strictness)

---

## 🚨 KRITISK SIKKERHETSINCIDENT (2025-06-24)

### GitHub Secret Detection Alert:
- MongoDB passord eksponert i ENVIRONMENT-VARIABLES-LIST.md
- Google Maps API key eksempel så ekte ut

### Umiddelbare tiltak:
1. ✅ Fjernet alle ekte credentials fra dokumentasjon
2. ✅ Erstattet med placeholders ([USERNAME], [PASSWORD], etc.)
3. ✅ Opprettet SECURITY-INCIDENT-2025-06-24.md

### KREVER HANDLING:
1. 🔴 **ROTER MongoDB PASSORD UMIDDELBART**
2. 🟡 Sjekk om Google API key var ekte
3. ⚠️ Vurder å rense git history

### Forebygging:
- ALDRI bruk ekte credentials i dokumentasjon
- Bruk åpenbart falske eksempler
- Installer git-secrets for scanning

---

**Sist oppdatert:** 2025-06-24 