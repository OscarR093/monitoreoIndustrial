import { useState, useEffect, useRef } from 'react'

const API_URL = 'http://localhost:5000'

function App() {
  const [plantas, setPlantas] = useState([])
  const [areas, setAreas] = useState([])
  const [sensores, setSensores] = useState([])
  const [selectedPlanta, setSelectedPlanta] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [realtimeData, setRealtimeData] = useState({})
  const [history, setHistory] = useState({})
  const [wsConnected, setWsConnected] = useState(false)
  const wsRef = useRef(null)
  const canvasRef = useRef({})

  useEffect(() => {
    fetchPlantas()
  }, [])

  useEffect(() => {
    if (selectedPlanta) {
      fetchAreas(selectedPlanta)
    } else {
      setAreas([])
      setSelectedArea('')
    }
  }, [selectedPlanta])

  useEffect(() => {
    if (selectedArea) {
      fetchSensoresAndHistory(selectedArea)
    } else {
      setSensores([])
      setRealtimeData({})
      setHistory({})
    }
  }, [selectedArea])

  useEffect(() => {
    Object.keys(history).forEach(sensorId => {
      drawSensorChart(sensorId, history[sensorId])
    })
  }, [history])

  async function fetchPlantas() {
    const res = await fetch(`${API_URL}/api/plantas`)
    const data = await res.json()
    setPlantas(data)
  }

  async function fetchAreas(plantaCodigo) {
    const res = await fetch(`${API_URL}/api/areas?planta=${plantaCodigo}`)
    const data = await res.json()
    setAreas(data)
  }

  async function fetchSensoresAndHistory(areaCodigo) {
    console.log('Fetching sensores for area:', areaCodigo)
    const res = await fetch(`${API_URL}/api/sensores?area=${areaCodigo}`)
    const data = await res.json()
    console.log('Sensores:', data)
    setSensores(data)

    const histRes = await fetch(`${API_URL}/api/datos?area=${areaCodigo}&limit=50`)
    const histData = await histRes.json()
    console.log('History raw:', histData)

    const historyBySensor = {}
    histData.forEach(d => {
      const sensorId = d.sensor?.sensorId || 's' + d.sensorId
      if (!historyBySensor[sensorId]) {
        historyBySensor[sensorId] = []
      }
      historyBySensor[sensorId].push({
        valor: d.valor,
        timestamp: d.timestamp
      })
    })
    console.log('History grouped:', historyBySensor)
    setHistory(historyBySensor)
  }

  function drawSensorChart(sensorId, data) {
    const canvas = canvasRef.current[sensorId]
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, width, height)

    if (!data || data.length < 2) {
      ctx.fillStyle = '#666'
      ctx.font = '14px monospace'
      ctx.fillText('Sin datos', 10, height / 2)
      return
    }

    const values = data.map(d => Number(d.valor))
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const paddedRange = range * 0.1
    const yMin = min - paddedRange
    const yMax = max + paddedRange

    ctx.strokeStyle = '#0f0'
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((dato, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((Number(dato.valor) - yMin) / (yMax - yMin)) * height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    const lastValue = data[data.length - 1]?.valor?.toFixed(2) || '--'
    ctx.fillStyle = '#0f0'
    ctx.font = 'bold 14px monospace'
    ctx.fillText(lastValue, width - 70, 20)
  }

  function connectWebSocket() {
    if (!selectedPlanta || !selectedArea) {
      alert('Selecciona planta y area primero')
      return
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close()
    }

    const ws = new WebSocket(`ws://${API_URL.replace('http://', '')}/ws/realtime?planta=${selectedPlanta}&area=${selectedArea}`)

    ws.onopen = () => {
      setWsConnected(true)
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      const datos = JSON.parse(event.data)
      console.log('WebSocket received:', datos)
      if (Array.isArray(datos)) {
        datos.forEach(dato => {
          setRealtimeData(prev => ({ ...prev, [dato.sensor]: dato }))
          setHistory(prev => ({
            ...prev,
            [dato.sensor]: [...(prev[dato.sensor] || []).slice(-50), dato]
          }))
        })
      }
    }

    ws.onclose = () => {
      setWsConnected(false)
      console.log('WebSocket disconnected')
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }

    wsRef.current = ws
  }

  function disconnectWebSocket() {
    wsRef.current?.close()
    setWsConnected(false)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#111', color: '#eee', minHeight: '100vh' }}>
      <h1 style={{ color: '#0f0' }}>Monitoreo Industrial</h1>

      <div style={{ marginBottom: '20px' }}>
        <h3>1. Planta</h3>
        <select value={selectedPlanta} onChange={e => setSelectedPlanta(e.target.value)} style={{ padding: '5px', backgroundColor: '#222', color: '#fff', border: '1px solid #444' }}>
          <option value="">-- Seleccionar --</option>
          {plantas.map(p => (
            <option key={p.id} value={p.codigo}>{p.nombre} ({p.codigo})</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>2. Area</h3>
        <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} disabled={!selectedPlanta} style={{ padding: '5px', backgroundColor: '#222', color: '#fff', border: '1px solid #444' }}>
          <option value="">-- Seleccionar --</option>
          {areas.map(a => (
            <option key={a.id} value={a.codigo}>{a.nombre} ({a.codigo})</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>3. Sensores en Tiempo Real</h3>
        <button onClick={wsConnected ? disconnectWebSocket : connectWebSocket} style={{ padding: '10px 20px', backgroundColor: wsConnected ? '#f00' : '#0f0', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          {wsConnected ? 'DESCONECTAR' : 'CONECTAR'}
        </button>
        <p style={{ color: wsConnected ? '#0f0' : '#f00' }}>Estado: {wsConnected ? 'CONECTADO' : 'DESCONECTADO'}</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {sensores.map(sensor => (
          <div key={sensor.id} style={{ border: '1px solid #333', padding: '10px', backgroundColor: '#000' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0ff' }}>{sensor.nombre} ({sensor.sensorId})</h4>
            <canvas
              ref={el => canvasRef.current[sensor.sensorId] = el}
              width={300}
              height={100}
              style={{ display: 'block' }}
            />
            <div style={{ marginTop: '5px', fontSize: '12px', color: '#888' }}>
              {sensor.unidad?.simbolo || '?'}
            </div>
          </div>
        ))}
      </div>

      {sensores.length === 0 && (
        <p style={{ color: '#666' }}>Selecciona una planta y area para ver los sensores</p>
      )}
    </div>
  )
}

export default App