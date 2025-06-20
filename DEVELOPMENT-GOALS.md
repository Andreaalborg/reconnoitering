# Reconnoitering - Development Goals & Progress

## Project Vision
Create an elegant, user-friendly art exhibition discovery platform that helps art enthusiasts find and plan visits to exhibitions worldwide.

## MVP Goals

### 🆕 Customer Feedback Priorities (2025-06-20)
1. **Interactive Map Improvements** 🗺️
   - Transform map to be more like booking.com
   - Show ALL venue pins by default
   - Implement hover tooltips with quick venue info
   - Display exhibitions, opening hours in hover state
   
2. **Enhanced Location Features** 📍
   - Maintain current "Nearby me" functionality
   - Add vacation planning mode:
     - Choose any global location as center point
     - Set custom radius around chosen location
     - Essential for trip planning (e.g., Paris vacation)
   
3. **Venue Status Visibility** 🕐
   - Clear closure information on exhibition previews
   - "Closed on Mondays" type messaging
   - Use visual indicators (red text/small font)

### High Priority (Must have for MVP)
1. **Design/Layout Overhaul** ⏳
   - Inspiration: tate.org.uk, nasjonalmuseet.no
   - More artistic and sophisticated aesthetic
   - Better use of space (reduce excessive whitespace)
   - Typography and color improvements
   
2. **Mobile & Tablet Optimization** 📱
   - Ensure all features work smoothly on mobile
   - Touch-friendly interfaces
   - Responsive images and maps
   
3. **Fix /tags Page** ✅ COMPLETED
   - Created functional tags page
   - Displays all available tags
   - Allows filtering exhibitions by tags

### Medium Priority
4. **Verify Admin Functionality** ✓
   - Museum/venue management
   - Exhibition updates
   - Regular monitoring tools

5. **Security Implementation** ✅ COMPLETED
   - Password hashing with bcrypt
   - Email verification system
   - Strong password requirements
   - Secure authentication flow

### Low Priority (Post-MVP)
6. **Public Transit Integration** 🚌
   - Google Directions API for route planning
   - Show transit options between exhibitions
   - Estimated travel times
   
7. **Newsletter System** 📧
   - Email notifications for new exhibitions
   - Preference-based alerts
   - Subscription management

## Design Inspiration Sources
- [Tate](https://www.tate.org.uk) - Clean, artistic, sophisticated
- [Nasjonalmuseet](https://www.nasjonalmuseet.no) - Scandinavian minimalism
- [MoMA](https://www.moma.org) - Modern, bold typography

## Progress Tracking

### 2025-06-18
- [x] Successfully deployed to Netlify after Vercel issues
- [x] Fixed TypeScript errors and environment variables
- [x] Created missing /tags page with API endpoint
- [x] Started design overhaul with Tate-inspired aesthetic:
  - Updated color scheme (black/white/red minimal palette)
  - Added serif typography for headers
  - Implemented minimal card designs
  - Better use of whitespace with larger typography
  - Added accent lines and subtle hover effects
  - Updated homepage with new hero section
- [ ] Need to update remaining pages with new design
- [ ] Mobile optimization improvements needed

### 2025-06-19
- [x] Fixed duplicate navbar issue across all pages
- [x] Fixed profile image upload functionality
  - Created proper upload endpoint for avatars
  - Images now save to server instead of using placeholders
  - Removed demo avatar selection
- [x] Implemented comprehensive security features:
  - Bcrypt password hashing
  - Email verification requirement
  - Strong password validation with real-time feedback
  - Secure password change functionality
  - Development helpers for testing
- [x] Updated all documentation
- [ ] Need to integrate real email service for production
- [ ] Need to add rate limiting and CSRF protection

## Technical Considerations
- Using Next.js 14 with App Router
- Tailwind CSS for styling
- MongoDB for database
- NextAuth for authentication
- Google Maps API for location features

## Notes
- Keep accessibility in mind during redesign
- Maintain fast loading times
- Progressive enhancement approach
- Test on real devices, not just browser dev tools