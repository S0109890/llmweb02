// 서버 측 캐시 (10분간 유효)
let cachedData = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10분

export default async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 캐시 확인
  if (cachedData && Date.now() - cacheTimestamp < CACHE_TTL) {
    console.log('ITS CCTV: Returning cached data');
    return res.status(200).json(cachedData);
  }

  try {
    const apiKey = process.env.ITS_API_KEY;

    if (!apiKey) {
      console.error('ITS_API_KEY is not set');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // 수도권 영역 좌표 (제주도에는 고속도로 CCTV가 없어서 수도권으로 변경)
    const params = new URLSearchParams({
      apiKey: apiKey,
      type: 'ex', // 고속도로
      cctvType: '1', // 실시간 스트리밍 HLS
      minX: '126.5',
      maxX: '127.5',
      minY: '37.0',
      maxY: '37.8',
      getType: 'json'
    });

    const url = `https://openapi.its.go.kr:9443/cctvInfo?${params.toString()}`;

    // 30초 타임아웃 설정 (ITS API가 느릴 수 있음)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      var r = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!r.ok) {
      const errorText = await r.text();
      console.error('ITS API error:', r.status, errorText);
      return res.status(r.status).json({
        error: `ITS API error: ${r.status}`,
        details: errorText
      });
    }

    const data = await r.json();
    console.log('ITS CCTV API Response:', JSON.stringify(data).substring(0, 500));

    // API 응답 구조에 맞게 파싱
    const cctvList = data?.response?.data || [];

    // 첫 번째 CCTV 선택
    const selectedCctv = cctvList[0] || null;

    const result = {
      cctv: selectedCctv,
      total: cctvList.length
    };

    // 캐시 저장
    cachedData = result;
    cacheTimestamp = Date.now();

    res.status(200).json(result);
  } catch (error) {
    console.error('Error calling ITS CCTV API:', error);
    res.status(500).json({
      error: 'Failed to get ITS CCTV data',
      message: error.message
    });
  }
}
