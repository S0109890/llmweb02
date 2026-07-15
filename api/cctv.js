export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.DATA_GO_KR_KEY;
    const url = `https://apis.data.go.kr/6510000/riverCctvService/getRiverCctvList?serviceKey=${apiKey}&numOfRows=10&pageNo=1&type=json`;

    const r = await fetch(url);

    if (!r.ok) {
      throw new Error(`Data.go.kr API error: ${r.status}`);
    }

    const data = await r.json();

    // 실제 응답 구조에 맞게 조정 필요할 수 있음
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
}
