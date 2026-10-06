// Now-playing record for the vinyl: live track from the Vercel function, else the
// site playlist's cover via Spotify oEmbed (public, CORS-enabled, no login).
const NOW_PLAYING_URL = '/api/now-playing';

let fallback = null;

function fetchFallback(spotify, fetchImpl) {
  const url = `https://open.spotify.com/playlist/${spotify.playlistId}`;
  fallback ??= fetchImpl(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`oembed ${res.status}`))))
    .then((o) => ({ isPlaying: false, title: o.title, artist: '', art: o.thumbnail_url, url }))
    .catch((err) => { fallback = null; throw err; });
  return fallback;
}

/** Resolves `{ isPlaying, title, artist, art, url }`, or null when nothing is reachable. */
export async function fetchNowPlaying(spotify, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(NOW_PLAYING_URL);
    // Vite dev serves index.html here, so a non-JSON body just falls through.
    const np = res.ok ? await res.json() : null;
    if (np?.isPlaying && np.art) return np;
  } catch { /* function not deployed */ }
  return fetchFallback(spotify, fetchImpl).catch(() => null);
}

/** Polls and calls `onChange` whenever the record art changes. Returns a stop function. */
export function watchNowPlaying(spotify, onChange, intervalMs = 30_000) {
  let lastArt = null;
  const tick = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const np = await fetchNowPlaying(spotify);
    if (np && np.art !== lastArt) {
      lastArt = np.art;
      onChange(np);
    }
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  return () => clearInterval(timer);
}
