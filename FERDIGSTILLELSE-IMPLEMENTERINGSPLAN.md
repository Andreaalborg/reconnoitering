# 🚀 Reconnoitering - Ferdigstillelse & Implementeringsplan

*Detaljert roadmap for å fullføre alle gjenstående funksjoner og gjøre appen produksjonsklar*

---

## 📊 Nåværende Prosjektstatus

### ✅ **Implementert & Fungerer**
- **Autentisering**: Registrering/login med bcrypt, email-verifisering, session management
- **Kart-funksjonalitet**: Interactive map med venue markers, radius filtering, location search
- **Core Features**: Exhibition browsing, favorites, calendar, day planner, venue pages
- **Sikkerhet**: Rate limiting, input validation, secure headers, session timeout
- **Database**: MongoDB med komplette modeller for users, venues, exhibitions
- **UI/UX**: Responsive design, loading states, SEO-optimalisering

### ❌ **Mangler & Må Implementeres**
- Password reset funksjonalitet
- Contact forms & newsletter backend
- GoHighLevel email integrasjon
- OAuth social login (Google/Facebook)
- Produksjons-sikkerhet (fjern dev endpoints)
- Performance optimaliseringer

---

## 🎯 Implementeringsplan - 6 Faser

## **FASE 1: Password Reset Funksjonalitet** ⏱️ *2-3 dager*

### 📋 Oppgaver:

#### 1.1 Frontend Pages
```
✅ User model har allerede resetPasswordToken + resetPasswordTokenExpires fields
```

**Opprett filer:**
- `src/app/auth/forgot-password/page.tsx` - "Glemt passord" side
- `src/app/auth/reset-password/page.tsx` - "Tilbakestill passord" side  
- `src/components/auth/ForgotPasswordForm.tsx` - Form komponent
- `src/components/auth/ResetPasswordForm.tsx` - Reset form komponent

#### 1.2 API Endpoints
**Opprett filer:**
- `src/app/api/auth/forgot-password/route.ts`
  ```typescript
  // Generate secure reset token
  // Save to user record with expiration (24h)
  // Send email with reset link (console.log for now)
  ```
  
- `src/app/api/auth/reset-password/route.ts`
  ```typescript
  // Verify token validity and expiration
  // Hash new password with bcrypt
  // Update user password, clear reset token
  // Return success response
  ```

#### 1.3 UI Updates
**Oppdater filer:**
- `src/app/auth/login/page.tsx`
  ```tsx
  // Add "Forgot password?" link under login form
  <Link href="/auth/forgot-password" className="text-sm text-blue-600">
    Forgot your password?
  </Link>
  ```

#### 1.4 Email Templates
**Opprett fil:**
- `src/services/emailTemplates.ts`
  ```typescript
  // HTML email templates for password reset
  // Include secure token in reset URL
  // Professional styling matching brand
  ```

### 🔧 Tekniske Detaljer:
- **Token Generation**: crypto.randomBytes(32).toString('hex')
- **Expiration**: 24 timer fra generering
- **Security**: Rate limit reset attempts (5 per hour per email)
- **Validation**: Strong password requirements maintained

---

## **FASE 2: Contact Forms & Newsletter Backend** ⏱️ *2-3 dager*

### 📋 Oppgaver:

#### 2.1 Database Models
**Opprett filer:**
- `src/models/Contact.ts`
  ```typescript
  // ContactSubmission schema
  // Fields: name, email, subject, message, timestamp, status
  // Indexes for efficient querying
  ```
  
- `src/models/Newsletter.ts`
  ```typescript
  // NewsletterSubscriber schema  
  // Fields: email, subscriptionDate, status, unsubscribeToken
  // Unique email constraint
  ```

#### 2.2 API Endpoints
**Opprett filer:**
- `src/app/api/contact/route.ts`
  ```typescript
  // Handle contact form submissions
  // Validation: email format, message length, spam protection
  // Save to database + send notification email
  // Rate limiting: 3 submissions per hour per IP
  ```

- `src/app/api/newsletter/subscribe/route.ts`
  ```typescript
  // Newsletter subscription with double opt-in
  // Send confirmation email (console.log for now)
  // Generate unsubscribe token
  ```

- `src/app/api/newsletter/unsubscribe/route.ts`
  ```typescript
  // Handle unsubscribe via token
  // Update status to 'unsubscribed'
  // Show confirmation page
  ```

#### 2.3 Frontend Integration
**Oppdater eksisterende filer:**
- Contact page form (allerede eksisterer - trenger backend kobling)
- Footer newsletter form (allerede eksisterer - trenger backend kobling)

**Opprett:**
- `src/components/ContactSuccess.tsx` - Success message component
- `src/components/NewsletterSuccess.tsx` - Subscription confirmation

#### 2.4 Spam Protection
- **Honeypot fields**: Skjulte felt for å fange bots
- **Rate limiting**: IP-basert begrensning
- **Email validation**: Regex + DNS lookup
- **Content filtering**: Blokkering av spam-ord

---

## **FASE 3: GoHighLevel Integrasjon** ⏱️ *1-2 dager*

### 📋 Oppgaver:

#### 3.1 GHL Service Layer
**Opprett fil:**
- `src/services/goHighLevel.ts`
  ```typescript
  // GHL API client
  // Create contact/lead functions
  // Add to campaigns/workflows
  // Error handling & retry logic
  ```

#### 3.2 Email Service Integration  
**Oppdater fil:**
- `src/services/email.ts`
  ```typescript
  // Replace console.log with actual email sending
  // Use GHL for transactional emails
  // Template management
  // Delivery tracking
  ```

#### 3.3 Webhook Handlers
**Opprett fil:**
- `src/app/api/webhooks/ghl/route.ts`
  ```typescript
  // Handle GHL webhooks
  // Update local records based on GHL events
  // Verify webhook signatures
  ```

#### 3.4 Environment Setup
```env
# GoHighLevel Configuration
GHL_API_KEY=your_api_key_here
GHL_LOCATION_ID=your_location_id  
GHL_FROM_EMAIL=noreply@reconnoitering.art
GHL_FROM_NAME=Reconnoitering Team

# Webhook Security
GHL_WEBHOOK_SECRET=your_webhook_secret
```

### 🔧 GHL API Integration Points:
1. **Contact Creation**: Fra contact form submissions
2. **Newsletter Signup**: Legg til i email campaigns  
3. **User Registration**: Sync new users to GHL
4. **Email Sending**: Password reset, verification, notifications

---

## **FASE 4: OAuth Social Login** ⏱️ *2-3 dager*

### 📋 Oppgaver:

#### 4.1 Dependencies & Configuration
```bash
npm install @next-auth/prisma-adapter
```

**Oppdater fil:**
- `src/app/api/auth/options.ts`
  ```typescript
  // Add GoogleProvider
  // Add FacebookProvider  
  // Configure account linking strategy
  // Handle profile picture from social
  ```

#### 4.2 Database Schema Updates
**Oppdater fil:**
- `src/models/User.ts`
  ```typescript
  // Add OAuth fields:
  // - accounts: [{ provider, providerAccountId, accessToken }]
  // - emailVerified: Date (auto-verify for OAuth)
  // - image: String (from social profile)
  ```

#### 4.3 UI Components
**Opprett filer:**
- `src/components/auth/SocialLoginButtons.tsx`
  ```tsx
  // Google & Facebook login buttons
  // Consistent styling with existing design
  // Loading states and error handling
  ```

**Oppdater filer:**
- `src/app/auth/login/page.tsx` - Legg til social buttons
- `src/app/auth/register/page.tsx` - Legg til social buttons

#### 4.4 OAuth App Setup
**Google OAuth:**
1. Google Cloud Console
2. Create OAuth 2.0 Client
3. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`

**Facebook OAuth:**  
1. Facebook Developers
2. Create App → Add Facebook Login
3. Valid OAuth Redirect URI: `https://your-domain.com/api/auth/callback/facebook`

#### 4.5 Environment Variables
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth  
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
```

### 🔧 Account Linking Strategy:
- **Same Email**: Automatically link accounts
- **Different Email**: Prompt user to link or create new account  
- **Profile Merge**: Keep existing favorites/preferences

---

## **FASE 5: Sikkerhet & Performance** ⏱️ *2-3 dager*

### 📋 Oppgaver:

#### 5.1 Security Hardening
**Fjern Dev Endpoints:**
```bash
# Slett disse filene:
src/app/api/dev/
src/app/quick-verify/  
src/app/dev/
```

**Opprett fil:**
- `src/middleware.ts`
  ```typescript
  // CSRF protection
  // Security headers (CSP, HSTS, etc.)
  // Request logging
  // Geo-blocking (if needed)
  ```

#### 5.2 Performance Optimization
**Database Indexes:**
```typescript
// Add indexes to MongoDB:
// User.email (unique)
// Exhibition.startDate, Exhibition.endDate  
// Venue.coordinates (2dsphere for geo queries)
// Analytics.timestamp
```

**Image Optimization:**
```typescript
// Update all images to use Next.js Image component
// Add image compression and lazy loading
// Implement responsive images with srcset
```

**Bundle Optimization:**
```bash
# Analyze bundle size
npm run build -- --analyze

# Remove unused dependencies
npm uninstall unused-package-name

# Implement code splitting for heavy components
```

#### 5.3 Caching Strategy
**Opprett fil:**
- `src/services/cache.ts`
  ```typescript
  // Redis cache layer (if using)
  // In-memory caching for API responses
  // Static generation for public pages
  ```

### 🔧 Performance Targets:
- **First Contentful Paint**: < 2.5s
- **Largest Contentful Paint**: < 4.0s  
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: < 500KB initial load

---

## **FASE 6: Produksjons-forberedelser** ⏱️ *1-2 dager*

### 📋 Oppgaver:

#### 6.1 Final Cleanup
**Code Review:**
```bash
# Remove all console.log statements
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\."

# Update environment variables for production
# Remove development-only configuration
```

**Security Audit:**
- Run `npm audit` og fiks sårbarheter
- Sjekk at alle secrets er i environment variables
- Verifiser HTTPS enforcement
- Test rate limiting under load

#### 6.2 Documentation
**Opprett/Oppdater filer:**
- `API-DOCUMENTATION.md` - Komplett API referanse
- `DEPLOYMENT-GUIDE.md` - Steg-for-steg deployment
- `ADMIN-USER-GUIDE.md` - How-to for admin funksjoner

#### 6.3 Testing & Monitoring
**End-to-End Testing:**
- Registration → Email verification → Login flow
- Password reset complete flow  
- Contact form submission → GHL integration
- Newsletter signup → Email confirmation
- OAuth login flows (Google & Facebook)

**Monitoring Setup:**
- Sentry error tracking (fix existing config)
- Google Analytics verification
- Performance monitoring
- Uptime monitoring

#### 6.4 Deployment Checklist
```bash
✅ All dev endpoints removed
✅ Environment variables updated  
✅ Database migrations applied
✅ Email service configured and tested
✅ OAuth apps configured and tested
✅ SSL certificate valid
✅ DNS configured correctly
✅ Backup strategy in place
✅ Monitoring tools active
✅ Performance benchmarks met
```

---

## 🛠️ Tekniske Krav & Dependencies

### New Dependencies:
```json
{
  "@sendgrid/mail": "^8.1.0",
  "csrf": "^3.1.0", 
  "helmet": "^7.1.0",
  "ioredis": "^5.3.2",
  "sharp": "^0.33.0",
  "validator": "^13.11.0"
}
```

### Environment Variables (Complete List):
```env
# Database
MONGODB_URI=mongodb+srv://...

# Authentication  
NEXTAUTH_URL=https://reconnoitering.art
NEXTAUTH_SECRET=your-super-secret-key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-api-key

# Email Service (Choose one)
SENDGRID_API_KEY=your-sendgrid-key
# OR
GHL_API_KEY=your-ghl-api-key
GHL_LOCATION_ID=your-ghl-location
GHL_FROM_EMAIL=noreply@reconnoitering.art

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret  
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Security
CSRF_SECRET=your-csrf-secret
WEBHOOK_SECRET=your-webhook-secret

# Optional - Performance
REDIS_URL=redis://localhost:6379
```

---

## ⚡ Implementerings-rekkefølge & Avhengigheter

### 🔴 **Uke 1 - Kritiske Funksjoner**
1. **Password Reset** (Dag 1-2)
   - Ingen avhengigheter, kan starte umiddelbart
   - Bruker existing user model og email service

2. **Contact Forms & Newsletter** (Dag 3-4)  
   - Avhenger av: Database models
   - Forbered for: GHL integration

3. **GoHighLevel Integration** (Dag 5)
   - Avhenger av: Contact forms implementert
   - Krever: GHL API credentials fra kunde

### 🟡 **Uke 2 - Forbedringer**
4. **OAuth Social Login** (Dag 1-3)
   - Avhenger av: OAuth app setup (Google & Facebook)
   - Krever: Client ID/Secret fra OAuth providers

5. **Security & Performance** (Dag 4-5)
   - Avhenger av: All core functionality ferdig
   - Inkluderer: Dev endpoint removal, optimization

### 🟢 **Uke 3 - Produksjon**
6. **Final Testing & Deployment** (Dag 1-2)
   - Avhenger av: Alt annet ferdig
   - Inkluderer: Documentation, monitoring, go-live

---

## 🚨 Risiko & Mitigering

### **High Risk:**
- **GHL API Changes**: Ha backup plan med SendGrid
- **OAuth App Approval**: Start OAuth app registration tidlig
- **Email Deliverability**: Test thoroughly med real emails

### **Medium Risk:**  
- **Performance Impact**: Monitor bundle size throughout development
- **Security Vulnerabilities**: Run security audit før hver deployment
- **Database Migration**: Test all schema changes på staging først

### **Low Risk:**
- **UI/UX Changes**: Minor iterations based on testing
- **Configuration**: Environment variable management

---

## 📈 Success Metrics

### **Funksjonalitet:**
- ✅ Password reset: 100% success rate
- ✅ Contact forms: < 5s response time  
- ✅ OAuth login: Support Google + Facebook
- ✅ Email service: 99%+ delivery rate

### **Performance:**
- 🎯 Page load: < 3s (95th percentile)
- 🎯 Bundle size: < 500KB initial
- 🎯 SEO score: > 90 (Lighthouse)
- 🎯 Accessibility: > 95 (WAVE)

### **Security:**
- 🔒 No security vulnerabilities (npm audit)
- 🔒 All dev endpoints removed
- 🔒 HTTPS enforced
- 🔒 Rate limiting active

---

## 🎉 Final Deliverables

Ved fullføring av denne planen vil Reconnoitering ha:

### ✨ **Complete Feature Set:**
- Password reset functionality
- Working contact forms med GHL integration  
- Newsletter signup med unsubscribe
- Google & Facebook OAuth login
- Production-ready security
- Optimized performance

### 📚 **Documentation:**
- Complete API documentation
- Deployment guide
- Admin user guide  
- Troubleshooting guide

### 🚀 **Production Ready:**
- All dev endpoints removed
- Comprehensive testing completed
- Monitoring & alerts configured
- Backup strategy implemented
- Performance benchmarks met

---

*Dette dokumentet representerer en komplett roadmap for å transformere Reconnoitering fra en nesten-ferdig applikasjon til en fullstendig produksjons-klar platform med alle nødvendige funksjoner implementert sikkert og effektivt.*

**Estimert total tid: 2-3 uker**  
**Team size: 1-2 utviklere**  
**Budget: Basert på time-estimater + third-party tjenester**