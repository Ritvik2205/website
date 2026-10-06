import { describe, it, expect, vi } from 'vitest';
import { toNowPlaying } from '../api/now-playing.js';
import { fetchNowPlaying } from '../src/content/spotify.js';

const track = {
  is_playing: true,
  item: {
    type: 'track',
    name: 'Song',
    artists: [{ name: 'A' }, { name: 'B' }],
    album: { name: 'Album', images: [{ url: 'https://i.scdn.co/big' }, { url: 'https://i.scdn.co/small' }] },
    external_urls: { spotify: 'https://open.spotify.com/track/1' },
  },
};

const json = (body, ok = true) => ({ ok, json: async () => body });

describe('now playing', () => {
  it('normalizes a playing track and treats paused/empty as not playing', () => {
    expect(toNowPlaying(track)).toEqual({
      isPlaying: true, title: 'Song', artist: 'A, B', album: 'Album',
      art: 'https://i.scdn.co/big', url: 'https://open.spotify.com/track/1',
    });
    expect(toNowPlaying({ ...track, is_playing: false })).toEqual({ isPlaying: false });
    expect(toNowPlaying(null)).toEqual({ isPlaying: false });
  });

  it('prefers the live track, else falls back to the playlist cover', async () => {
    const live = { isPlaying: true, art: 'https://i.scdn.co/big' };
    expect(await fetchNowPlaying({ playlistId: 'p' }, vi.fn(async () => json(live)))).toEqual(live);

    const fetchImpl = vi.fn(async (url) => (url.startsWith('/api')
      ? json({ isPlaying: false })
      : json({ title: 'Mix', thumbnail_url: 'https://i.scdn.co/mix' })));
    expect(await fetchNowPlaying({ playlistId: 'p' }, fetchImpl)).toEqual({
      isPlaying: false, title: 'Mix', artist: '', art: 'https://i.scdn.co/mix',
      url: 'https://open.spotify.com/playlist/p',
    });
  });
});
