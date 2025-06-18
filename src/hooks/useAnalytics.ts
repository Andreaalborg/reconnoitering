'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface AnalyticsData {
  sessionId: string;
  startTime: number;
  clicks: number;
  maxScrollDepth: number;
}

export function useAnalytics() {
  const pathname = usePathname();
  const analyticsRef = useRef<AnalyticsData>({
    sessionId: '',
    startTime: Date.now(),
    clicks: 0,
    maxScrollDepth: 0
  });
  const intervalRef = useRef<NodeJS.Timeout>();

  // Get or create session ID
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('analyticsSessionId');
    if (storedSessionId) {
      analyticsRef.current.sessionId = storedSessionId;
    } else {
      const newSessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analyticsSessionId', newSessionId);
      analyticsRef.current.sessionId = newSessionId;
    }
  }, []);

  // Track page view
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'pageview',
            page: pathname,
            path: window.location.href,
            referrer: document.referrer,
            sessionId: analyticsRef.current.sessionId
          })
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    // Reset analytics for new page
    analyticsRef.current.startTime = Date.now();
    analyticsRef.current.clicks = 0;
    analyticsRef.current.maxScrollDepth = 0;

    trackPageView();

    // Track time on page every 30 seconds
    intervalRef.current = setInterval(() => {
      updatePageMetrics();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Send final metrics when leaving page
      updatePageMetrics();
    };
  }, [pathname]);

  // Track clicks
  useEffect(() => {
    const handleClick = () => {
      analyticsRef.current.clicks++;
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercentage = (scrollTop + windowHeight) / documentHeight * 100;
      
      if (scrollPercentage > analyticsRef.current.maxScrollDepth) {
        analyticsRef.current.maxScrollDepth = scrollPercentage;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update page metrics
  const updatePageMetrics = useCallback(async () => {
    const duration = Math.floor((Date.now() - analyticsRef.current.startTime) / 1000);
    
    try {
      await fetch('/api/analytics/track', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: analyticsRef.current.sessionId,
          page: pathname,
          duration,
          scrollDepth: Math.round(analyticsRef.current.maxScrollDepth),
          clicks: analyticsRef.current.clicks
        })
      });
    } catch (error) {
      console.error('Failed to update page metrics:', error);
    }
  }, [pathname]);

  // Track custom events
  const trackEvent = useCallback(async (
    eventType: string,
    eventName: string,
    eventValue?: any,
    metadata?: any
  ) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event',
          eventType,
          eventName,
          eventValue,
          page: pathname,
          sessionId: analyticsRef.current.sessionId,
          metadata
        })
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [pathname]);

  return { trackEvent };
}