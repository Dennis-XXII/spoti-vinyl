# Spoti Vinyl

A Spotify-powered web player with a Teenage Engineering-inspired vinyl deck UI.

## What It Does

- Authenticates users with Spotify OAuth (PKCE).
- Loads Spotify Web Playback SDK and transfers playback to the browser device.
- Plays from:
  - your saved albums (via album picker),
  - your liked songs collection (via `Shuffle` button).
- Provides deck controls:
  - `Prev`, `Next`, `Play/Pause`, progress seek, volume.
- Mobile interaction:
  - vinyl scratch/drag to seek forward or backward,
  - `Prev/Next` shown under the disc,
  - `Rewind/FF` hidden on mobile.

## Tech Stack

- React 19
- Vite 7
- Tailwind CSS 4
- Framer Motion
- Spotify Web API + Spotify Web Playback SDK

## Project Structure

- `/Users/kyawswarhein/Personal/spoti-vinyl/client` - React app
- `/Users/kyawswarhein/Personal/spoti-vinyl/client/src/components/VinylPlayer.jsx` - main player deck
- `/Users/kyawswarhein/Personal/spoti-vinyl/client/src/components/AlbumSelector.jsx` - album browser/search/pagination
- `/Users/kyawswarhein/Personal/spoti-vinyl/client/src/spotify.js` - OAuth + token refresh helpers

## Prerequisites

- Node.js 18+
- npm
- Spotify Premium account (required for Web Playback SDK)
- Spotify Developer app configured at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

## Spotify App Setup

In your Spotify app settings, add your local callback URL (example):

- `http://127.0.0.1:5173`

Make sure it matches `VITE_SPOTIFY_REDIRECT_URI` exactly.

## Environment Variables

Create `client/.env`:

```bash
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173
```

## Required Spotify Scopes

The app requests:

- `streaming`
- `user-read-email`
- `user-read-private`
- `user-modify-playback-state`
- `user-read-playback-state`
- `user-library-read`

## Run Locally

```bash
cd /Users/kyawswarhein/Personal/spoti-vinyl/client
npm install
npm run dev
```

Open the local URL printed by Vite, then log in with Spotify.

## Scripts

From `/Users/kyawswarhein/Personal/spoti-vinyl/client`:

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## Controls Summary

### Top Buttons

- `Shuffle` (top-left): enables Spotify shuffle mode and starts liked songs (`spotify:collection`) immediately.
- `Hide/Show Albums` (top-right): toggles album picker panel.

### Deck Controls

- Center label click: toggle play/pause.
- `Prev` / `Next`: previous/next track.
- Progress bar: seek to clicked position.
- Volume slider: set playback volume.

### Mobile Behavior

- Vinyl disc drag is enabled only on mobile for scratch-style seeking.
- Desktop drag is disabled.

## Notes

- If playback fails, verify:
  - Spotify Premium account,
  - correct redirect URI,
  - browser autoplay/device restrictions,
  - valid Spotify authorization scopes.
