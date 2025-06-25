# 🔐 Environment Variables for Production - Reconnoitering

**Last Updated:** 2025-06-24  
**Platform:** Netlify  
**Status:** Ready for deployment (pending email service)

## 📋 Overview

This document provides a complete guide for configuring environment variables for the Reconnoitering project in production on Netlify.

## 🚨 Critical Variables (REQUIRED)

### 1. MONGODB_URI
**Purpose:** Database connection string  
**Security Level:** 🔴 SECRET - Never expose publicly  
**Example:** `mongodb+srv://username:password@cluster.mongodb.net/reconnoitering?retryWrites=true&w=majority`  
**Where to get:** MongoDB Atlas dashboard  
**Notes:** 
- IP whitelist must include `0.0.0.0/0` for Netlify
- Connection string must include `?retryWrites=true&w=majority`

### 2. NEXTAUTH_URL
**Purpose:** Base URL for authentication callbacks  
**Security Level:** 🟡 PUBLIC - Visible in browser  
**Example:** `https://reconnoitering.netlify.app`  
**Where to get:** Your Netlify deployment URL  
**Notes:**
- Must match your exact deployment URL
- No trailing slash
- Update when domain changes

### 3. NEXTAUTH_SECRET
**Purpose:** Encrypts JWT tokens and sessions  
**Security Level:** 🔴 SECRET - Never expose publicly  
**Generate with:** `openssl rand -base64 32`  
**Example:** `Rk3F9Lp2Qx8Yz5Wa7Nb4Mc6Vd1Jh0Sg9Te2Ui5Ol8Kp3Fq6Zx`  
**Notes:**
- Minimum 32 characters
- Never reuse across environments
- Regenerate if compromised

### 4. NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
**Purpose:** Google Maps integration for venue locations  
**Security Level:** 🟡 PUBLIC - Visible in browser (domain restricted)  
**Example:** `AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY`  
**Where to get:** [Google Cloud Console](https://console.cloud.google.com/)  
**Configuration:**
1. Enable Maps JavaScript API
2. Enable Geocoding API
3. Restrict to your domain(s)
4. Add localhost for development

## 📦 Optional Variables

### 5. SENDGRID_API_KEY
**Purpose:** Email service for verification emails  
**Security Level:** 🔴 SECRET - Never expose publicly  
**Status:** ⚠️ Not configured - emails log to console  
**Example:** `SG.xxxxxxxxxxxxxxxxxxxx`  
**Where to get:** SendGrid dashboard  
**Notes:** Required for password reset functionality

### 6. NEXT_PUBLIC_SENTRY_DSN
**Purpose:** Error tracking and monitoring  
**Security Level:** 🟡 PUBLIC - Safe to expose  
**Example:** `https://abc123@o123456.ingest.sentry.io/1234567`  
**Where to get:** Sentry project settings  
**Status:** ⚠️ Currently disabled in production (see sentry.client.config.ts)

### 7. Sentry Build Variables
Only needed if using Sentry source maps:
- `SENTRY_ORG`: Your Sentry organization slug
- `SENTRY_PROJECT`: Your Sentry project name  
- `SENTRY_AUTH_TOKEN`: For uploading source maps

## 🚫 Deprecated/Unused Variables

These appear in code but are not actively used:
- `DATABASE_URL` - Use MONGODB_URI instead
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Using Google Maps instead
- `NEXT_PUBLIC_BASE_URL` - Defaults to NEXTAUTH_URL
- `EMAIL_SERVER_*` - Using SendGrid instead

## 🔧 Netlify Configuration

### Setting Environment Variables

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add each variable with the "New variable" button
3. Select appropriate scopes:
   - Production: For live site
   - Deploy previews: For PR previews
   - Local development: For Netlify CLI

### Environment Variable Scopes

| Variable | Production | Preview | Local |
|----------|------------|---------|--------|
| MONGODB_URI | ✅ | ✅ | ❌ |
| NEXTAUTH_URL | ✅ | ⚠️ Different URL | ❌ |
| NEXTAUTH_SECRET | ✅ | ✅ | ❌ |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | ✅ | ✅ | ✅ |
| SENDGRID_API_KEY | ✅ | ❌ | ❌ |
| NEXT_PUBLIC_SENTRY_DSN | ✅ | ✅ | ❌ |

## ✅ Pre-Deployment Checklist

### Required Setup
- [ ] MongoDB connection string obtained and tested
- [ ] NEXTAUTH_URL matches Netlify domain exactly
- [ ] NEXTAUTH_SECRET generated (32+ characters)
- [ ] Google Maps API key created and domain-restricted
- [ ] All required variables added to Netlify

### Security Check
- [ ] No secrets committed to repository
- [ ] .env.local added to .gitignore
- [ ] API keys restricted by domain/IP
- [ ] Database has strong password
- [ ] MongoDB IP whitelist configured

### Optional Setup
- [ ] SendGrid account created (for emails)
- [ ] Sentry project configured (for monitoring)
- [ ] Domain verified for email sending

## 🧪 Testing Environment Variables

### 1. Local Testing
```bash
# Create .env.local (never commit this!)
cp .env.example .env.local
# Edit with your values
npm run dev
```

### 2. Build Testing
```bash
# Test production build locally
npm run build
npm start
```

### 3. Netlify CLI Testing
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Link to your site
netlify link

# Test with production variables
netlify dev
```

## 🚨 Common Issues

### Issue: "NEXTAUTH_NO_SECRET" error
**Solution:** Ensure NEXTAUTH_SECRET is set and has 32+ characters

### Issue: MongoDB connection fails
**Solution:** 
1. Check IP whitelist includes `0.0.0.0/0`
2. Verify connection string format
3. Check username/password

### Issue: Google Maps not loading
**Solution:**
1. Check browser console for API errors
2. Verify domain restrictions
3. Ensure billing is enabled

### Issue: Emails not sending
**Solution:** Currently expected - emails log to console until SendGrid configured

## 🔒 Security Best Practices

1. **Rotate Secrets Regularly**
   - Change NEXTAUTH_SECRET every 90 days
   - Rotate database passwords
   - Update API keys if suspicious activity

2. **Use Different Values Per Environment**
   - Never use production secrets in development
   - Use separate databases for dev/staging/prod
   - Different NEXTAUTH_SECRET per environment

3. **Monitor Access**
   - Check MongoDB Atlas logs
   - Monitor Google Maps API usage
   - Review Sentry for security events

4. **Principle of Least Privilege**
   - Database user has minimal required permissions
   - API keys restricted to necessary APIs only
   - Team members have appropriate access levels

## 📝 Variable Reference

```bash
# Production .env template (DO NOT COMMIT)
MONGODB_URI=mongodb+srv://prod-user:strong-password@cluster.mongodb.net/reconnoitering-prod?retryWrites=true&w=majority
NEXTAUTH_URL=https://reconnoitering.netlify.app
NEXTAUTH_SECRET=generated-secret-min-32-chars
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-restricted-api-key
SENDGRID_API_KEY=SG.your-api-key-here
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project
```

## 🔄 Post-Deployment Verification

1. **Test Authentication**
   - Register new account
   - Login/logout
   - Password change

2. **Test Maps**
   - View exhibition locations
   - Search venues
   - Check geocoding

3. **Test Database**
   - Create/read exhibitions
   - User favorites
   - Admin functions

4. **Monitor Logs**
   - Check Netlify function logs
   - Review MongoDB logs
   - Monitor error tracking

---

**Remember:** Never commit real environment variables to the repository. Always use .env.local for local development and configure production variables directly in Netlify.