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

app.listen(PORT, () => {
  console.log(`🚀 Dev server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/chat`);
  console.log(`   - GET  http://localhost:${PORT}/api/cctv`);
});
