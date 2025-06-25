# 🛡️ Security Headers Implementation - Reconnoitering

**Created:** 2025-06-24  
**Status:** ✅ Implemented  
**Location:** `next.config.mjs`

## Overview

Security headers have been implemented to protect the application against common web vulnerabilities including XSS, clickjacking, and other attacks.

## Implemented Headers

### 1. X-DNS-Prefetch-Control
**Value:** `on`  
**Purpose:** Allows browser to perform DNS lookups on external domains before user clicks links  
**Security Impact:** Minor performance improvement, minimal security risk

### 2. X-XSS-Protection
**Value:** `1; mode=block`  
**Purpose:** Enables browser's built-in XSS filter  
**Security Impact:** Prevents reflected XSS attacks in older browsers  
**Note:** Modern browsers use CSP instead, but this provides legacy support

### 3. X-Frame-Options
**Value:** `SAMEORIGIN`  
**Purpose:** Prevents clickjacking attacks  
**Security Impact:** Page cannot be embedded in iframes on other domains  
**Alternative:** Also enforced via CSP `frame-ancestors`

### 4. X-Content-Type-Options
**Value:** `nosniff`  
**Purpose:** Prevents MIME type sniffing  
**Security Impact:** Stops browser from interpreting files as different MIME types

### 5. Referrer-Policy
**Value:** `strict-origin-when-cross-origin`  
**Purpose:** Controls how much referrer information is sent  
**Security Impact:** Protects user privacy and prevents information leakage

### 6. Permissions-Policy
**Value:** `camera=(), microphone=(), geolocation=(self), interest-cohort=()`  
**Purpose:** Controls which browser features can be used  
**Security Impact:** 
- Disables camera and microphone access
- Restricts geolocation to same origin only
- Opts out of FLoC tracking

### 7. Strict-Transport-Security (HSTS)
**Value:** `max-age=63072000; includeSubDomains; preload`  
**Purpose:** Forces HTTPS connections  
**Security Impact:** 
- 2-year HTTPS enforcement
- Includes all subdomains
- Ready for HSTS preload list
**⚠️ Warning:** Cannot be easily reversed once deployed

### 8. Content-Security-Policy (CSP)
**Purpose:** Controls which resources can be loaded  
**Configuration:**

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com https://*.sentry.io;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https: http:;
media-src 'self' https: blob:;
connect-src 'self' https://maps.googleapis.com https://*.sentry.io https://vitals.vercel-insights.com https://*.netlify.app wss://*.netlify.app;
frame-src 'self' https://maps.google.com https://www.google.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

**Allowed Resources:**
- Scripts: Self + Google Maps + Sentry (with unsafe-inline for Next.js)
- Styles: Self + Google Fonts + Maps (with unsafe-inline for Tailwind)
- Images: All HTTPS sources + data URIs
- Connections: Self + Maps API + Sentry + Netlify
- Frames: Self + Google Maps embeds
- Objects: None (blocks Flash, etc.)

## API CORS Headers

Additional headers for API routes:
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Origin: *` (⚠️ Configure for production)
- `Access-Control-Allow-Methods: GET,DELETE,PATCH,POST,PUT`
- `Access-Control-Allow-Headers: [various]`

## Security Considerations

### Strengths
1. **Comprehensive Protection**: Guards against XSS, clickjacking, MIME sniffing
2. **Privacy Protection**: Referrer policy and Permissions policy
3. **HTTPS Enforcement**: HSTS ensures encrypted connections
4. **Resource Control**: CSP limits what can be loaded

### Current Limitations
1. **unsafe-inline**: Required for Next.js and Tailwind CSS
2. **unsafe-eval**: Required for some Next.js features
3. **Broad img-src**: Allows images from any HTTPS source
4. **CORS Origin**: Currently allows all origins (needs restriction)

## Testing Headers

### 1. Browser Developer Tools
```bash
# In Chrome/Firefox DevTools
Network tab → Select request → Headers tab → Response Headers
```

### 2. Command Line
```bash
curl -I https://yourdomain.netlify.app
```

### 3. Online Tools
- [Security Headers Scanner](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

## Common Issues & Solutions

### Issue: Google Maps not loading
**Solution:** CSP includes necessary Google domains

### Issue: Styles not applying
**Solution:** `unsafe-inline` allowed for Tailwind CSS

### Issue: Images not loading
**Solution:** Check image domain is HTTPS or add to CSP

### Issue: API calls blocked
**Solution:** Add domain to connect-src in CSP

## Future Improvements

### 1. Remove unsafe-inline
**Challenge:** Next.js and Tailwind require inline styles/scripts  
**Solution:** 
- Use nonces for inline scripts
- Extract critical CSS
- Use CSS-in-JS with CSP support

### 2. Tighten CSP
```javascript
// More restrictive CSP for future
script-src 'self' 'nonce-{generated}' https://maps.googleapis.com;
style-src 'self' 'nonce-{generated}' https://fonts.googleapis.com;
img-src 'self' data: https://specific-domains.com;
```

### 3. Configure CORS Properly
```javascript
// Production CORS configuration
const allowedOrigins = [
  'https://reconnoitering.netlify.app',
  'https://yourcustomdomain.com'
];

headers: [
  { 
    key: 'Access-Control-Allow-Origin', 
    value: allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  }
]
```

### 4. Add Additional Headers
- `X-Permitted-Cross-Domain-Policies: none`
- `Expect-CT: enforce, max-age=86400`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

## Monitoring & Compliance

### CSP Violation Reporting
Add to CSP for monitoring:
```javascript
report-uri https://yourdomain.report-uri.com/r/d/csp/enforce;
report-to default;
```

### Report-To Header
```javascript
{
  key: 'Report-To',
  value: JSON.stringify({
    group: "default",
    max_age: 31536000,
    endpoints: [{
      url: "https://yourdomain.report-uri.com/a/d/g"
    }]
  })
}
```

## Deployment Notes

### Development vs Production
- Headers apply to all environments
- HSTS should be tested carefully before production
- CSP violations only logged in console during development

### Netlify Specific
- Headers configured in Next.js override Netlify headers
- Both `_headers` file and `netlify.toml` headers are overridden
- Next.js headers are applied at build time

### Testing After Deployment
1. Use security header scanning tools
2. Test all functionality (maps, images, API calls)
3. Check browser console for CSP violations
4. Verify HTTPS redirect works

## Quick Reference

### Adding New External Resource
1. Identify resource type (script, style, image, etc.)
2. Add domain to appropriate CSP directive
3. Test in development
4. Deploy and verify

### Example: Adding new image CDN
```javascript
img-src 'self' data: blob: https: http: https://newcdn.com;
```

### Debugging CSP Issues
1. Check browser console for violations
2. Identify blocked resource and type
3. Add to appropriate directive
4. Consider security implications

---

**Remember:** Security headers are your first line of defense. Always err on the side of being more restrictive and only relax policies when absolutely necessary.