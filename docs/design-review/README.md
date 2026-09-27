# Layout and design review

The mint background, dark teal sections, glass cards and floating navigation form a consistent identity. The main weaknesses were contrast, crowded mobile spacing, clipped dashboard labels and inconsistent button styling.

Changes:
- Dark readable labels on solid mint buttons; deeper teal links and active states on light backgrounds. Mint accents remain on dark panels and the brand.
- Shorter mobile sign-in introduction, more space for form fields, and consistent mint backgrounds across authentication pages.
- Shared buttons use a 48px minimum height, restrained corners and tighter icon spacing. Service cards stretch consistently within their grid.
- Dashboard metric labels wrap rather than truncate; the four-column layout waits for wider screens. Compact screen padding and wrapping prevent crowded headings.
- Corrected the portal user-name width constraint, improved sidebar active-state contrast, and preserved the floating bottom navigation.
- Mobile inputs use 16px text to avoid focus zoom. Feedback messages stack their retry button on narrow screens. Brand links retain a visible keyboard focus indicator. Reduced-motion preferences suppress decorative animation/transitions.

Browser review covered sign-in at mobile and desktop sizes and the mobile public header/navigation. Authenticated portal styling was reviewed in source; a signed-in visual check remains useful after deployment. No database changes were made for this design pass.

Primary shared styling: `src/index.css`. Layout files control headers and sidebars; dashboard and authentication pages contain their responsive spacing.
