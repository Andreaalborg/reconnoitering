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

### ESLint Status: ✅ VESENTLIG FORBEDRET!
- **0 Errors** 🎉 (alle kritiske feil er fikset!)  
- **13 Warnings** (advarsler som bør fikses)

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

**Sist oppdatert:** ${new Date().toLocaleDateString('no-NO')} 