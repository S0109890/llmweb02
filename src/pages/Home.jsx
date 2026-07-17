import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Hls from 'hls.js'

function Home() {
  // Gemini Chat State
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([]) // [{role: 'user'|'ai', text: '...', color: '...'}]
  const [loading, setLoading] = useState(false)

  // CCTV State - 월파 감시 CCTV
  const [cctv, setCctv] = useState(null)
  const [cctvLoading, setCctvLoading] = useState(true)
  const videoRef = useRef(null)

  // 월파 감시 CCTV 데이터 가져오기
  useEffect(() => {
    async function fetchCctv() {
      const cached = localStorage.getItem('waveover_cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setCctv(data)
          setCctvLoading(false)
          return
        }
      }

      try {
        const r = await fetch('/api/waveover-cctv')
        const data = await r.json()
        setCctv(data.cctv)
        localStorage.setItem('waveover_cache', JSON.stringify({
          data: data.cctv,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.error('Failed to fetch waveover CCTV:', error)
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
    <div style={{ position: 'relative', minHeight: '100vh', padding: '0', paddingBottom: '80px', margin: '0' }}>
      {/* 나머지 CCTV 보기 버튼 - 오른쪽 위 작게 */}
      <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1001 }}>
        <Link to="/more-cctvs">
          <button style={{
            padding: '5px 10px',
            fontSize: '12px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            다른 CCTV
          </button>
        </Link>
      </div>

      {/* CCTV 영상만 - 제목/설명 제거 */}
      {cctvLoading ? (
        <p style={{ padding: '20px' }}>Loading...</p>
      ) : !cctv || !cctv.cctvUrl ? (
        <p style={{ padding: '20px' }}>CCTV를 불러올 수 없습니다.</p>
      ) : (
        <video
          ref={videoRef}
          controls
          muted
          playsInline
          style={{ width: '100%', height: '100vh', objectFit: 'cover', backgroundColor: '#000' }}
        />
      )}

      {/* AI 채팅 메시지 (줄 공책 스타일) */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '20px',
        right: '20px',
        maxHeight: '60vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
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
              wordWrap: 'break-word',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              fontWeight: msg.role === 'user' ? 'bold' : 'normal',
              pointerEvents: 'auto',
              alignSelf: 'flex-start',
              maxWidth: '90%'
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
