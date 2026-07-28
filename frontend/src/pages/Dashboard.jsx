import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { api, getWsUrl } from '../services/api';
import { groupSensorsByZone } from '../services/sensorZones';
import NavigationBar from '../components/NavigationBar';
import LocationSelector from '../components/LocationSelector';
import SensorZone from '../components/SensorZone';

export default function Dashboard() {
  const [plantas, setPlantas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [sensores, setSensores] = useState([]);
  const [selectedPlanta, setSelectedPlanta] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [realtimeData, setRealtimeData] = useState({});
  const [lastSeen, setLastSeen] = useState({});
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const reconnectCount = useRef(0);
  const [expandAll, setExpandAll] = useState(0);
  const [collapseAll, setCollapseAll] = useState(0);

  useEffect(() => {
    api.get('/api/plantas')
      .then((data) => {
        setPlantas(data);
        setSelectedPlanta((prev) => {
          if (data.length > 0 && !prev) return data[0].codigo;
          return prev;
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedPlanta) { setAreas([]); return; }
    api.get(`/api/areas?planta=${selectedPlanta}`)
      .then((data) => {
        setAreas(data);
        if (data.length > 0 && !selectedArea) {
          setSelectedArea(data[0].codigo);
        }
      })
      .catch(() => {});
  }, [selectedPlanta]);

  useEffect(() => {
    if (!selectedPlanta || !selectedArea) { setSensores([]); return; }
    api.get(`/api/sensores?planta=${selectedPlanta}&area=${selectedArea}`).then(setSensores).catch(() => {});
  }, [selectedPlanta, selectedArea]);

  const handlePlantaChange = useCallback((p) => {
    setSelectedPlanta(p);
    setSelectedArea('');
    setSensores([]);
    setRealtimeData({});
    setLastSeen({});
  }, []);

  const handleAreaChange = useCallback((a) => {
    setSelectedArea(a);
    setSensores([]);
    setRealtimeData({});
    setLastSeen({});
  }, []);

  const connectWs = useCallback(() => {
    if (!selectedPlanta || !selectedArea) return;
    setWsStatus('reconnecting');
    const url = getWsUrl(selectedPlanta, selectedArea);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setWsStatus('connected');
      reconnectCount.current = 0;
    };

    ws.onmessage = (e) => {
      if (document.visibilityState !== 'visible') return;
      try {
        const datos = JSON.parse(e.data);
        const update = {};
        const now = Date.now();
        let maxTs = 0;
        datos.forEach((d) => { update[d.sensor] = d.valor; if (d.timestamp > maxTs) maxTs = d.timestamp; });
        setRealtimeData((prev) => ({ ...prev, ...update }));
        setLastSeen((prev) => {
          const next = { ...prev };
          datos.forEach((d) => { next[d.sensor] = now; });
          return next;
        });
        setLastUpdate(maxTs ? new Date(maxTs * 1000) : new Date());
      } catch {}
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      reconnectCount.current++;
      if (reconnectCount.current < 10) {
        reconnectRef.current = setTimeout(connectWs, 3000);
      }
    };

    wsRef.current = ws;
  }, [selectedPlanta, selectedArea]);

  useEffect(() => {
    if (wsRef.current) wsRef.current.close();
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    reconnectCount.current = 0;
    setWsStatus('disconnected');
    setLastUpdate(null);
    if (selectedPlanta && selectedArea) connectWs();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connectWs]);

  const zones = useMemo(() => groupSensorsByZone(sensores), [sensores]);

  const handleSensorUpdate = useCallback((id, updates) => {
    setSensores((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const alertCount = useMemo(() => {
    let count = 0;
    for (const s of sensores) {
      const v = realtimeData[s.sensorId];
      if (v == null) continue;
      if (s.tipoDato === 'digital') {
        if (s.modoDigital === 'contador') {
          const lo = s.rangoMinimo, hi = s.rangoMaximo;
          if (s.alarmaActiva && lo != null && hi != null && (v < lo || v > hi)) count++;
        } else {
          if (s.alarmaActiva && s.alarmaEnOn && v === 1) count++;
          else if (s.alarmaActiva && s.alarmaEnOff && v === 0) count++;
        }
      } else {
        const lo = s.rangoMinimo, hi = s.rangoMaximo;
        if (s.alarmaActiva && lo != null && hi != null && (v < lo || v > hi)) count++;
      }
    }
    return count;
  }, [sensores, realtimeData]);

  const alertTint = alertCount === 0 ? '' : alertCount <= 2 ? 'bg-industrial-amber/3' : 'bg-industrial-amber/5';

  const zoneStorageKey = `${selectedPlanta}/${selectedArea}/zones`;

  if (!plantas.length) {
    return (
      <div className="flex h-full items-center justify-center bg-cyber-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-acento border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-cyber-black transition-colors duration-700 ${alertTint}`}>
      <NavigationBar
        wsStatus={wsStatus}
        alertCount={alertCount}
        lastUpdate={lastUpdate}
        onExpandAll={() => setExpandAll((v) => v + 1)}
        onCollapseAll={() => setCollapseAll((v) => v + 1)}
      />

      <LocationSelector
        plantas={plantas}
        areas={areas}
        selectedPlanta={selectedPlanta}
        selectedArea={selectedArea}
        onPlantaChange={handlePlantaChange}
        onAreaChange={handleAreaChange}
      />

      <div className="flex-1 overflow-auto p-4" role="main">
        {alertCount > 0 && (
          <div className="mb-3 rounded-lg border border-industrial-amber/30 bg-industrial-amber/10 px-4 py-2 flex items-center gap-2 animate-alert-pulse">
            <span className="font-mono text-sm font-bold text-industrial-amber">{alertCount}</span>
            <span className="text-xs text-industrial-amber/80">
              {alertCount === 1 ? 'sensor en alarma' : 'sensores en alarma'} — verifique las tarjetas resaltadas
            </span>
          </div>
        )}
        {!selectedArea && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-muted">Seleccione una planta y un área para ver los sensores</p>
          </div>
        )}

        {selectedArea && sensores.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-muted">No hay sensores configurados en esta área</p>
          </div>
        )}

        {Object.entries(zones).map(([name, zoneSensors]) => (
          <SensorZone
            key={name}
            name={name}
            sensores={zoneSensors}
            realtimeData={realtimeData}
            lastSeen={lastSeen}
            storageKey={`${zoneStorageKey}/${name}`}
            forceExpand={expandAll}
            forceCollapse={collapseAll}
            onSensorUpdate={handleSensorUpdate}
          />
        ))}
      </div>
    </div>
  );
}
