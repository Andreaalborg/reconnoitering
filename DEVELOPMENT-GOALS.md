# Reconnoitering - Development Goals & Progress

## Project Vision
Create an elegant, user-friendly art exhibition discovery platform that helps art enthusiasts find and plan visits to exhibitions worldwide.

## MVP Goals

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
   
3. **Fix /tags Page** 🔧
   - Currently not functioning
   - Should display all available tags
   - Allow filtering exhibitions by tags

### Medium Priority
4. **Verify Admin Functionality** ✓
   - Museum/venue management
   - Exhibition updates
   - Regular monitoring tools

### Low Priority (Post-MVP)
5. **Public Transit Integration** 🚌
   - Google Directions API for route planning
   - Show transit options between exhibitions
   - Estimated travel times
   
6. **Newsletter System** 📧
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