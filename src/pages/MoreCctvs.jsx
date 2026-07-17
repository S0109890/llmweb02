import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Hls from 'hls.js'

function MoreCctvs() {
  // CCTV State
  const [riverCctv, setRiverCctv] = useState(null) // 하천 1번째
  const [snowfallCctv, setSnowfallCctv] = useState(null)
  const [waveoverCctv, setWaveoverCctv] = useState(null)

  const [riverLoading, setRiverLoading] = useState(true)
  const [snowfallLoading, setSnowfallLoading] = useState(true)
  const [waveoverLoading, setWaveoverLoading] = useState(true)

  const riverVideoRef = useRef(null)
  const snowfallVideoRef = useRef(null)
  const waveoverVideoRef = useRef(null)

  // 하천 CCTV 1번째 가져오기
  useEffect(() => {
    async function fetchRiverCctv() {
      const cached = localStorage.getItem('cctvs_cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setRiverCctv(data[0] || null)
          setRiverLoading(false)
          return
        }
      }

      try {
        const r = await fetch('/api/cctv')
        const data = await r.json()
        const cctvs = data.cctvs || []
        setRiverCctv(cctvs[0] || null)
        localStorage.setItem('cctvs_cache', JSON.stringify({
          data: cctvs,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.error('Failed to fetch CCTV data:', error)
      } finally {
        setRiverLoading(false)
      }
    }
    fetchRiverCctv()
  }, [])

  // 한라산 적설 CCTV
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

  // 월파 감시 CCTV
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

  // HLS 스트림 설정 - 하천 CCTV
  useEffect(() => {
    if (!riverCctv || !riverCctv.cctvUrl) return

    const video = riverVideoRef.current
    const proxiedUrl = `/api/cctv-proxy?url=${encodeURIComponent(riverCctv.cctvUrl)}`

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
  }, [riverCctv])

  // HLS 스트림 설정 - 한라산 적설 CCTV
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

  // HLS 스트림 설정 - 월파 감시 CCTV
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

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>나머지 CCTV 영상</h1>

      {/* 홈으로 돌아가기 버튼 */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/">
          <button style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            ← 홈으로 돌아가기
          </button>
        </Link>
      </div>

      {/* 하천 CCTV 1번째 */}
      <section style={{ marginBottom: '40px' }}>
        <h2>하천 CCTV #1</h2>
        {riverLoading ? (
          <p>Loading...</p>
        ) : !riverCctv ? (
          <p>CCTV 데이터를 불러올 수 없습니다.</p>
        ) : (
          <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
            <h3>{riverCctv.spotNm || 'CCTV'}</h3>
            <p>지점구분: {riverCctv.spotSe || 'N/A'}</p>
            <p>위치: {riverCctv.laCrdnt}, {riverCctv.loCrdnt}</p>
            {riverCctv.cctvUrl ? (
              <div>
                <video
                  ref={riverVideoRef}
                  controls
                  muted
                  playsInline
                  style={{ width: '100%', height: '300px', borderRadius: '4px', backgroundColor: '#000' }}
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  영상이 보이지 않으면 <a href={riverCctv.cctvUrl} target="_blank" rel="noopener noreferrer">직접 링크</a>를 사용하세요
                </p>
              </div>
            ) : (
              <p>영상을 사용할 수 없습니다.</p>
            )}
          </div>
        )}
      </section>

      {/* 한라산 적설 CCTV */}
      <section style={{ marginBottom: '40px' }}>
        <h2>한라산 적설 CCTV</h2>
        {snowfallLoading ? (
          <p>Loading...</p>
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

      {/* 월파 감시 CCTV */}
      <section style={{ marginBottom: '40px' }}>
        <h2>해안 월파 감시 CCTV</h2>
        {waveoverLoading ? (
          <p>Loading...</p>
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
    </div>
  )
}

export default MoreCctvs
