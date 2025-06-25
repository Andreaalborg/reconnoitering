'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SessionTimeoutProps {
  timeoutInMinutes?: number;
  warningInMinutes?: number;
}

export default function SessionTimeout({ 
  timeoutInMinutes = 30, 
  warningInMinutes = 5 
}: SessionTimeoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Activity events to track
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    clearTimers();
    setShowWarning(false);
    await signOut({ 
      callbackUrl: '/auth/login?reason=timeout',
      redirect: true 
    });
  }, [clearTimers]);

  // Reset inactivity timer
  const resetTimer = useCallback(() => {
    if (status !== 'authenticated') return;

    clearTimers();
    setShowWarning(false);

    // Set warning timer
    const warningTime = (timeoutInMinutes - warningInMinutes) * 60 * 1000;
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeLeft(warningInMinutes * 60);

      // Start countdown
      countdownRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningTime);

    // Set logout timer
    const logoutTime = timeoutInMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(handleLogout, logoutTime);
  }, [status, timeoutInMinutes, warningInMinutes, handleLogout, clearTimers]);

  // Continue session
  const continueSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Setup event listeners
  useEffect(() => {
    if (status !== 'authenticated') return;

    // Initial setup
    resetTimer();

    // Add event listeners
    const handleActivity = () => resetTimer();
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      clearTimers();
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [status, resetTimer, clearTimers]);

  // Don't render if not authenticated
  if (status !== 'authenticated') return null;

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Session Timeout Warning
            </h2>
            <p className="text-gray-600 mb-6">
              Your session will expire in <span className="font-bold text-red-600">{formatTime(timeLeft)}</span> due to inactivity.
              Would you like to continue?
            </p>
            <div className="flex gap-4">
              <button
                onClick={continueSession}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue Session
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}