import { useEffect, useState, useMemo, memo } from 'react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { icons, iconSize } from '../services/icons';
import { useAuth } from '../context/AuthContext';
import { getSensorDisplayName, getSensorIdentifier } from '../services/displayNames';
import { useToast } from '../context/ToastContext';

const CHART_COLORS = { accent: '#F59E0B', muted: '#787C7A', deadZone: '#1A1F1C' };

const ActivityIcon = icons.activity;
const GaugeIcon = icons.gauge;
const ZapIcon = icons.voltage;
const XIcon = icons.close;
const EditIcon = icons.edit;

const Sparkline = memo(function Sparkline({ data }) {
  if (!data || data.length < 2) {
    return <div className="h-32 flex items-center justify-center text-xs text-text-muted/50">sin historial</div>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <defs>
          <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="timestamp" hide />
        <YAxis domain={['auto', 'auto']} tick={{ fill: CHART_COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
        <Area type="monotone" dataKey="valor" stroke={CHART_COLORS.accent} strokeWidth={2} fillOpacity={1} fill="url(#colorValor)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
});

const MiniGauge = memo(function MiniGauge({ value, max }) {
  const pct = Math.min(Math.max((value || 0) / (max || 100), 0), 1);
  const data = [
    { name: 'value', value: pct || 0.001 },
    { name: 'remaining', value: Math.max(1 - (pct || 0.001), 0.001) },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={58} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
          <Cell fill={CHART_COLORS.accent} />
          <Cell fill={CHART_COLORS.deadZone} />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
});

const MiniBar = memo(function MiniBar({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-32 flex items-center justify-center text-xs text-text-muted/50">sin historial</div>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <XAxis dataKey="timestamp" hide />
        <YAxis domain={['auto', 'auto']} tick={{ fill: CHART_COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
        <Bar dataKey="valor" fill={CHART_COLORS.accent} radius={[2, 2, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
});

const DigitalIndicator = memo(function DigitalIndicator({ value }) {
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
});

const CounterWidget = memo(function CounterWidget({ value, unidad, delta }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 gap-1">
      <span className="font-mono text-[32px] font-bold text-white leading-none tabular-nums">
        {value != null ? value.toLocaleString() : '--'}
      </span>
      <span className="text-xs text-text-muted font-medium">{unidad || 'ud'}</span>
      {delta != null && delta > 0 && (
        <span className="text-xs font-mono text-acento">+{delta} en periodo</span>
      )}
    </div>
  );
});

const STATUS = {
  normal: 'border-l-industrial-green',
  warning: 'border-l-industrial-amber bg-industrial-amber/[0.06]',
};

const SensorCard = memo(function SensorCard({ sensor, valor, lastSeen, onSensorUpdate }) {
  const { user } = useAuth();
  const showToast = useToast();
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin';
  const STALE_THRESHOLD = 6000;
  const isStale = lastSeen ? Date.now() - lastSeen > STALE_THRESHOLD : true;
  const staleLabel = lastSeen ? (() => {
    const s = Math.floor((Date.now() - lastSeen) / 1000);
    return s < 60 ? `hace ${s}s` : `hace ${Math.floor(s / 60)}m`;
  })() : 'sin datos';
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editAlias, setEditAlias] = useState(sensor.alias || '');
  const [displayAlias, setDisplayAlias] = useState(sensor.alias || '');
  const [saving, setSaving] = useState(false);

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

  const chartData = useMemo(() => history.map((d) => ({
    valor: parseFloat(d.valor),
    timestamp: d.timestamp,
  })), [history]);

  const tipoId = sensor.tipoGraficoId || 1;

  const handleSaveAlias = async (e) => {
    e.stopPropagation();
    setSaving(true);
    try {
      await api.put(`/api/sensores/${sensor.id}`, { alias: editAlias.trim() || null });
      setDisplayAlias(editAlias.trim());
      setIsEditing(false);
    } catch (err) {
      showToast(err.message);
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
        role="button"
        tabIndex={0}
        onClick={() => !isEditing && setIsOpen(true)}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isEditing) { e.preventDefault(); setIsOpen(true); } }}
        className={`relative flex flex-col rounded-lg border-l-4 ${STATUS[status]} bg-panel p-4 transition-all cursor-pointer border border-gridline hover:border-acento/30 group min-h-[260px] ${isStale ? 'opacity-60' : ''}`}
      >
        <div className="flex items-center justify-between mb-1.5 gap-2">
          {isEditing ? (
            <div className="flex flex-1 items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editAlias}
                onChange={(e) => setEditAlias(e.target.value)}
                className="flex-1 rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white placeholder:text-text-muted focus:border-acento focus:outline-none"
                placeholder="Alias del sensor"
                aria-label="Alias del sensor"
                disabled={saving}
              />
              <button onClick={handleSaveAlias} disabled={saving} className="text-acento hover:text-white" aria-label="Guardar alias">
                <EditIcon size={14} />
              </button>
              <button onClick={handleCancel} disabled={saving} className="text-text-muted hover:text-white" aria-label="Cancelar edición">
                <XIcon size={14} />
              </button>
            </div>
          ) : (
            <>
              <h3 className="truncate text-xs font-semibold text-white" title={getSensorIdentifier(sensorWithAlias)}>{getSensorDisplayName(sensorWithAlias)}</h3>
              {isCounter && <span className="text-xs px-1.5 py-0.5 rounded bg-industrial-green/20 text-industrial-green font-mono">CONT</span>}
              {isState && <span className="text-xs px-1.5 py-0.5 rounded bg-acento/20 text-acento font-mono">DIG</span>}
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                  className="shrink-0 text-text-muted/60 hover:text-acento transition-colors"
                  title="Editar alias"
                  aria-label="Editar alias"
                >
                  <EditIcon size={14} />
                </button>
              )}
            </>
          )}
          {!isDigital && tipoId === 1 && <ActivityIcon size={12} className="text-text-muted/40 shrink-0" />}
          {!isDigital && tipoId === 2 && <GaugeIcon size={12} className="text-text-muted/40 shrink-0" />}
          {!isDigital && tipoId === 3 && <ActivityIcon size={12} className="text-text-muted/40 shrink-0" />}
          {isState && <ZapIcon size={12} className="text-acento/60 shrink-0" />}
          {isCounter && <ZapIcon size={12} className="text-industrial-green/60 shrink-0" />}
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

      <div className="mt-2 pt-2 border-t border-gridline/50 flex items-center justify-between">
        <p className="truncate text-xs text-text-muted font-mono" title={sensor.nombre}>{getSensorIdentifier(sensorWithAlias)}</p>
        {isStale && <span className="shrink-0 text-xs text-industrial-amber/70 font-mono ml-2">{staleLabel}</span>}
      </div>

      <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg ${
        status === 'warning' ? 'bg-industrial-amber' : 'bg-industrial-green/50'
      }`} aria-label={status === 'warning' ? 'Advertencia' : 'Normal'} />
    </div>

    {isOpen && <SensorDetailModal sensor={sensorWithAlias} valor={valor} history={history} status={status} onSensorUpdate={onSensorUpdate} onClose={() => setIsOpen(false)} />}
    </>
  );
});

export default SensorCard;

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
  const [pendingAlarmaOff, setPendingAlarmaOff] = useState(false);
  const [tab, setTab] = useState('diagnostico');

  useEffect(() => {
    setRangoMin(sensor.rangoMinimo ?? '');
    setRangoMax(sensor.rangoMaximo ?? '');
  }, [sensor.rangoMinimo, sensor.rangoMaximo]);

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
      showToast(err.message);
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
      if (onSensorUpdate) {
        const newUnidad = unidades.find((u) => u.id === unidadId);
        onSensorUpdate(sensor.id, {
          unidadId,
          unidad: newUnidad || sensor.unidad,
          tipoGraficoId: isDigital ? sensor.tipoGraficoId : tipoGraficoId,
          alarmaActiva,
          rangoMinimo: isState ? null : (rangoMin === '' ? null : Number(rangoMin)),
          rangoMaximo: isState ? null : (rangoMax === '' ? null : Number(rangoMax)),
          alarmaEnOn: alarmaOn,
          alarmaEnOff: alarmaOff,
        });
      }
      showToast('Configuración guardada', 'success');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSavingAlarm(false);
    }
  };

  const hasAlarm = alarmaActiva || sensor.alarmaActiva;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gridline bg-panel p-6" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="modal-title" className="font-mono text-xl font-bold text-white">{getSensorDisplayName(sensor)}</h2>
            <p className="text-xs text-text-muted font-mono">{getSensorIdentifier(sensor)} · {sensor.unidad?.nombre} ({sensor.unidad?.simbolo})</p>
          </div>
          <button onClick={onClose} className="rounded p-1 min-w-[32px] min-h-[32px] flex items-center justify-center text-text-muted hover:bg-cyber-black hover:text-white transition-colors" aria-label="Cerrar">
            <XIcon size={20} />
          </button>
        </div>

        <div className="flex gap-1 mb-4 border-b border-gridline">
          {[
            { key: 'diagnostico', label: 'Diagnóstico' },
            { key: 'historial', label: 'Historial' },
            ...(isAdmin ? [{ key: 'configuracion', label: 'Configuración' }] : []),
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-acento text-acento' : 'border-transparent text-text-muted hover:text-white hover:border-gridline'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {tab === 'diagnostico' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gridline bg-cyber-black p-4">
              <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Valor actual</p>
              <p className={`font-mono text-[32px] font-bold tabular-nums leading-none ${status === 'warning' ? 'text-industrial-amber' : 'text-white'}`}>
                {isState ? (valor === 1 ? 'ON' : valor === 0 ? 'OFF' : '--') : isCounter ? (valor != null ? valor.toLocaleString() : '--') : (valor != null ? valor.toFixed(1) : '--')}
              </p>
              {!isState && <span className="text-sm text-text-muted">{sensor.unidad?.simbolo}</span>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-gridline bg-cyber-black p-3 text-center">
                <p className="text-xs uppercase tracking-wider text-text-muted">Mín</p>
                <p className="font-mono text-lg font-bold text-white">{isState ? '0' : min != null ? (isCounter ? min.toLocaleString() : min.toFixed(1)) : '--'}</p>
              </div>
              <div className="rounded-lg border border-gridline bg-cyber-black p-3 text-center">
                <p className="text-xs uppercase tracking-wider text-text-muted">Promedio</p>
                <p className="font-mono text-lg font-bold text-white">{isState ? '--' : avg != null ? (isCounter ? avg.toLocaleString() : avg.toFixed(1)) : '--'}</p>
              </div>
              <div className="rounded-lg border border-gridline bg-cyber-black p-3 text-center">
                <p className="text-xs uppercase tracking-wider text-text-muted">Máx</p>
                <p className="font-mono text-lg font-bold text-white">{isState ? '1' : max != null ? (isCounter ? max.toLocaleString() : max.toFixed(1)) : '--'}</p>
              </div>
            </div>

            <div className="rounded-lg border border-gridline bg-cyber-black p-4">
              <h3 className="text-xs uppercase tracking-wider text-text-muted mb-2">Estado de alarma</h3>
              {hasAlarm ? (
                <div className="space-y-1 text-xs">
                  <p className="text-white">Alarma <span className={alarmaActiva ? 'text-industrial-green' : 'text-text-muted'}>{alarmaActiva ? 'activa' : 'inactiva'}</span></p>
                  {!isState && sensor.rangoMinimo != null && sensor.rangoMaximo != null && (
                    <p className="text-text-muted">Rango: {sensor.rangoMinimo} – {sensor.rangoMaximo} {sensor.unidad?.simbolo}</p>
                  )}
                  {isState && (
                    <p className="text-text-muted">Notifica en: {[sensor.alarmaEnOn && 'ON', sensor.alarmaEnOff && 'OFF'].filter(Boolean).join(', ') || '—'}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-muted">Sin alarma configurada</p>
              )}
            </div>

            <p className="text-xs text-text-muted text-right">{displayHistory.length} datos · {dateFrom.slice(0, 10)} – {dateTo.slice(0, 10)}</p>
          </div>
        )}

        {tab === 'historial' && (
          <div className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label htmlFor="date-from" className="text-xs uppercase tracking-wider text-text-muted block mb-1">Desde</label>
                <input id="date-from" type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="Fecha desde" className="w-full rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white placeholder:text-text-muted focus:border-acento focus:outline-none" />
              </div>
              <div className="flex-1">
                <label htmlFor="date-to" className="text-xs uppercase tracking-wider text-text-muted block mb-1">Hasta</label>
                <input id="date-to" type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="Fecha hasta" className="w-full rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white placeholder:text-text-muted focus:border-acento focus:outline-none" />
              </div>
            </div>

            {!isState && chartData.length > 0 && (
              <div className="h-56 rounded-lg border border-gridline bg-cyber-black p-2">
                <ResponsiveContainer width="100%" height="100%">
                  {isCounter && dailyData && dailyData.length > 0 ? (
                    <BarChart data={dailyData.map(d => ({ dia: d.dia, total: d.total }))} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                      <XAxis dataKey="dia" tick={{ fill: CHART_COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: CHART_COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip contentStyle={{ background: '#111714', border: '1px solid #1A1F1C', borderRadius: 6, fontSize: 12 }} labelStyle={{ color: '#787C7A' }} />
                      <Bar dataKey="total" fill={CHART_COLORS.accent} radius={[2, 2, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                      <XAxis dataKey="timestamp" hide />
                      <YAxis tick={{ fill: CHART_COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ background: '#111714', border: '1px solid #1A1F1C', borderRadius: 6, fontSize: 12 }} labelStyle={{ color: '#787C7A' }} labelFormatter={(ts) => new Date(ts * 1000).toLocaleString()} />
                      <Line type="monotone" dataKey="valor" stroke={CHART_COLORS.accent} strokeWidth={2} dot={chartData.length < 20} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
            {!isState && chartData.length === 0 && (
              <div className="h-20 rounded-lg border border-gridline bg-cyber-black flex items-center justify-center">
                <p className="text-xs text-text-muted">Sin datos para graficar en este período</p>
              </div>
            )}

            <div className="rounded-lg border border-gridline bg-cyber-black max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-cyber-black">
                  <tr className="text-text-muted border-b border-gridline">
                    <th className="p-2 text-left font-medium">Timestamp</th>
                    <th className="p-2 text-right font-medium">{isState ? 'Estado' : `Valor${sensor.unidad?.simbolo ? ' (' + sensor.unidad.simbolo + ')' : ''}`}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayHistory.length === 0 ? (
                    <tr><td colSpan={2} className="p-4 text-center text-text-muted">Sin datos en este período</td></tr>
                  ) : (
                    [...displayHistory].reverse().slice(0, 100).map((d) => (
                      <tr key={d.timestamp} className="border-b border-gridline/30 hover:bg-panel/30">
                        <td className="p-2 font-mono text-text-muted whitespace-nowrap">{new Date(d.timestamp * 1000).toLocaleString()}</td>
                        <td className="p-2 font-mono text-right text-white tabular-nums whitespace-nowrap">
                          {isState ? (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${d.valor === 1 ? 'bg-industrial-green/20 text-industrial-green' : 'bg-gridline/30 text-text-muted'}`}>
                              {d.valor === 1 ? 'ON' : 'OFF'}
                            </span>
                          ) : (
                            isCounter ? Number(d.valor).toLocaleString() : Number(d.valor).toFixed(1)
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'configuracion' && isAdmin && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gridline bg-cyber-black p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Alarma</h3>
              <div className="flex items-center gap-2 mb-3">
                <label htmlFor="alarma-activa" className="text-xs text-text-muted">Alarma activa</label>
                <input id="alarma-activa" type="checkbox" checked={alarmaActiva} onChange={(e) => {
                  if (!e.target.checked && sensor.alarmaActiva) {
                    setPendingAlarmaOff(true);
                  } else {
                    setAlarmaActiva(e.target.checked);
                    setPendingAlarmaOff(false);
                  }
                }} disabled={savingAlarm} className="accent-acento" />
              </div>
              {pendingAlarmaOff && (
                <div className="mb-3 rounded border border-industrial-amber/30 bg-industrial-amber/10 px-3 py-2 text-xs text-industrial-amber leading-relaxed">
                  ¿Desactivar la alarma para este sensor?
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => { setAlarmaActiva(false); setPendingAlarmaOff(false); }} className="text-industrial-red hover:text-red-300 font-medium">Sí, desactivar</button>
                    <button onClick={() => setPendingAlarmaOff(false)} className="text-text-muted hover:text-white">Cancelar</button>
                  </div>
                </div>
              )}
              {isState ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input id="alarma-on" type="checkbox" checked={alarmaOn} onChange={(e) => { setAlarmaOn(e.target.checked); if (e.target.checked) setAlarmaOff(false); }} disabled={savingAlarm} className="accent-acento" />
                    <label htmlFor="alarma-on" className="text-xs text-text-muted">Alarma en ON (valor = 1)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="alarma-off" type="checkbox" checked={alarmaOff} onChange={(e) => { setAlarmaEnOff(e.target.checked); if (e.target.checked) setAlarmaOn(false); }} disabled={savingAlarm} className="accent-acento" />
                    <label htmlFor="alarma-off" className="text-xs text-text-muted">Alarma en OFF (valor = 0)</label>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <label className="text-xs uppercase tracking-wider text-text-muted block mb-1">Rango mínimo</label>
                    <input type="number" value={rangoMin} onChange={(e) => setRangoMin(e.target.value)} disabled={savingAlarm} className="w-full rounded border border-gridline bg-cyber-black px-2 py-1 pr-6 text-xs text-white placeholder:text-text-muted focus:border-acento focus:outline-none" placeholder="Sin límite" />
                    {rangoMin !== '' && !savingAlarm && (
                      <button type="button" onClick={() => setRangoMin('')} className="absolute right-1.5 top-[22px] text-text-muted hover:text-white text-xs" title="Quitar límite">×</button>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <label className="text-xs uppercase tracking-wider text-text-muted block mb-1">Rango máximo</label>
                    <input type="number" value={rangoMax} onChange={(e) => setRangoMax(e.target.value)} disabled={savingAlarm} className="w-full rounded border border-gridline bg-cyber-black px-2 py-1 pr-6 text-xs text-white placeholder:text-text-muted focus:border-acento focus:outline-none" placeholder="Sin límite" />
                    {rangoMax !== '' && !savingAlarm && (
                      <button type="button" onClick={() => setRangoMax('')} className="absolute right-1.5 top-[22px] text-text-muted hover:text-white text-xs" title="Quitar límite">×</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gridline bg-cyber-black p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Tipo y unidad</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs uppercase tracking-wider text-text-muted block mb-1">Tipo de gráfico</label>
                  {isState ? (
                    <div className="text-xs text-acento py-1.5">Indicador LED</div>
                  ) : isCounter ? (
                    <div className="text-xs text-industrial-green py-1.5">Barras diarias</div>
                  ) : (
                    <select value={tipoGraficoId} onChange={(e) => setTipoGraficoId(Number(e.target.value))} disabled={savingAlarm} className="w-full rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-acento focus:outline-none">
                      {tipoGraficos.map((t) => (<option key={t.id} value={t.id}>{t.nombre} ({t.widget})</option>))}
                    </select>
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-xs uppercase tracking-wider text-text-muted block mb-1">Unidad</label>
                  <select value={unidadId} onChange={(e) => setUnidadId(Number(e.target.value))} disabled={savingAlarm} className="w-full rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-acento focus:outline-none">
                    {unidades.map((u) => (<option key={u.id} value={u.id}>{u.nombre} ({u.simbolo})</option>))}
                  </select>
                </div>
              </div>
              {showNewUnidad ? (
                <div className="flex items-end gap-2 mt-2">
                  <input type="text" value={newUnidadNombre} onChange={(e) => setNewUnidadNombre(e.target.value)} placeholder="Nombre" aria-label="Nombre de la unidad" className="flex-1 rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white placeholder:text-text-muted focus:border-acento focus:outline-none" />
                  <input type="text" value={newUnidadSimbolo} onChange={(e) => setNewUnidadSimbolo(e.target.value)} placeholder="Símbolo" aria-label="Símbolo de la unidad" className="w-20 rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white placeholder:text-text-muted focus:border-acento focus:outline-none" />
                  <button onClick={handleAddUnidad} className="text-acento hover:text-white text-xs">Crear</button>
                  <button onClick={() => setShowNewUnidad(false)} className="text-text-muted hover:text-white text-xs">Cancelar</button>
                </div>
              ) : (
                <button onClick={() => setShowNewUnidad(true)} className="mt-2 text-xs text-acento hover:text-white">+ Nueva unidad</button>
              )}
            </div>

            <button onClick={handleSaveAlarm} disabled={savingAlarm} className="w-full rounded bg-acento/20 px-4 py-2 text-sm text-acento hover:bg-acento/30 disabled:opacity-50">
              {savingAlarm ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
