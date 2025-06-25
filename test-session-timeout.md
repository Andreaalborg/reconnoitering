# Session Timeout Testing Log
**Test dato**: 25. juni 2025

## Test Setup
- Session timeout: 30 minutter
- Warning vises: 5 minutter før timeout
- Countdown timer: Viser gjenværende tid i MM:SS format

## Test 1: Grunnleggende funksjonalitet
**Status**: VENTER PÅ TEST
- [ ] Logg inn i applikasjonen
- [ ] Verifiser at SessionTimeout komponenten er aktiv
- [ ] La være inaktiv i 25 minutter
- [ ] Sjekk at warning dialog vises
- [ ] Verifiser countdown timer

## Test 2: Brukerinteraksjon
**Status**: VENTER PÅ TEST
- [ ] Klikk "Continue Session" - skal resette timer
- [ ] Klikk "Logout" - skal logge ut og redirecte til login med ?reason=timeout
- [ ] Test at musebevegelser resetter timer
- [ ] Test at tastetrykk resetter timer
- [ ] Test at scrolling resetter timer

## Test 3: Rask testing med kortere timeouts
For å teste raskere, endre komponent props midlertidig:
```tsx
<SessionTimeout timeoutInMinutes={2} warningInMinutes={1} />
```

**Status**: UTFØRT - 25.06.2025 kl 12:38
- [ ] Endre timeout til 2 minutter i layout.tsx
- [ ] Test full syklus på 2 minutter
- [ ] Verifiser auto-logout etter timeout
- [ ] Tilbakestill til normale verdier

## Test 4: Edge cases
**Status**: VENTER PÅ TEST
- [ ] Åpne flere faner - alle skal logge ut samtidig
- [ ] Aktivitet i én fane skal resette timer i alle faner
- [ ] Browser refresh skal opprettholde timer state
- [ ] Manuell logout skal ikke vise warning

## Observerte problemer
(Oppdateres under testing)

## Konklusjon
(Fylles ut etter testing)