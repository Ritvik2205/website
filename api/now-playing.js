// Vercel function: proxies Ritvik's Spotify "currently playing" so visitors never log in.
// Env vars: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
// (mint the refresh token once with `node tools/spotify/get-refresh-token.js`).
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing';

async function getAccessToken(env) {
  const basic = Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: env.SPOTIFY_REFRESH_TOKEN }),
  });
  if (!res.ok) throw new Error(`spotify token ${res.status}`);
  return (await res.json()).access_token;
}

/** Spotify currently-playing payload → the small shape the site renders. */
export function toNowPlaying(data) {
  const item = data?.item;
  if (!data?.is_playing || item?.type !== 'track') return { isPlaying: false };
  return {
    isPlaying: true,
    title: item.name,
    artist: item.artists.map((a) => a.name).join(', '),
    album: item.album.name,
    art: item.album.images[0]?.url ?? null,
    url: item.external_urls?.spotify ?? null,
  };
}

export async function GET() {
  const headers = {
    'Content-Type': 'application/json',
    // Edge-cache briefly so every visitor doesn't hit Spotify.
    'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
  };
  try {
    const token = await getAccessToken(process.env);
    const res = await fetch(NOW_PLAYING_URL, { headers: { Authorization: `Bearer ${token}` } });
    // 204 = nothing playing.
    const data = res.status === 200 ? await res.json() : null;
    return new Response(JSON.stringify(toNowPlaying(data)), { headers });
  } catch {
    return new Response(JSON.stringify({ isPlaying: false }), { status: 502, headers });
  }
}
