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

  try {
    const apiKey = process.env.DATA_GO_KR_KEY;

    if (!apiKey) {
      console.error('DATA_GO_KR_KEY is not set');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const url = `https://apis.data.go.kr/6510000/waveoverCctvInfoService/getWaveoverCctvList?serviceKey=${apiKey}&numOfRows=10&pageNo=1&type=json`;

    const r = await fetch(url);

    if (!r.ok) {
      const errorText = await r.text();
      console.error('Waveover CCTV API error:', r.status, errorText);
      return res.status(r.status).json({
        error: `Waveover CCTV API error: ${r.status}`,
        details: errorText
      });
    }

    const data = await r.json();
    console.log('Waveover CCTV API Response:', JSON.stringify(data).substring(0, 500));

    // 실제 응답 구조에 맞게 조정 (하천/적설 CCTV와 동일한 패턴)
    const cctvList = data?.response?.body?.items?.item || [];

    // 첫 번째 CCTV만 선택
    const selectedCctv = cctvList[0] || null;

    res.status(200).json({
      cctv: selectedCctv,
      total: cctvList.length
    });
  } catch (error) {
    console.error('Error calling Waveover CCTV API:', error);
    res.status(500).json({
      error: 'Failed to get waveover CCTV data',
      message: error.message
    });
  }
}
