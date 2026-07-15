import { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'
import './App.css'

function App() {
  // Gemini Chat State
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  // CCTV State
  const [cctvs, setCctvs] = useState([])
  const [cctvLoading, setCctvLoading] = useState(true)
  const videoRefs = useRef([])

  // CCTV 데이터 가져오기
  useEffect(() => {
    async function fetchCctvs() {
      try {
        const r = await fetch('/api/cctv')
        const data = await r.json()
        setCctvs(data.cctvs || [])
      } catch (error) {
        console.error('Failed to fetch CCTV data:', error)
      } finally {
        setCctvLoading(false)
      }
    }
    fetchCctvs()
  }, [])

  // HLS 스트림 설정
  useEffect(() => {
    if (cctvs.length === 0) return

    const hlsInstances = []

    cctvs.slice(0, 2).forEach((cctv, idx) => {
      const video = videoRefs.current[idx]
      const proxiedUrl = `/api/cctv-proxy?url=${encodeURIComponent(cctv.cctvUrl)}`

      if (video && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        })
        hls.loadSource(proxiedUrl)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => console.log('Autoplay prevented:', err))
        })
        hlsInstances.push(hls)
      } else if (video && video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native support
        video.src = proxiedUrl
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(err => console.log('Autoplay prevented:', err))
        })
      }
    })

    return () => {
      hlsInstances.forEach(hls => hls.destroy())
    }
  }, [cctvs])

  // Gemini Chat 함수
  async function ask() {
    if (!prompt.trim()) return

    setLoading(true)
    setResponse('')

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await r.json()
      setResponse(data.text || 'No response')
    } catch (error) {
      console.error('Failed to get response:', error)
      setResponse('Error: Failed to get response from AI')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>제주 하천 CCTV + AI 챗봇</h1>

      {/* CCTV 영상 섹션 */}
      <section style={{ marginBottom: '40px' }}>
        <h2>실시간 하천 CCTV 영상</h2>
        {cctvLoading ? (
          <p>Loading CCTV data...</p>
        ) : cctvs.length === 0 ? (
          <p>CCTV 데이터를 불러올 수 없습니다.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {cctvs.slice(0, 2).map((cctv, idx) => (
              <div key={idx} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
                <h3>{cctv.spotNm || `CCTV ${idx + 1}`}</h3>
                <p>지점구분: {cctv.spotSe || 'N/A'}</p>
                <p>위치: {cctv.laCrdnt}, {cctv.loCrdnt}</p>
                {cctv.cctvUrl ? (
                  <div>
                    <video
                      ref={el => videoRefs.current[idx] = el}
                      controls
                      muted
                      playsInline
                      style={{ width: '100%', height: '300px', borderRadius: '4px', backgroundColor: '#000' }}
                    />
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      영상이 보이지 않으면 <a href={cctv.cctvUrl} target="_blank" rel="noopener noreferrer">직접 링크</a>를 사용하세요
                    </p>
                  </div>
                ) : (
                  <p>영상을 사용할 수 없습니다.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Gemini 챗봇 섹션 */}
      <section>
        <h2>AI 챗봇 (Gemini)</h2>
        <div style={{ marginBottom: '20px' }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="질문을 입력하세요..."
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
          <button
            onClick={ask}
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {loading ? '처리 중...' : '질문하기'}
          </button>
        </div>

        {response && (
          <div style={{
            padding: '15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            border: '1px solid #ddd',
            whiteSpace: 'pre-wrap'
          }}>
            <h3>AI 응답:</h3>
            <p>{response}</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default App
