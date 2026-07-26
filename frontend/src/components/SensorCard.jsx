import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { icons, iconSize } from '../services/icons';
import { useAuth } from '../context/AuthContext';
import { getSensorDisplayName, getSensorIdentifier } from '../services/displayNames';

const ActivityIcon = icons.activity;
const GaugeIcon = icons.gauge;
const ThermometerIcon = icons.temperature;
const ZapIcon = icons.voltage;
const XIcon = icons.close;
const EditIcon = icons.edit;

function Sparkline({ data }) {
  if (!data || data.length < 2) {
    return <div className="h-32 flex items-center justify-center text-xs text-text-muted/50">sin historial</div>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <defs>
          <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="timestamp" hide />
        <YAxis domain={['auto', 'auto']} tick={{ fill: '#78909C', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
        <Area type="monotone" dataKey="valor" stroke="#00E5FF" strokeWidth={2} fillOpacity={1} fill="url(#colorValor)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MiniGauge({ value, max }) {
  const pct = Math.min(Math.max((value || 0) / (max || 100), 0), 1);
  const data = [
    { name: 'value', value: pct || 0.001 },
    { name: 'remaining', value: Math.max(1 - (pct || 0.001), 0.001) },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={58} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
          <Cell fill="#00E5FF" />
          <Cell fill="#1A2433" />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

function MiniBar({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-32 flex items-center justify-center text-xs text-text-muted/50">sin historial</div>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <XAxis dataKey="timestamp" hide />
        <YAxis domain={['auto', 'auto']} tick={{ fill: '#78909C', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
        <Bar dataKey="valor" fill="#00E5FF" radius={[2, 2, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DigitalIndicator({ value }) {
  const isOn = value === 1;
  return (
    <div className="flex flex-col items-center justify-center h-32 gap-2">
      <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
        isOn ? 'border-industrial-green bg-industrial-green/20' : 'border-gridline bg-gridline/20'
      }`}>
        <div className={`w-8 h-8 rounded-full ${isOn ? 'bg-industrial-green' : 'bg-text-muted/40'}`} />
      </div>
      <span className={`text-sm font-bold font-mono ${isOn ? 'text-industrial-green' : 'text-text-muted'}`}>
        {isOn ? 'ACTIVO' : 'INACTIVO'}
      </span>
    </div>
  );
}

function CounterWidget({ value, unidad, delta }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 gap-1">
      <span className="font-mono text-[32px] font-bold text-white leading-none tabular-nums">
        {value != null ? value.toLocaleString() : '--'}
      </span>
      <span className="text-xs text-text-muted font-medium">{unidad || 'ud'}</span>
      {delta != null && delta > 0 && (
        <span className="text-[11px] font-mono text-cyan-tech">+{delta} en periodo</span>
      )}
    </div>
  );
}

const STATUS = {
  normal: 'border-l-industrial-green',
  warning: 'border-l-industrial-amber border-amber-500/20',
};

export default function SensorCard({ sensor, valor, onSensorUpdate }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editAlias, setEditAlias] = useState(sensor.alias || '');
  const [displayAlias, setDisplayAlias] = useState(sensor.alias || '');
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin';
  const isDigital = sensor.tipoDato === 'digital';
  const isCounter = isDigital && sensor.modoDigital === 'contador';
  const isState = isDigital && !isCounter;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const now = Math.floor(Date.now() / 1000);
    const from = now - 86400;
    api.get(`/api/datos?sensorId=${sensor.id}&from=${from}&to=${now}&limit=50`)
      .then((d) => { if (!cancelled) setHistory(d.slice().reverse()); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sensor.id]);

  const status = useMemo(() => {
    if (valor == null) return 'normal';
    if (isState) {
      if (sensor.alarmaActiva && sensor.alarmaEnOn && valor === 1) return 'warning';
      if (sensor.alarmaActiva && sensor.alarmaEnOff && valor === 0) return 'warning';
      return 'normal';
    }
    if (isCounter) {
      const lo = sensor.rangoMinimo, hi = sensor.rangoMaximo;
      if (sensor.alarmaActiva && lo != null && hi != null && (valor < lo || valor > hi)) return 'warning';
      return 'normal';
    }
    const lo = sensor.rangoMinimo, hi = sensor.rangoMaximo;
    if (lo != null && hi != null) {
      if (valor < lo || valor > hi) return 'warning';
    }
    return 'normal';
  }, [valor, isDigital, isState, isCounter, sensor]);

  const chartData = history.map((d) => ({
    valor: parseFloat(d.valor),
    timestamp: d.timestamp,
  }));

  const tipoId = sensor.tipoGraficoId || 1;

  const handleSaveAlias = async (e) => {
    e.stopPropagation();
    setSaving(true);
    try {
      await api.put(`/api/sensores/${sensor.id}`, { alias: editAlias.trim() || null });
      setDisplayAlias(editAlias.trim());
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setEditAlias(displayAlias);
    setIsEditing(false);
  };

  const sensorWithAlias = { ...sensor, alias: displayAlias };

  return (
    <>
      <div
        onClick={() => !isEditing && setIsOpen(true)}
        className={`relative flex flex-col rounded-lg border-l-4 ${STATUS[status]} bg-panel p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gridline hover:border-cyan-tech/30 group min-h-[260px]`}
      >
        <div className="flex items-center justify-between mb-1.5 gap-2">
          {isEditing ? (
            <div className="flex flex-1 items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editAlias}
                onChange={(e) => setEditAlias(e.target.value)}
                className="flex-1 rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none"
                placeholder="Alias del sensor"
                disabled={saving}
              />
              <button onClick={handleSaveAlias} disabled={saving} className="text-cyan-tech hover:text-white">
                <EditIcon size={14} />
              </button>
              <button onClick={handleCancel} disabled={saving} className="text-text-muted hover:text-white">
                <XIcon size={14} />
              </button>
            </div>
          ) : (
            <>
              <span className="truncate text-xs font-semibold text-white" title={getSensorIdentifier(sensorWithAlias)}>{getSensorDisplayName(sensorWithAlias)}</span>
              {isCounter && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-mono">CONT</span>}
              {isState && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-tech/20 text-cyan-tech font-mono">DIG</span>}
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                  className="shrink-0 text-text-muted/60 hover:text-cyan-tech transition-colors"
                  title="Editar alias"
                >
                  <EditIcon size={14} />
                </button>
              )}
            </>
          )}
          {!isDigital && tipoId === 1 && <ActivityIcon size={12} className="text-text-muted/40 shrink-0" />}
          {!isDigital && tipoId === 2 && <GaugeIcon size={12} className="text-text-muted/40 shrink-0" />}
          {!isDigital && tipoId === 3 && <ActivityIcon size={12} className="text-text-muted/40 shrink-0" />}
          {isState && <ZapIcon size={12} className="text-cyan-tech/60 shrink-0" />}
          {isCounter && <ZapIcon size={12} className="text-green-400/60 shrink-0" />}
        </div>

      <div className="flex items-baseline gap-1.5">
        {isState ? (
          <>
            <span className={`font-mono text-[28px] font-bold leading-none tabular-nums ${valor === 1 ? 'text-industrial-green' : 'text-text-muted'}`}>
              {valor === 1 ? 'ON' : valor === 0 ? 'OFF' : '--'}
            </span>
            <span className="text-xs text-text-muted font-medium">{sensor.unidad?.simbolo || ''}</span>
          </>
        ) : isCounter ? (
          <>
            <span className="font-mono text-[28px] font-bold text-white leading-none tabular-nums">
              {valor != null ? valor.toLocaleString() : '--'}
            </span>
            <span className="text-xs text-text-muted font-medium">{sensor.unidad?.simbolo || 'ud'}</span>
          </>
        ) : (
          <>
            <span className="font-mono text-[28px] font-bold text-white leading-none tabular-nums">
              {valor != null ? valor.toFixed(1) : '--'}
            </span>
            <span className="text-xs text-text-muted font-medium">{sensor.unidad?.simbolo || ''}</span>
          </>
        )}
      </div>

      <div className="mt-3 flex-1 min-h-0 h-32">
        {loading && <div className="h-full w-full rounded bg-gridline/50 animate-pulse" />}
        {!loading && !isDigital && tipoId === 1 && <Sparkline data={chartData} />}
        {!loading && !isDigital && tipoId === 2 && <MiniGauge value={valor || 0} max={sensor.rangoMaximo || 100} />}
        {!loading && !isDigital && tipoId === 3 && <MiniBar data={chartData.slice(-8)} />}
        {!loading && isState && <DigitalIndicator value={valor} />}
        {!loading && isCounter && <CounterWidget value={valor} unidad={sensor.unidad?.simbolo || 'ud'} delta={history.length > 0 ? history[history.length - 1].cambios : null} />}
      </div>

      <div className="mt-2 pt-2 border-t border-gridline/50">
        <p className="truncate text-[11px] text-text-muted font-mono" title={sensor.nombre}>{getSensorIdentifier(sensorWithAlias)}</p>
      </div>

      <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg ${
        status === 'warning' ? 'bg-industrial-amber' : 'bg-industrial-green/50'
      }`} />
    </div>

    {isOpen && <SensorDetailModal sensor={sensorWithAlias} valor={valor} history={history} status={status} onSensorUpdate={onSensorUpdate} onClose={() => setIsOpen(false)} />}
    </>
  );
}

function SensorDetailModal({ sensor, valor, history, status, onSensorUpdate, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin';
  const isDigital = sensor.tipoDato === 'digital';
  const isCounter = isDigital && sensor.modoDigital === 'contador';
  const isState = isDigital && !isCounter;

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 16);
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16);
  });
  const [filteredHistory, setFilteredHistory] = useState(history);
  const [dailyData, setDailyData] = useState(null);
  const [alarmaActiva, setAlarmaActiva] = useState(sensor.alarmaActiva);
  const [rangoMin, setRangoMin] = useState(sensor.rangoMinimo ?? '');
  const [rangoMax, setRangoMax] = useState(sensor.rangoMaximo ?? '');
  const [alarmaOn, setAlarmaOn] = useState(sensor.alarmaEnOn);
  const [alarmaOff, setAlarmaEnOff] = useState(sensor.alarmaEnOff);
  const [savingAlarm, setSavingAlarm] = useState(false);
  const [unidadId, setUnidadId] = useState(sensor.unidadId);
  const [tipoGraficoId, setTipoGraficoId] = useState(sensor.tipoGraficoId);
  const [unidades, setUnidades] = useState([]);
  const [tipoGraficos, setTipoGraficos] = useState([]);
  const [showNewUnidad, setShowNewUnidad] = useState(false);
  const [newUnidadNombre, setNewUnidadNombre] = useState('');
  const [newUnidadSimbolo, setNewUnidadSimbolo] = useState('');

  const loadUnidades = () => {
    api.get('/api/unidades').then(setUnidades).catch(() => {});
  };

  useEffect(() => {
    loadUnidades();
    api.get('/api/tipos-grafico').then(setTipoGraficos).catch(() => {});
  }, []);

  const handleAddUnidad = async () => {
    if (!newUnidadNombre.trim() || !newUnidadSimbolo.trim()) return;
    try {
      const res = await api.post('/api/unidades', {
        nombre: newUnidadNombre.trim(),
        simbolo: newUnidadSimbolo.trim(),
      });
      await loadUnidades();
      setUnidadId(res.id);
      setShowNewUnidad(false);
      setNewUnidadNombre('');
      setNewUnidadSimbolo('');
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    const fromTs = Math.floor(new Date(dateFrom).getTime() / 1000);
    const toTs = Math.floor(new Date(dateTo).getTime() / 1000);
    const days = (toTs - fromTs) / 86400;
    const usarAgregar = isCounter && days > 1;
    const params = `sensorId=${sensor.id}&from=${fromTs}&to=${toTs}&limit=500`;
    const url = usarAgregar ? `/api/datos?${params}&agregar=diario` : `/api/datos?${params}`;
    api.get(url)
      .then((d) => {
        if (usarAgregar && d && d.raw) {
          setFilteredHistory(d.raw.slice().reverse());
          setDailyData(d.diario || []);
        } else {
          setFilteredHistory(Array.isArray(d) ? d.slice().reverse() : []);
          setDailyData(null);
        }
      })
      .catch(() => {});
  }, [sensor.id, dateFrom, dateTo, isCounter]);

  const displayHistory = filteredHistory.length ? filteredHistory : history;

  const values = displayHistory.map((h) => h.valor).filter((v) => !isNaN(v));
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

  const chartData = displayHistory.map((d) => ({
    valor: parseFloat(d.valor),
    timestamp: d.timestamp,
  }));

  const handleSaveAlarm = async () => {
    setSavingAlarm(true);
    try {
      const body = {
        alarmaActiva,
        rangoMinimo: isState ? null : (rangoMin === '' ? null : Number(rangoMin)),
        rangoMaximo: isState ? null : (rangoMax === '' ? null : Number(rangoMax)),
        alarmaEnOn: alarmaOn,
        alarmaEnOff: alarmaOff,
        unidadId,
        tipoGraficoId: isDigital ? undefined : tipoGraficoId,
      };
      await api.put(`/api/sensores/${sensor.id}`, body);
      if (onSensorUpdate) onSensorUpdate(sensor.id, { unidadId, tipoGraficoId: isDigital ? sensor.tipoGraficoId : tipoGraficoId });
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingAlarm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gridline bg-panel p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-mono text-lg font-bold text-white">{getSensorDisplayName(sensor)}</h2>
            <p className="text-xs text-text-muted font-mono">{getSensorIdentifier(sensor)} · {sensor.unidad?.nombre} ({sensor.unidad?.simbolo}) · {sensor.tipoDato}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-cyber-black hover:text-white transition-colors">
            <XIcon size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg border border-gridline bg-cyber-black p-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Actual</p>
            <p className={`font-mono text-xl font-bold ${status === 'warning' ? 'text-industrial-amber' : 'text-cyan-tech'}`}>
              {isState ? (valor === 1 ? 'ON' : valor === 0 ? 'OFF' : '--') : isCounter ? (valor != null ? valor.toLocaleString() : '--') : (valor != null ? valor.toFixed(1) : '--')}
              {!isState && <span className="text-xs text-text-muted"> {sensor.unidad?.simbolo}</span>}
            </p>
          </div>
          <div className="rounded-lg border border-gridline bg-cyber-black p-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Mín / Máx</p>
            <p className="font-mono text-xl font-bold text-white">
              {isState ? '0 / 1' : isCounter ? (min != null ? `${min.toLocaleString()} / ${max.toLocaleString()}` : '--') : (min != null ? `${min.toFixed(1)} / ${max.toFixed(1)}` : '--')}
            </p>
          </div>
          <div className="rounded-lg border border-gridline bg-cyber-black p-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Promedio</p>
            <p className="font-mono text-xl font-bold text-white">{isState ? '--' : avg != null ? (isCounter ? avg.toLocaleString() : avg.toFixed(1)) : '--'}</p>
          </div>
        </div>

        <div className="mb-4 flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Desde</label>
            <input type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Hasta</label>
            <input type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none" />
          </div>
        </div>

        {isState ? (
          <div className="mb-4 rounded-lg border border-gridline bg-cyber-black p-2 max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-muted border-b border-gridline">
                  <th className="p-1.5 text-left">Timestamp</th>
                  <th className="p-1.5 text-left">Estado</th>
                  <th className="p-1.5 text-right">Cambios</th>
                </tr>
              </thead>
              <tbody>
                {displayHistory.map((d, i) => (
                  <tr key={i} className="border-b border-gridline/30">
                    <td className="p-1.5 font-mono text-text-muted">{new Date(d.timestamp * 1000).toLocaleString()}</td>
                    <td className="p-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${d.valor === 1 ? 'bg-industrial-green/20 text-industrial-green' : 'bg-gridline/30 text-text-muted'}`}>
                        {d.valor === 1 ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td className="p-1.5 font-mono text-right text-cyan-tech">{d.cambios ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : isCounter && dailyData && dailyData.length > 0 ? (
          <div className="h-48 rounded-lg border border-gridline bg-cyber-black p-2 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData.map(d => ({ dia: d.dia, total: d.total }))} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <XAxis dataKey="dia" tick={{ fill: '#78909C', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#78909C', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar dataKey="total" fill="#00E5FF" radius={[2, 2, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : isCounter ? (
          <div className="h-48 rounded-lg border border-gridline bg-cyber-black p-2 mb-4">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#78909C', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="valor" fill="#00E5FF" radius={[2, 2, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-text-muted">Sin datos históricos</div>
            )}
          </div>
        ) : (
          <div className="h-48 rounded-lg border border-gridline bg-cyber-black p-2 mb-4">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#78909C', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Line type="monotone" dataKey="valor" stroke="#00E5FF" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-text-muted">Sin datos históricos</div>
            )}
          </div>
        )}

        <div className="rounded-lg border border-gridline bg-cyber-black p-4 mb-4">
          <h3 className="text-sm font-semibold text-white mb-3">Tipo y unidad</h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Tipo de gráfico</label>
              {isState ? (
                <div className="text-xs text-cyan-tech py-1.5">Indicador LED</div>
              ) : isCounter ? (
                <div className="text-xs text-green-400 py-1.5">Barras diarias</div>
              ) : (
                <select value={tipoGraficoId} onChange={(e) => setTipoGraficoId(Number(e.target.value))} disabled={!isAdmin || savingAlarm} className="w-full rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none">
                  {tipoGraficos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre} ({t.widget})</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Unidad</label>
              <select value={unidadId} onChange={(e) => setUnidadId(Number(e.target.value))} disabled={!isAdmin || savingAlarm} className="w-full rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none">
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre} ({u.simbolo})</option>
                ))}
              </select>
            </div>
          </div>
          {isAdmin && (
            showNewUnidad ? (
              <div className="flex items-end gap-2 mt-2">
                <input type="text" value={newUnidadNombre} onChange={(e) => setNewUnidadNombre(e.target.value)} placeholder="Nombre" className="flex-1 rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none" />
                <input type="text" value={newUnidadSimbolo} onChange={(e) => setNewUnidadSimbolo(e.target.value)} placeholder="Símbolo" className="w-20 rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none" />
                <button onClick={handleAddUnidad} className="text-cyan-tech hover:text-white text-xs">Crear</button>
                <button onClick={() => setShowNewUnidad(false)} className="text-text-muted hover:text-white text-xs">Cancelar</button>
              </div>
            ) : (
              <button onClick={() => setShowNewUnidad(true)} className="mt-2 text-xs text-cyan-tech hover:text-white">+ Nueva unidad</button>
            )
          )}
        </div>

        <div className="rounded-lg border border-gridline bg-cyber-black p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Configuración de Alarma</h3>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs text-text-muted">Alarma activa</label>
            <input type="checkbox" checked={alarmaActiva} onChange={(e) => setAlarmaActiva(e.target.checked)} disabled={!isAdmin || savingAlarm} className="accent-cyan-tech" />
          </div>
          {isState ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={alarmaOn} onChange={(e) => { setAlarmaOn(e.target.checked); if (e.target.checked) setAlarmaOff(false); }} disabled={!isAdmin || savingAlarm} className="accent-cyan-tech" />
                <label className="text-xs text-text-muted">Alarma en ON (valor = 1)</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={alarmaOff} onChange={(e) => { setAlarmaEnOff(e.target.checked); if (e.target.checked) setAlarmaOn(false); }} disabled={!isAdmin || savingAlarm} className="accent-cyan-tech" />
                <label className="text-xs text-text-muted">Alarma en OFF (valor = 0)</label>
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Rango mínimo</label>
                <input type="number" value={rangoMin} onChange={(e) => setRangoMin(e.target.value)} disabled={!isAdmin || savingAlarm} className="w-full rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none" placeholder="Sin límite" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Rango máximo</label>
                <input type="number" value={rangoMax} onChange={(e) => setRangoMax(e.target.value)} disabled={!isAdmin || savingAlarm} className="w-full rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none" placeholder="Sin límite" />
              </div>
            </div>
          )}
        </div>

        {isAdmin && (
          <button onClick={handleSaveAlarm} disabled={savingAlarm} className="w-full rounded bg-cyan-tech/20 px-4 py-2 text-sm text-cyan-tech hover:bg-cyan-tech/30 disabled:opacity-50">
            {savingAlarm ? 'Guardando...' : 'Guardar configuración'}
          </button>
        )}
      </div>
    </div>
  );
}
