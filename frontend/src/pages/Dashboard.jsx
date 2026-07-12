import { useState, useEffect, useRef, useCallback } from 'react';
import { api, getWsUrl } from '../services/api';

const STATUS_COLORS = { normal: 'border-emerald-500', warning: 'border-amber-500', critical: 'border-red-500' };

function SensorCard({ sensor, valor }) {
  const status = valor == null ? 'normal' : valor > 80 ? 'critical' : valor > 60 ? 'warning' : 'normal';

  return (
    <div className={`rounded-lg border-l-4 ${STATUS_COLORS[status]} bg-slate-800 p-4 shadow-lg transition-shadow hover:shadow-xl`}>
      <p className="font-mono text-xs text-slate-400">{sensor.sensorId}</p>
      <p className="mt-1 text-lg font-mono font-bold text-white">
        {valor != null ? valor.toFixed(1) : '--'}
        <span className="ml-1 text-xs text-slate-400">{sensor.unidad?.simbolo || ''}</span>
      </p>
      <p className="mt-1 truncate text-xs text-slate-500">{sensor.nombre}</p>
      <div className={`mt-2 h-1 rounded-full ${status === 'critical' ? 'bg-red-500 animate-pulse' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
    </div>
  );
}

export default function Dashboard() {
  const [plantas, setPlantas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [sensores, setSensores] = useState([]);
  const [selectedPlanta, setSelectedPlanta] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [realtimeData, setRealtimeData] = useState({});
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => { api.get('/api/plantas').then(setPlantas).catch(() => {}); }, []);
  useEffect(() => {
    if (!selectedPlanta) return;
    api.get(`/api/areas?planta=${selectedPlanta}`).then(setAreas).catch(() => {});
  }, [selectedPlanta, setAreas]);
  useEffect(() => {
    if (!selectedPlanta || !selectedArea) return;
    api.get(`/api/sensores?planta=${selectedPlanta}&area=${selectedArea}`).then(setSensores).catch(() => {});
  }, [selectedPlanta, selectedArea, setSensores]);

  const connectWs = useCallback(() => {
    if (!selectedPlanta || !selectedArea) return;
    const url = getWsUrl(selectedPlanta, selectedArea);
    const ws = new WebSocket(url);

    ws.onmessage = (e) => {
      try {
        const datos = JSON.parse(e.data);
        const update = {};
        datos.forEach((d) => { update[d.sensor] = d.valor; });
        setRealtimeData((prev) => ({ ...prev, ...update }));
      } catch {}
    };

    ws.onclose = () => {
      reconnectRef.current = setTimeout(connectWs, 3000);
    };

    wsRef.current = ws;
  }, [selectedPlanta, selectedArea]);

  useEffect(() => {
    if (wsRef.current) wsRef.current.close();
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    connectWs();
    return () => { if (wsRef.current) wsRef.current.close(); if (reconnectRef.current) clearTimeout(reconnectRef.current); };
  }, [connectWs]);

  if (!plantas.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="font-mono text-xl font-bold text-white">Dashboard</h1>

      <div className="mt-4 flex gap-3">
        <select value={selectedPlanta} onChange={(e) => { setSelectedPlanta(e.target.value); setSelectedArea(''); setSensores([]); }}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none">
          <option value="">Seleccionar planta</option>
          {plantas.map((p) => <option key={p.id} value={p.codigo}>{p.nombre}</option>)}
        </select>

        {selectedPlanta && (
          <select value={selectedArea} onChange={(e) => { setSelectedArea(e.target.value); setSensores([]); }}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none">
            <option value="">Seleccionar área</option>
            {areas.map((a) => <option key={a.id} value={a.codigo}>{a.nombre}</option>)}
          </select>
        )}
      </div>

      {!selectedArea && (
        <p className="mt-8 text-center text-sm text-slate-500">Seleccione una planta y un área para ver los sensores</p>
      )}

      {selectedArea && sensores.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-500">No hay sensores configurados en esta área</p>
      )}

      {sensores.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sensores.map((s) => (
            <SensorCard key={s.id} sensor={s} valor={realtimeData[s.sensorId]} />
          ))}
        </div>
      )}
    </div>
  );
}
