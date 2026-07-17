import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Hls from 'hls.js'

function Home() {
  // Gemini Chat State
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([]) // [{role: 'user'|'ai', text: '...', color: '...'}]
  const [loading, setLoading] = useState(false)

  // CCTV State - 2번째만 사용
  const [cctv, setCctv] = useState(null)
  const [cctvLoading, setCctvLoading] = useState(true)
  const videoRef = useRef(null)

  // 하천 CCTV 데이터 가져오기 (2번째만)
  useEffect(() => {
    async function fetchCctv() {
      const cached = localStorage.getItem('cctvs_cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setCctv(data[1] || null) // 2번째 CCTV
          setCctvLoading(false)
          return
        }
      }

      try {
        const r = await fetch('/api/cctv')
        const data = await r.json()
        const cctvs = data.cctvs || []
        setCctv(cctvs[1] || null) // 2번째 CCTV
        localStorage.setItem('cctvs_cache', JSON.stringify({
          data: cctvs,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.error('Failed to fetch CCTV data:', error)
      } finally {
        setCctvLoading(false)
      }
    }
    fetchCctv()
  }, [])

  // HLS 스트림 설정
  useEffect(() => {
    if (!cctv || !cctv.cctvUrl) return

    const video = videoRef.current
    const proxiedUrl = `/api/cctv-proxy?url=${encodeURIComponent(cctv.cctvUrl)}`

    if (video && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        startLevel: -1,
        capLevelToPlayerSize: true,
      })
      hls.loadSource(proxiedUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hls.levels.length > 0) {
          hls.currentLevel = 0
        }
        video.play().catch(err => console.log('Autoplay prevented:', err))
      })

      return () => {
        hls.destroy()
      }
    } else if (video && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxiedUrl
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => console.log('Autoplay prevented:', err))
      })
    }
  }, [cctv])

  // 랜덤 색상 생성
  function getRandomColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#AAB7B8',
      '#F1948A', '#85929E', '#A569BD', '#48C9B0', '#F39C12'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Gemini Chat 함수
  async function ask() {
    if (!prompt.trim()) return

    const userMessage = {
      role: 'user',
      text: prompt,
      color: getRandomColor()
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)
    const currentPrompt = prompt
    setPrompt('')

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt }),
      })
      const data = await r.json()
      const aiMessage = {
        role: 'ai',
        text: data.text || 'No response',
        color: getRandomColor()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Failed to get response:', error)
      const errorMessage = {
        role: 'ai',
        text: 'Error: Failed to get response from AI',
        color: '#E74C3C'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', padding: '20px', paddingBottom: '120px' }}>
      <h1>제주 하천 CCTV + AI 챗봇</h1>

      {/* 나머지 CCTV 보기 버튼 */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/more-cctvs">
          <button style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            나머지 CCTV 보기
          </button>
        </Link>
      </div>

      {/* CCTV 영상 섹션 */}
      <section style={{ marginBottom: '40px' }}>
        <h2>실시간 하천 CCTV</h2>
        {cctvLoading ? (
          <p>Loading CCTV data...</p>
        ) : !cctv ? (
          <p>CCTV 데이터를 불러올 수 없습니다.</p>
        ) : (
          <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
            <h3>{cctv.spotNm || 'CCTV'}</h3>
            <p>지점구분: {cctv.spotSe || 'N/A'}</p>
            <p>위치: {cctv.laCrdnt}, {cctv.loCrdnt}</p>
            {cctv.cctvUrl ? (
              <div>
                <video
                  ref={videoRef}
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
        )}
      </section>

      {/* AI 채팅 메시지 (벽돌쌓기 스타일) */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '20px',
        right: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: '10px',
        pointerEvents: 'none'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: msg.color,
              color: 'white',
              padding: '10px 15px',
              borderRadius: '8px',
              maxWidth: '300px',
              wordWrap: 'break-word',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              fontWeight: msg.role === 'user' ? 'bold' : 'normal',
              pointerEvents: 'auto'
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* AI 채팅 입력창 (제일 아래 고정) */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '2px solid #ddd',
        padding: '10px 20px',
        display: 'flex',
        gap: '10px',
        zIndex: 1000
      }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && ask()}
          placeholder="질문을 입력하세요..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <button
          onClick={ask}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {loading ? '처리 중...' : '전송'}
        </button>
      </div>
    </div>
  )
}

export default Home
