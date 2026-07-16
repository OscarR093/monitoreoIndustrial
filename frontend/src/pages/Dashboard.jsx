import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { api, getWsUrl } from '../services/api';
import { groupSensorsByZone } from '../services/sensorZones';
import NavigationBar from '../components/NavigationBar';
import SensorZone from '../components/SensorZone';

export default function Dashboard() {
  const [plantas, setPlantas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [sensores, setSensores] = useState([]);
  const [selectedPlanta, setSelectedPlanta] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [realtimeData, setRealtimeData] = useState({});
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const reconnectCount = useRef(0);
  const [expandAll, setExpandAll] = useState(false);
  const [collapseAll, setCollapseAll] = useState(false);

  useEffect(() => { api.get('/api/plantas').then(setPlantas).catch(() => {}); }, []);

  useEffect(() => {
    if (!selectedPlanta) { setAreas([]); return; }
    api.get(`/api/areas?planta=${selectedPlanta}`).then(setAreas).catch(() => {});
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
  }, []);

  const handleAreaChange = useCallback((a) => {
    setSelectedArea(a);
    setSensores([]);
    setRealtimeData({});
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
      try {
        const datos = JSON.parse(e.data);
        const update = {};
        datos.forEach((d) => { update[d.sensor] = d.valor; });
        setRealtimeData((prev) => ({ ...prev, ...update }));
        setLastUpdate(new Date());
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

  const alertCount = useMemo(() => {
    let count = 0;
    for (const s of sensores) {
      const v = realtimeData[s.sensorId];
      if (v != null && (v > 60)) count++;
    }
    return count;
  }, [sensores, realtimeData]);

  const zoneStorageKey = `${selectedPlanta}/${selectedArea}/zones`;

  if (!plantas.length) {
    return (
      <div className="flex h-full items-center justify-center bg-cyber-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-tech border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-cyber-black">
      <NavigationBar
        plantas={plantas}
        areas={areas}
        selectedPlanta={selectedPlanta}
        selectedArea={selectedArea}
        onPlantaChange={handlePlantaChange}
        onAreaChange={handleAreaChange}
        wsStatus={wsStatus}
        alertCount={alertCount}
        lastUpdate={lastUpdate}
        onExpandAll={() => setExpandAll((v) => !v)}
        onCollapseAll={() => setCollapseAll((v) => !v)}
      />

      <div className="flex-1 overflow-auto p-4">
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
            storageKey={`${zoneStorageKey}/${name}`}
            forceExpand={expandAll}
            forceCollapse={collapseAll}
          />
        ))}
      </div>
    </div>
  );
}
