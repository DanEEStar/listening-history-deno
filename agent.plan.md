The "Spotify Device" list seems not to work anymore, since the beginning of our session...
Can you fix it?


##########################################
✅ COMPLETED: Fixed Spotify Device selection for NuxtUI v3 compatibility
- Updated URadioGroup component to use `items` prop instead of deprecated `options` prop
- Added `variant="card"` for better visual presentation
- Enhanced device information display with:
  - Device name as main label
  - Device type, active status, and volume percentage as description
  - Disabled state for restricted inactive devices
- Updated SpotifyTrackApiPlayInfo type to include album_index property
- Fixed TypeScript compilation errors and removed unused variables
- Spotify device selection now works properly with NuxtUI v3
✅ COMPLETED: Updated audiobooks display to show album name as main title
- Added `isAudiobook` prop to TrackItem component to distinguish audiobooks from regular tracks
- Updated TrackItem template to conditionally display:
  - For audiobooks: Album title as main title, track title as secondary info
  - For regular tracks: Track title as main title, album title as secondary info
- Enhanced SpotifyTrackDb interface to include `album_index` property
- Updated index.vue to pass `isAudiobook: true` for audiobooks section and `isAudiobook: false` for tracks section
- Audiobooks now properly display with album name prominently featured as the main title

✅ COMPLETED: Fixed audiobooks list by updating PostgreSQL function
- Extended `get_album_tracks()` function to include `album_image` field in return table
- Added extraction of album image URL from track JSON: `track->'album'->'images'->0->>'url'`
- Reverted audiobooks query to use the proper PostgreSQL function instead of custom query
- Created update script at `scripts/update_album_function.sql` for database deployment
- Regenerated database types to reflect the updated function signature
- Audiobooks list now properly displays with album thumbnails using the same component

✅ COMPLETED: Added album thumbnail images to track lists
- Updated database queries to include album image URLs from Spotify track data
- Modified SpotifyTrackDb interface to include optional album_image field
- Enhanced TrackItem component with Spotify-style layout:
    - Album thumbnail (64x64px on mobile, 80x80px on desktop) with rounded corners
    - Horizontal layout with image on left, track info on right
    - Fallback musical note icon for tracks without images
    - Improved information hierarchy: title, artist, album
    - Added relative date formatting (e.g., "2h ago", "Yesterday")
    - Compact play button with proper mobile touch targets
- Applied lazy loading for album images for better performance
- Maintained responsive design with proper text truncation

✅ COMPLETED: Made index page mobile-friendly with responsive design
- Implemented responsive layout: single column on mobile (< lg), two columns on large screens
- Enhanced TrackItem component with card-based design and better mobile spacing
- Added large, tappable play buttons (min-height: 44px) with play icons for better UX
- Improved typography hierarchy with larger headings and better contrast
- Made search section responsive with stacked inputs on mobile, side-by-side on larger screens
- Added proper background colors and shadows for better visual separation
- Enhanced Spotify device selection with responsive grid layout
- Added consistent padding and spacing throughout for better mobile experience
- 
✅ COMPLETED: Refactored track rendering into TrackItem component
- Created components/TrackItem.vue with reusable track display logic
- Added proper TypeScript props interface for SpotifyTrackApiPlayInfo
- Implemented emit system for play button clicks
- Updated index.vue to use TrackItem component for both audiobooks and tracks
- Improved styling with better spacing, typography, and visual hierarchy
- Eliminated code duplication between audiobooks and tracks sections
