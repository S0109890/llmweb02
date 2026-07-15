async function callGemini(prompt, apiKey, model = 'gemini-3.5-flash') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  console.log('Calling Gemini API:', model, 'URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    }),
  });

  console.log('Gemini API response status:', r.status);
  return r;
}

export default async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    let r = await callGemini(prompt, apiKey);

    // 503 에러 시 최대 3회 재시도 (exponential backoff)
    let retryCount = 0;
    const maxRetries = 3;

    while (r.status === 503 && retryCount < maxRetries) {
      retryCount++;
      const delay = Math.pow(2, retryCount) * 1000; // 2초, 4초, 8초
      console.log(`503 error, retry ${retryCount}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      r = await callGemini(prompt, apiKey);
    }

    if (!r.ok) {
      const errorText = await r.text();
      console.error('Gemini API error:', r.status, errorText);
      return res.status(r.status).json({
        error: `Gemini API error: ${r.status}`,
        details: errorText
      });
    }

    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!text) {
      console.log('No text in response:', JSON.stringify(data));
    }

    res.status(200).json({ text, raw: data });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({
      error: 'Failed to get response from Gemini',
      message: error.message
    });
  }
}
