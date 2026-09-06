# LinkedIn event cover tool

The LinkedIn Page provider exposes `uploadEventCover` through the existing
authenticated `/public/v1/integration-trigger/:id` route. It receives
`{ url, owner }`: an image URL from Postiz's upload API and the expected
`urn:li:organization:<pageId>`. The integration determines the actual owner;
callers cannot select an unrelated organization or supply a token.

The helper only accepts the configured public media origin/path
(`CLOUDFLARE_BUCKET_URL` for Cloudflare storage, `FRONTEND_URL + '/uploads'`
for local storage, selected by `STORAGE_PROVIDER`). Downloads use the existing SSRF-safe
dispatcher, prohibit redirects, enforce a 10 MB streamed limit, and validate
JPG/PNG/GIF signatures. It uses the normal Page image uploader and waits for
LinkedIn's AVAILABLE status. It returns an image and digitalmediaAsset URN,
owner and status, never a token. It creates no event, post, or schedule.

Arizona Talks Sparky uses this because its separate Events Management app
cannot upload media. Sparky creates the actual event and org-feed announcement
only after this helper returns a ready cover. Deploy this fork change before
the matching Sparky publisher. No token copying, database migration, new
endpoint, or new OAuth permission is needed.

Tests: `pnpm exec node --test tests/linkedin-event-cover.test.cjs`.
The test compiles the real TypeScript provider with network/base-class imports
stubbed; it does not access production or replace a full backend build.
