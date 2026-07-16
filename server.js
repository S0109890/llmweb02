import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Chat API
app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!r.ok) {
      const errorText = await r.text();
      console.error('Gemini API error:', r.status, errorText);
      throw new Error(`Gemini API error: ${r.status}`);
    }

    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    res.status(200).json({ text, raw: data });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to get response from Gemini' });
  }
});

// CCTV API
app.get('/api/cctv', async (req, res) => {
  try {
    const apiKey = process.env.DATA_GO_KR_KEY;
    const url = `https://apis.data.go.kr/6510000/riverCctvService/getRiverCctvList?serviceKey=${apiKey}&numOfRows=10&pageNo=1&type=json`;

    const r = await fetch(url);

    if (!r.ok) {
      const errorText = await r.text();
      console.error('Data.go.kr API error:', r.status, errorText);
      throw new Error(`Data.go.kr API error: ${r.status}`);
    }

    const data = await r.json();
    console.log('CCTV API Response:', JSON.stringify(data, null, 2));

    // 실제 응답 구조에 맞게 조정
    const cctvList = data?.response?.body?.items?.item || [];

    // 처음 2개만 선택
    const selectedCctvs = cctvList.slice(0, 2);

    res.status(200).json({
      cctvs: selectedCctvs,
      total: cctvList.length
    });
  } catch (error) {
    console.error('Error calling CCTV API:', error);
    res.status(500).json({ error: 'Failed to get CCTV data' });
  }
});

// Snowfall CCTV API
app.get('/api/snowfall-cctv', async (req, res) => {
  try {
    const apiKey = process.env.DATA_GO_KR_KEY;
    const url = `https://apis.data.go.kr/6510000/snowfallCctvService/getSnowfallCctvList?serviceKey=${apiKey}&numOfRows=10&pageNo=1&type=json`;

    const r = await fetch(url);

    if (!r.ok) {
      const errorText = await r.text();
      console.error('Snowfall CCTV API error:', r.status, errorText);
      throw new Error(`Snowfall CCTV API error: ${r.status}`);
    }

    const data = await r.json();
    console.log('Snowfall CCTV API Response:', JSON.stringify(data).substring(0, 500));

    // 실제 응답 구조에 맞게 조정
    const cctvList = data?.response?.body?.items?.item || [];

    // 첫 번째 CCTV만 선택 (한라산)
    const selectedCctv = cctvList[0] || null;

    res.status(200).json({
      cctv: selectedCctv,
      total: cctvList.length
    });
  } catch (error) {
    console.error('Error calling Snowfall CCTV API:', error);
    res.status(500).json({ error: 'Failed to get snowfall CCTV data' });
  }
});

// ITS CCTV API
app.get('/api/its-cctv', async (req, res) => {
  try {
    const apiKey = process.env.ITS_API_KEY;

    // 수도권 영역 좌표 (제주도에는 고속도로 CCTV가 없어서 수도권으로 변경)
    const params = new URLSearchParams({
      apiKey: apiKey,
      type: 'ex',
      cctvType: '1',
      minX: '126.5',
      maxX: '127.5',
      minY: '37.0',
      maxY: '37.8',
      getType: 'json'
    });

    const url = `https://openapi.its.go.kr:9443/cctvInfo?${params.toString()}`;

    const r = await fetch(url);

    if (!r.ok) {
      const errorText = await r.text();
      console.error('ITS API error:', r.status, errorText);
      throw new Error(`ITS API error: ${r.status}`);
    }

    const data = await r.json();
    console.log('ITS CCTV API Response:', JSON.stringify(data).substring(0, 500));

    const cctvList = data?.response?.data || [];
    const selectedCctv = cctvList[0] || null;

    res.status(200).json({
      cctv: selectedCctv,
      total: cctvList.length
    });
  } catch (error) {
    console.error('Error calling ITS CCTV API:', error);
    res.status(500).json({ error: 'Failed to get ITS CCTV data' });
  }
});

// CCTV Proxy
app.get('/api/cctv-proxy', async (req, res) => {
  const { url, base } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  let targetUrl = url;

  // URL이 상대 경로인 경우 base와 결합
  if (base && url && !url.startsWith('http')) {
    const baseUrl = new URL(base);
    targetUrl = new URL(url, baseUrl.origin + baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1)).href;
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
});

app.listen(PORT, () => {
  console.log(`🚀 Dev server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/chat`);
  console.log(`   - GET  http://localhost:${PORT}/api/cctv`);
  console.log(`   - GET  http://localhost:${PORT}/api/snowfall-cctv`);
  console.log(`   - GET  http://localhost:${PORT}/api/its-cctv`);
  console.log(`   - GET  http://localhost:${PORT}/api/cctv-proxy`);
});
