# 🚀 Deployment Checklist - Reconnoitering

**Platform:** Netlify  
**Last Updated:** 2025-06-24  
**Status:** Ready (pending email service)

## 📋 Pre-Deployment Checklist

### 1. Code Quality ✅
- [x] TypeScript compilation passes (`npx tsc --noEmit`)
- [x] ESLint errors fixed (0 errors)
- [ ] ESLint warnings addressed (17 warnings - optional)
- [x] Build succeeds locally (`npm run build`)

### 2. Security Review 🔒
- [x] Rate limiting implemented on auth endpoints
- [x] Password validation enforced
- [ ] Email verification enabled (pending email service)
- [ ] Development endpoints removed (keep until email service ready)
- [x] Environment variables documented
- [ ] Secrets rotated if previously exposed

### 3. Environment Variables 🔐
**Required:**
- [ ] `MONGODB_URI` - Database connection string
- [ ] `NEXTAUTH_URL` - Your Netlify URL (https://yourdomain.netlify.app)
- [ ] `NEXTAUTH_SECRET` - Generated with `openssl rand -base64 32`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Domain-restricted API key

**Optional but recommended:**
- [ ] `SENDGRID_API_KEY` - For email service
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - For error tracking

### 4. Database Setup 📊
- [ ] MongoDB Atlas account created
- [ ] Database user created with limited permissions
- [ ] IP whitelist includes `0.0.0.0/0` for Netlify
- [ ] Connection string tested
- [ ] Backup strategy in place

### 5. API Keys Configuration 🔑
**Google Maps:**
- [ ] Maps JavaScript API enabled
- [ ] Geocoding API enabled
- [ ] API key restricted by domain
- [ ] Billing account active

**SendGrid (when ready):**
- [ ] Account created
- [ ] API key generated
- [ ] Domain verified
- [ ] Email templates created

### 6. Netlify Configuration ⚙️
- [ ] Repository connected
- [ ] Build settings configured:
  - Build command: `npm run build`
  - Publish directory: `.next`
  - Node version: 18.18.0
- [ ] Environment variables added
- [ ] Deploy previews enabled
- [ ] Custom domain configured (if applicable)

## 🚦 Deployment Steps

### Step 1: Final Code Check
```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Run final checks
npm install
npm run lint
npm run build
npm test # if tests exist
```

### Step 2: Environment Variables
1. Log into Netlify Dashboard
2. Go to Site Settings → Environment Variables
3. Add each required variable
4. Double-check values (no trailing spaces)
5. Save changes

### Step 3: Deploy
```bash
# Commit any final changes
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 4: Monitor Deployment
1. Watch Netlify deploy log
2. Check for any build errors
3. Wait for "Deploy succeeded" message

## ✅ Post-Deployment Verification

### 1. Basic Functionality
- [ ] Homepage loads without errors
- [ ] Navigation works
- [ ] Images load correctly
- [ ] No console errors in browser

### 2. Authentication
- [ ] User registration works
- [ ] Login/logout functions
- [ ] Password change works
- [ ] Rate limiting triggers after 5 attempts

### 3. Core Features
- [ ] Exhibition search works
- [ ] Map displays correctly
- [ ] Venue pages load
- [ ] Calendar functions
- [ ] Day planner works

### 4. Data Operations
- [ ] Can view exhibitions
- [ ] Favorites can be added/removed
- [ ] Admin panel accessible (for admin users)
- [ ] Database queries performant

### 5. Security
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No sensitive data in page source
- [ ] API endpoints protected

## 🐛 Troubleshooting

### Build Fails
1. Check Netlify build logs
2. Verify Node version (18.18.0)
3. Check environment variables
4. Try clearing cache and deploy

### Authentication Issues
1. Verify NEXTAUTH_URL matches exactly
2. Check NEXTAUTH_SECRET is set
3. Ensure MongoDB is accessible
4. Check browser console for errors

### Database Connection Fails
1. Verify MongoDB URI format
2. Check IP whitelist (0.0.0.0/0)
3. Test connection string locally
4. Check MongoDB Atlas status

### Maps Not Loading
1. Check API key in browser console
2. Verify domain restrictions
3. Ensure billing is active
4. Check quota limits

## 📊 Performance Checklist

### Initial Load
- [ ] Lighthouse score > 70
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 5s
- [ ] No layout shifts

### Optimization
- [ ] Images optimized
- [ ] Code splitting working
- [ ] API routes cached appropriately
- [ ] Database queries indexed

## 🔄 Rollback Plan

If issues arise:
1. Netlify → Deploys → Click previous deploy
2. "Publish deploy" to rollback
3. Investigate issue in staging
4. Fix and redeploy

## 📝 Final Notes

### Before Going Live
1. Remove development endpoints
2. Enable email service
3. Set up monitoring (Sentry)
4. Configure custom domain
5. Enable Netlify Analytics

### After Launch
1. Monitor error logs
2. Check performance metrics
3. Gather user feedback
4. Plan regular updates
5. Keep dependencies updated

---

**Remember:** Take your time with deployment. It's better to catch issues in staging than in production. When in doubt, test again!