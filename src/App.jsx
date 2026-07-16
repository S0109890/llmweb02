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
  const [snowfallCctv, setSnowfallCctv] = useState(null)
  const [snowfallLoading, setSnowfallLoading] = useState(true)
  const [waveoverCctv, setWaveoverCctv] = useState(null)
  const [waveoverLoading, setWaveoverLoading] = useState(true)
  const videoRefs = useRef([])
  const snowfallVideoRef = useRef(null)
  const waveoverVideoRef = useRef(null)

  // 하천 CCTV 데이터 가져오기 (캐싱: 5분간 유효)
  useEffect(() => {
    async function fetchCctvs() {
      // 로컬스토리지 캐시 확인
      const cached = localStorage.getItem('cctvs_cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < 5 * 60 * 1000) { // 5분
          setCctvs(data)
          setCctvLoading(false)
          return
        }
      }

      try {
        const r = await fetch('/api/cctv')
        const data = await r.json()
        setCctvs(data.cctvs || [])
        // 캐시 저장
        localStorage.setItem('cctvs_cache', JSON.stringify({
          data: data.cctvs || [],
          timestamp: Date.now()
        }))
      } catch (error) {
        console.error('Failed to fetch CCTV data:', error)
      } finally {
        setCctvLoading(false)
      }
    }
    fetchCctvs()
  }, [])

  // 한라산 적설 CCTV 데이터 가져오기 (캐싱: 5분간 유효)
  useEffect(() => {
    async function fetchSnowfallCctv() {
      const cached = localStorage.getItem('snowfall_cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setSnowfallCctv(data)
          setSnowfallLoading(false)
          return
        }
      }

      try {
        const r = await fetch('/api/snowfall-cctv')
        const data = await r.json()
        setSnowfallCctv(data.cctv)
        localStorage.setItem('snowfall_cache', JSON.stringify({
          data: data.cctv,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.error('Failed to fetch snowfall CCTV:', error)
      } finally {
        setSnowfallLoading(false)
      }
    }
    fetchSnowfallCctv()
  }, [])

  // 월파 감시 CCTV 데이터 가져오기 (캐싱: 5분간 유효)
  useEffect(() => {
    async function fetchWaveoverCctv() {
      const cached = localStorage.getItem('waveover_cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setWaveoverCctv(data)
          setWaveoverLoading(false)
          return
        }
      }

      try {
        const r = await fetch('/api/waveover-cctv')
        const data = await r.json()
        setWaveoverCctv(data.cctv)
        localStorage.setItem('waveover_cache', JSON.stringify({
          data: data.cctv,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.error('Failed to fetch waveover CCTV:', error)
      } finally {
        setWaveoverLoading(false)
      }
    }
    fetchWaveoverCctv()
  }, [])

  // HLS 스트림 설정 (하천 CCTV)
  useEffect(() => {
    if (cctvs.length === 0) return

    const hlsInstances = []

    cctvs.slice(0, 2).forEach((cctv, idx) => {
      const video = videoRefs.current[idx]
      const proxiedUrl = `/api/cctv-proxy?url=${encodeURIComponent(cctv.cctvUrl)}`

      if (video && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false, // 저지연 모드 끄기 (트래픽 절약)
          maxBufferLength: 10, // 버퍼 길이 줄이기 (기본 30초 → 10초)
          maxMaxBufferLength: 20, // 최대 버퍼 줄이기
          startLevel: -1, // 최저 품질로 시작
          capLevelToPlayerSize: true, // 플레이어 크기에 맞춰 품질 제한
        })
        hls.loadSource(proxiedUrl)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // 최저 품질로 강제 설정
          if (hls.levels.length > 0) {
            hls.currentLevel = 0 // 첫 번째(최저) 품질
          }
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

  // HLS 스트림 설정 (한라산 적설 CCTV)
  useEffect(() => {
    if (!snowfallCctv || !snowfallCctv.cctvUrl) return

    const video = snowfallVideoRef.current
    const proxiedUrl = `/api/cctv-proxy?url=${encodeURIComponent(snowfallCctv.cctvUrl)}`

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
  }, [snowfallCctv])

  // HLS 스트림 설정 (월파 감시 CCTV)
  useEffect(() => {
    if (!waveoverCctv || !waveoverCctv.cctvUrl) return

    const video = waveoverVideoRef.current
    const proxiedUrl = `/api/cctv-proxy?url=${encodeURIComponent(waveoverCctv.cctvUrl)}`

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
  }, [waveoverCctv])

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

      {/* 한라산 적설 CCTV 섹션 */}
      <section style={{ marginBottom: '40px' }}>
        <h2>한라산 적설 CCTV</h2>
        {snowfallLoading ? (
          <p>Loading snowfall CCTV data...</p>
        ) : !snowfallCctv ? (
          <p>한라산 CCTV 데이터를 불러올 수 없습니다.</p>
        ) : (
          <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
            <h3>{snowfallCctv.spotNm || '한라산 CCTV'}</h3>
            <p>지점구분: {snowfallCctv.spotSe || 'N/A'}</p>
            <p>위치: {snowfallCctv.laCrdnt}, {snowfallCctv.loCrdnt}</p>
            {snowfallCctv.cctvUrl ? (
              <div>
                <video
                  ref={snowfallVideoRef}
                  controls
                  muted
                  playsInline
                  style={{ width: '100%', height: '400px', borderRadius: '4px', backgroundColor: '#000' }}
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  영상이 보이지 않으면 <a href={snowfallCctv.cctvUrl} target="_blank" rel="noopener noreferrer">직접 링크</a>를 사용하세요
                </p>
              </div>
            ) : (
              <p>영상을 사용할 수 없습니다.</p>
            )}
          </div>
        )}
      </section>

      {/* 월파 감시 CCTV 섹션 */}
      <section style={{ marginBottom: '40px' }}>
        <h2>해안 월파 감시 CCTV</h2>
        {waveoverLoading ? (
          <p>Loading waveover CCTV data...</p>
        ) : !waveoverCctv ? (
          <p>월파 CCTV 데이터를 불러올 수 없습니다.</p>
        ) : (
          <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
            <h3>{waveoverCctv.spotNm || '월파 감시 CCTV'}</h3>
            <p>지점구분: {waveoverCctv.spotSe || 'N/A'}</p>
            <p>위치: {waveoverCctv.laCrdnt}, {waveoverCctv.loCrdnt}</p>
            {waveoverCctv.cctvUrl ? (
              <div>
                <video
                  ref={waveoverVideoRef}
                  controls
                  muted
                  playsInline
                  style={{ width: '100%', height: '400px', borderRadius: '4px', backgroundColor: '#000' }}
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  영상이 보이지 않으면 <a href={waveoverCctv.cctvUrl} target="_blank" rel="noopener noreferrer">직접 링크</a>를 사용하세요
                </p>
              </div>
            ) : (
              <p>영상을 사용할 수 없습니다.</p>
            )}
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
