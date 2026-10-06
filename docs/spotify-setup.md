# Spotify now-playing setup

The vinyl record's label shows the album art of whatever is playing on Ritvik's Spotify account. When nothing is playing, or the live endpoint is unavailable (for example under `npm run dev`), it shows the cover of the playlist in `src/content/site.json` → `spotify.playlistId`. Visitors never log in to Spotify.

## How it fits together

| Piece | Role |
|---|---|
| `api/now-playing.js` | Vercel function. Trades the stored refresh token for an access token, calls `GET /v1/me/player/currently-playing`, returns `{ isPlaying, title, artist, album, art, url }`. Edge-cached for 15s (`s-maxage=15, stale-while-revalidate=30`). |
| `src/content/spotify.js` | Browser side. Polls `/api/now-playing` every 30s while the tab is visible; falls back to the playlist cover via Spotify's public oEmbed endpoint. |
| `src/scene/vinyl.js` | `setRecord({ art })` puts the cover on a disc laid over the record's `Hub` mesh. |
| `tools/spotify/get-refresh-token.js` | One-time local script that mints the refresh token. |
| `tests/spotify.test.js` | Covers payload shaping and the fallback path. |

## One-time registration

1. **Create a Spotify app.** Go to https://developer.spotify.com/dashboard → *Create app*.
   - App name/description: anything (e.g. "portfolio now playing").
   - Redirect URI: `http://127.0.0.1:8888/callback` (exactly; Spotify no longer accepts `localhost`).
   - APIs used: tick *Web API*.
   - Save, open the app's *Settings*, and copy the **Client ID** and **Client secret**.
2. **Mint a refresh token** from the `portfolio/` directory:
   ```bash
   SPOTIFY_CLIENT_ID=<client id> SPOTIFY_CLIENT_SECRET=<client secret> \
     node tools/spotify/get-refresh-token.js
   ```
   Open the printed URL, log in as the account whose listening should show, and approve the `user-read-currently-playing` scope. The terminal prints `SPOTIFY_REFRESH_TOKEN=…`.
3. **Add environment variables in Vercel.** Project → *Settings* → *Environment Variables*, for Production (and Preview if wanted):
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REFRESH_TOKEN`
4. **Redeploy** so the function picks up the variables.

Never commit these values; they live only in Vercel and your shell.

## Verify

- `curl https://<your-domain>/api/now-playing` while music plays → `{"isPlaying":true,…,"art":"https://i.scdn.co/…"}`; when paused → `{"isPlaying":false}`.
- On the site, the record label switches to the album art within ~30s of a track change.

## Troubleshooting

- **`INVALID_CLIENT: Invalid redirect URI`** during step 2: the dashboard redirect URI must match `http://127.0.0.1:8888/callback` character for character.
- **Endpoint returns 502:** an env var is missing or the refresh token was revoked (e.g. you removed the app's access in your Spotify account). Re-run step 2 and update `SPOTIFY_REFRESH_TOKEN`.
- **Always `isPlaying: false`:** the endpoint only reports tracks (not podcasts), and private sessions hide playback.
- **Label shows the playlist cover locally:** expected under `npm run dev`; Vite does not run Vercel functions. Use `vercel dev` to exercise the live path.
