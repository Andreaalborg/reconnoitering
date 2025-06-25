# Session Timeout Implementation Documentation

## Overview
This document details the implementation of the session timeout feature for the Reconnoitering application. The feature automatically logs out users after a period of inactivity to enhance security.

## Implementation Date
June 25, 2025

## Components Created

### 1. SessionTimeout Component (`/src/components/SessionTimeout.tsx`)
A client-side React component that:
- Tracks user activity (mouse movements, clicks, keyboard input, scrolling)
- Shows a warning dialog 5 minutes before session expiration
- Displays a countdown timer
- Allows users to extend their session or logout
- Automatically logs out users after 30 minutes of inactivity

#### Key Features:
- **Activity Detection**: Monitors multiple DOM events to detect user activity
- **Warning System**: Shows modal dialog before timeout
- **Countdown Display**: Shows remaining time in MM:SS format
- **Graceful Logout**: Redirects to login page with timeout reason
- **Configurable**: Accepts props for timeout and warning durations

#### Props:
```typescript
interface SessionTimeoutProps {
  timeoutInMinutes?: number;  // Default: 30
  warningInMinutes?: number;   // Default: 5
}
```

### 2. Layout Integration (`/src/app/layout.tsx`)
Added SessionTimeout component to the root layout:
```tsx
<SessionTimeout timeoutInMinutes={30} warningInMinutes={5} />
```

## Technical Implementation Details

### Activity Tracking
The component tracks the following events:
- `mousedown`
- `mousemove`
- `keypress`
- `scroll`
- `touchstart`
- `click`

### Timer Management
- Uses React refs to manage multiple timers
- Clears all timers on component unmount
- Resets timers on any user activity
- Prevents memory leaks with proper cleanup

### Session Integration
- Uses NextAuth's `useSession` hook
- Only active when user is authenticated
- Calls `signOut` with redirect to login page
- Passes `reason=timeout` query parameter for context

### UI/UX Considerations
- Modal overlay with semi-transparent background
- Clear warning message with countdown
- Two action buttons: Continue Session and Logout
- Responsive design for mobile devices
- Accessible color contrast for visibility

## Configuration

### Current Settings:
- **Session Timeout**: 30 minutes
- **Warning Time**: 5 minutes before timeout
- **Session Max Age**: 30 days (in auth options)

### Modifying Timeout Values:
1. In `layout.tsx`, adjust the props:
   ```tsx
   <SessionTimeout timeoutInMinutes={60} warningInMinutes={10} />
   ```

2. For global session duration, modify `/src/app/api/auth/options.ts`:
   ```typescript
   session: {
     strategy: 'jwt',
     maxAge: 30 * 24 * 60 * 60, // 30 days
   }
   ```

## Security Benefits

1. **Prevents Unauthorized Access**: Automatically logs out unattended sessions
2. **Reduces Attack Window**: Limits time for session hijacking
3. **Compliance**: Helps meet security requirements for sensitive applications
4. **User Awareness**: Warning dialog educates users about session security

## Testing Instructions

### Manual Testing:
1. Login to the application
2. Wait for 25 minutes without any activity
3. Verify warning dialog appears
4. Test "Continue Session" button - should reset timer
5. Test "Logout" button - should redirect to login
6. Test countdown timer accuracy
7. Let timer expire - should auto-logout

### Testing with Shorter Timeouts:
For faster testing, temporarily adjust the component props:
```tsx
<SessionTimeout timeoutInMinutes={2} warningInMinutes={1} />
```

### Edge Cases to Test:
1. Multiple tabs open - all should logout together
2. Activity in one tab should reset timer in all tabs
3. Logout from another source should not show warning
4. Browser refresh should maintain timer state

## Potential Enhancements

1. **Persistent Timer State**: Store timer state in sessionStorage to survive page refreshes
2. **API Activity Tracking**: Reset timer on API calls, not just UI interactions
3. **Custom Warning Messages**: Different messages for different timeout reasons
4. **Configurable Events**: Allow customization of which events reset the timer
5. **Sound/Visual Alerts**: Additional notifications before timeout
6. **Remember Me Option**: Longer timeout for trusted devices

## Known Limitations

1. Timer resets on any page navigation (SPA behavior)
2. Does not persist exact remaining time across refreshes
3. Warning dialog can be dismissed by refreshing the page
4. No server-side validation of session timeout

## Integration with Existing Features

- Works alongside NextAuth session management
- Compatible with existing authentication flow
- Does not interfere with manual logout
- Respects role-based access controls

## Troubleshooting

### Warning not appearing:
- Check browser console for errors
- Verify SessionTimeout component is rendered
- Ensure user is authenticated
- Check timer values are correct

### Auto-logout not working:
- Verify signOut is imported from next-auth/react
- Check redirect URL is valid
- Ensure NEXTAUTH_URL is configured

### Performance issues:
- Too many event listeners - consider debouncing
- Memory leaks - check timer cleanup
- React re-renders - use React.memo if needed

## Future Considerations

1. **Server-Side Timeout**: Implement matching server-side session expiration
2. **Activity Logging**: Track session timeout events for security auditing
3. **User Preferences**: Allow users to set their preferred timeout duration
4. **Mobile Optimization**: Different timeout values for mobile devices
5. **Integration with 2FA**: Require re-authentication after timeout