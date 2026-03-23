// YouTube search using Invidious public API (no backend needed)
const INVIDIOUS_INSTANCES = [
  'https://vid.puffyan.us',
  'https://invidious.fdn.fr',
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
];

let currentInstance = 0;

async function fetchWithFallback(path) {
  for (let i = 0; i < INVIDIOUS_INSTANCES.length; i++) {
    const instance = INVIDIOUS_INSTANCES[(currentInstance + i) % INVIDIOUS_INSTANCES.length];
    try {
      const res = await fetch(`${instance}${path}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        currentInstance = (currentInstance + i) % INVIDIOUS_INSTANCES.length;
        return await res.json();
      }
    } catch (e) {
      continue;
    }
  }
  throw new Error('All API instances are down. Try again later.');
}

export async function searchYouTube(query) {
  const data = await fetchWithFallback(
    `/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`
  );

  return data
    .filter(item => item.type === 'video')
    .slice(0, 10)
    .map(item => ({
      id: item.videoId,
      title: item.title,
      channel: item.author,
      duration: formatDuration(item.lengthSeconds),
      thumbnail: item.videoThumbnails?.find(t => t.quality === 'medium')?.url
        || item.videoThumbnails?.[0]?.url
        || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${item.videoId}`,
    }));
}

export async function getAudioStream(videoId) {
  try {
    const data = await fetchWithFallback(`/api/v1/videos/${videoId}`);

    // Find best audio-only stream
    const audioFormats = (data.adaptiveFormats || [])
      .filter(f => f.type?.startsWith('audio/'))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    if (audioFormats.length > 0) {
      return {
        url: audioFormats[0].url,
        type: audioFormats[0].type,
        title: data.title,
        author: data.author,
      };
    }

    // Fallback to format streams
    if (data.formatStreams?.length > 0) {
      return {
        url: data.formatStreams[0].url,
        type: data.formatStreams[0].type,
        title: data.title,
        author: data.author,
      };
    }

    return null;
  } catch (e) {
    console.error('Failed to get audio stream:', e);
    return null;
  }
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
