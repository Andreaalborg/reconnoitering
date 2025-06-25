# 🛡️ Rate Limiting Implementation - Reconnoitering

**Created:** 2025-06-24  
**Status:** ✅ Implemented

## Overview
Rate limiting is implemented to protect authentication endpoints from brute force attacks and abuse.

## Implementation Details

### Rate Limiter Class
**Location:** `/src/lib/rateLimiter.ts`

**Features:**
- In-memory storage (suitable for single-instance deployments)
- Automatic cleanup of expired entries
- Configurable time windows and request limits
- Sentry integration for monitoring

**Default Limits:**
- **Authentication endpoints:** 5 attempts per 15 minutes
- **General API endpoints:** 100 requests per minute

### Protected Endpoints

#### 1. User Registration
**Endpoint:** `/api/user/register`  
**Limit:** 5 attempts per 15 minutes per IP  
**Identifier:** IP address  
**Response on limit:** 429 with retry time

#### 2. Login (NextAuth)
**Endpoint:** `/api/auth/[...nextauth]` (POST to callback/credentials)  
**Limit:** 5 attempts per 15 minutes per IP  
**Identifier:** IP address  
**Response on limit:** 429 with retry time

#### 3. Password Change
**Endpoint:** `/api/user/password`  
**Limit:** 5 attempts per 15 minutes per user+IP combination  
**Identifier:** `password-change:{email}:{ip}`  
**Response on limit:** 429 with retry time

## Technical Implementation

### How It Works
1. **IP Detection:** Uses `x-forwarded-for` or `x-real-ip` headers
2. **Storage:** In-memory map with expiration timestamps
3. **Cleanup:** Automatic cleanup runs every minute
4. **Monitoring:** Failed attempts logged to Sentry

### Response Format
```json
{
  "error": "Too many attempts. Please try again later.",
  "retryAfter": 300  // seconds until reset
}
```

### HTTP Headers
- **Status Code:** 429 (Too Many Requests)
- **Retry-After:** Time in seconds until rate limit resets

## Security Considerations

### Strengths
- Prevents brute force attacks
- Tracks by IP and user combination where applicable
- Integrated with Sentry for monitoring
- Clear error messages with retry information

### Limitations
- **In-memory storage:** Resets on server restart
- **Single instance:** Not shared across multiple server instances
- **IP-based:** Can be bypassed with proxy rotation

## Future Improvements

### 1. Redis Integration
For production with multiple instances:
```typescript
// Example Redis-based rate limiter
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
```

### 2. Account Lockout
After X failed attempts:
- Temporarily lock account
- Send security alert email
- Require email verification to unlock

### 3. CAPTCHA Integration
Add CAPTCHA after 3 failed attempts:
- Google reCAPTCHA
- hCaptcha
- Custom challenge

### 4. Adaptive Rate Limiting
- Stricter limits for suspicious IPs
- Relaxed limits for verified users
- Geographic-based rules

## Monitoring

### Sentry Events
Rate limit violations are logged with:
- **Level:** Warning
- **Tags:** `security: rate-limit`, `action: {endpoint}`
- **Extra data:** IP, user email (if applicable), attempt count

### Metrics to Track
1. Rate limit hits per endpoint
2. Unique IPs hitting limits
3. Geographic distribution of attacks
4. Time patterns of attempts

## Testing

### Manual Testing
```bash
# Test registration rate limit
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/user/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!"}'
done

# Test login rate limit
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/callback/credentials \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

### Expected Behavior
- First 5 requests: Normal response
- 6th request: 429 error with retry time
- After waiting: Limits reset

## Deployment Notes

### Environment Considerations
- **Development:** In-memory storage works fine
- **Production (single instance):** Current implementation sufficient
- **Production (multiple instances):** Need Redis or similar

### Netlify Deployment
- Works with current implementation
- Consider Netlify's built-in rate limiting as additional layer
- Monitor memory usage with in-memory storage

## Code Example

### Using the Rate Limiter
```typescript
import { authRateLimiter } from '@/lib/rateLimiter';

// In your API route
const ip = headers().get('x-forwarded-for') || 'unknown';
const isAllowed = await authRateLimiter.isAllowed(ip);

if (!isAllowed) {
  const retryAfter = authRateLimiter.getRemainingTime(ip);
  return NextResponse.json(
    { error: 'Too many attempts', retryAfter },
    { status: 429 }
  );
}
```

---

**Last Updated:** 2025-06-24