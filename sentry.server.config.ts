import * as Sentry from "@sentry/nextjs";

// Temporarily disable Sentry in production to fix login issues
if (process.env.NODE_ENV === 'development') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Adjust this value in production
    tracesSampleRate: 1.0,
    
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}