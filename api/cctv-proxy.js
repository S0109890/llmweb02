export default async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, base } = req.query;

  if (!url && !base) {
    return res.status(400).json({ error: 'URL or base parameter required' });
  }

  let targetUrl = url;

  // base가 있으면 상대 경로 처리
  if (base && !url) {
    return res.status(400).json({ error: 'URL required when using base' });
  }

  // URL이 상대 경로인 경우 base와 결합
  if (base && url && !url.startsWith('http')) {
    const baseUrl = new URL(base);
    targetUrl = new URL(url, baseUrl.origin + baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1)).href;
  }

  // HTTP/HTTPS URL만 허용
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const response = await fetch(targetUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'application/vnd.apple.mpegurl';

    // .m3u8 파일인 경우 내용을 수정하여 프록시 경로로 변환
    if (targetUrl.endsWith('.m3u8') || contentType.includes('mpegurl')) {
      let content = await response.text();

      // 상대 경로를 프록시 경로로 변환
      content = content.replace(
        /(chunklist_[^\s]+\.m3u8)/g,
        (match) => `/api/cctv-proxy?url=${encodeURIComponent(match)}&base=${encodeURIComponent(targetUrl)}`
      );

      // .ts 세그먼트 파일도 프록시 경로로 변환
      content = content.replace(
        /([^\s]+\.ts)/g,
        (match) => {
          if (match.startsWith('http')) return match;
          return `/api/cctv-proxy?url=${encodeURIComponent(match)}&base=${encodeURIComponent(targetUrl)}`;
        }
      );

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(content);
    } else {
      // 일반 파일 (비디오 세그먼트 등)
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=60');

      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (error) {
    console.error('Proxy error:', error, 'URL:', targetUrl);
    res.status(500).json({
      error: 'Failed to proxy request',
      message: error.message,
      url: targetUrl
    });
  }
}
