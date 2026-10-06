// One-time: mint the SPOTIFY_REFRESH_TOKEN for api/now-playing.js.
// 1. Create an app at https://developer.spotify.com/dashboard (Web API) and add the
//    redirect URI http://127.0.0.1:8888/callback.
// 2. SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... node tools/spotify/get-refresh-token.js
// 3. Open the printed URL, log in as yourself, approve; the refresh token prints here.
import http from 'node:http';

const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) {
  console.error('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET first.');
  process.exit(1);
}

const redirectUri = 'http://127.0.0.1:8888/callback';
const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
  client_id: id,
  response_type: 'code',
  redirect_uri: redirectUri,
  scope: 'user-read-currently-playing',
})}`;

const server = http.createServer(async (req, res) => {
  const code = new URL(req.url, redirectUri).searchParams.get('code');
  if (!code) { res.end('No code.'); return; }
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
  });
  const body = await tokenRes.json();
  res.end(body.refresh_token ? 'Done — check your terminal.' : 'Failed — check your terminal.');
  console.log(body.refresh_token ? `\nSPOTIFY_REFRESH_TOKEN=${body.refresh_token}\n` : body);
  server.close();
});

server.listen(8888, '127.0.0.1', () => console.log(`Open:\n${authUrl}`));
