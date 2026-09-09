# Install Dentaprime

Push the updated project to GitHub and deploy it to Render over HTTPS. The site
now supplies a web app manifest, app name, standalone display mode, Android icons
and an Apple touch icon, all derived from `public/images/dentaprime.png`.

- Desktop Chrome/Edge: open the live site and use the address-bar install icon or
  the browser menu's install-app option.
- Android: use the browser's Install app / Add to Home screen option.
- iPhone/iPad: Safari → Share → Add to Home Screen → Add. Enable Open as Web App
  if your iOS version shows that option. Other supported iOS browsers expose this
  through their share menu; the exact choices depend on browser and OS version.
- macOS Safari: File → Add to Dock on supported macOS versions.

Browser and OS support controls whether installation is offered and whether it
creates a standalone app or a shortcut. A website cannot force installation in
every browser. No app-store submission is involved.

The installed name is **Dentaprime**. Existing installations may retain their old
name/icon until the browser updates them; removing and adding the app again can
refresh them. Sign in again if the installed app uses a separate session.

## Verification after deployment

1. Open `/manifest.webmanifest`, `/sw.js` and `/app-icons/icon-192.png` on the live
   domain. Each must return the actual file, not the SPA fallback HTML.
2. Confirm name and icon in the browser installation dialog.
3. Install and launch from the desktop or home screen; check navigation and login.
4. Test on physical Android and iOS devices; installation has not been device-tested
   by the assistant.

The service worker caches only a generic offline page and logo. It does not cache
patient data, authentication responses, or appointments. Booking and account access
require an internet connection. Normal pages and app code always use the network.

References: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
