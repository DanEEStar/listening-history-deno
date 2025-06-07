Make the index page mobile-friendly. It should show the two sections (audiobooks and tracks) in a single column layout on small screens, with proper spacing and typography. The play buttons should be large enough to be easily tappable on mobile devices.
On larger screens, maintain the current two-column layout but improve spacing and visual hierarchy. Ensure that the play buttons are still accessible and visually distinct.

✅ COMPLETED: Made index page mobile-friendly with responsive design
- Implemented responsive layout: single column on mobile (< lg), two columns on large screens
- Enhanced TrackItem component with card-based design and better mobile spacing
- Added large, tappable play buttons (min-height: 44px) with play icons for better UX
- Improved typography hierarchy with larger headings and better contrast
- Made search section responsive with stacked inputs on mobile, side-by-side on larger screens
- Added proper background colors and shadows for better visual separation
- Enhanced Spotify device selection with responsive grid layout
- Added consistent padding and spacing throughout for better mobile experience

##########################################

✅ COMPLETED: Refactored track rendering into TrackItem component
- Created components/TrackItem.vue with reusable track display logic
- Added proper TypeScript props interface for SpotifyTrackApiPlayInfo
- Implemented emit system for play button clicks
- Updated index.vue to use TrackItem component for both audiobooks and tracks
- Improved styling with better spacing, typography, and visual hierarchy
- Eliminated code duplication between audiobooks and tracks sections
