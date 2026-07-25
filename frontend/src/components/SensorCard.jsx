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

const STATUS = {
  normal: 'border-l-industrial-green',
  warning: 'border-l-industrial-amber border-amber-500/20',
  critical: 'border-l-industrial-red border-red-500/30 animate-pulse',
};

export default function SensorCard({ sensor, valor }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editAlias, setEditAlias] = useState(sensor.alias || '');
  const [displayAlias, setDisplayAlias] = useState(sensor.alias || '');
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/api/datos?sensorId=${sensor.id}&limit=20`)
      .then((d) => { if (!cancelled) setHistory(d.slice().reverse()); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sensor.id]);

  const status = useMemo(() => {
    if (valor == null) return 'normal';
    if (valor > 80) return 'critical';
    if (valor > 60) return 'warning';
    return 'normal';
  }, [valor]);

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
          {tipoId === 1 && <ActivityIcon size={12} className="text-text-muted/40 shrink-0" />}
          {tipoId === 2 && <GaugeIcon size={12} className="text-text-muted/40 shrink-0" />}
          {tipoId === 3 && <ActivityIcon size={12} className="text-text-muted/40 shrink-0" />}
        </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-[28px] font-bold text-white leading-none tabular-nums">
          {valor != null ? valor.toFixed(1) : '--'}
        </span>
        <span className="text-xs text-text-muted font-medium">{sensor.unidad?.simbolo || ''}</span>
      </div>

      <div className="mt-3 flex-1 min-h-0 h-32">
        {loading && <div className="h-full w-full rounded bg-gridline/50 animate-pulse" />}
        {!loading && tipoId === 1 && <Sparkline data={chartData} />}
        {!loading && tipoId === 2 && <MiniGauge value={valor || 0} max={100} />}
        {!loading && tipoId === 3 && <MiniBar data={chartData.slice(-8)} />}
      </div>

      <div className="mt-2 pt-2 border-t border-gridline/50">
        <p className="truncate text-[11px] text-text-muted font-mono" title={sensor.nombre}>{getSensorIdentifier(sensorWithAlias)}</p>
      </div>

      <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg ${
        status === 'critical' ? 'bg-industrial-red' : status === 'warning' ? 'bg-industrial-amber' : 'bg-industrial-green/50'
      }`} />
    </div>

    {isOpen && <SensorDetailModal sensor={sensorWithAlias} valor={valor} history={chartData} status={status} onClose={() => setIsOpen(false)} />}
    </>
  );
}

function SensorDetailModal({ sensor, valor, history, status, onClose }) {
  const values = history.map((h) => h.valor).filter((v) => !isNaN(v));
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-gridline bg-panel p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-mono text-lg font-bold text-white">{getSensorDisplayName(sensor)}</h2>
            <p className="text-xs text-text-muted font-mono">{getSensorIdentifier(sensor)} · {sensor.unidad?.nombre} ({sensor.unidad?.simbolo})</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-cyber-black hover:text-white transition-colors">
            <XIcon size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg border border-gridline bg-cyber-black p-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Actual</p>
            <p className={`font-mono text-xl font-bold ${status === 'critical' ? 'text-industrial-red' : status === 'warning' ? 'text-industrial-amber' : 'text-cyan-tech'}`}>
              {valor != null ? valor.toFixed(1) : '--'} <span className="text-xs text-text-muted">{sensor.unidad?.simbolo}</span>
            </p>
          </div>
          <div className="rounded-lg border border-gridline bg-cyber-black p-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Mín / Máx</p>
            <p className="font-mono text-xl font-bold text-white">
              {min != null ? `${min.toFixed(1)} / ${max.toFixed(1)}` : '--'}
            </p>
          </div>
          <div className="rounded-lg border border-gridline bg-cyber-black p-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Promedio</p>
            <p className="font-mono text-xl font-bold text-white">{avg != null ? avg.toFixed(1) : '--'}</p>
          </div>
        </div>

        <div className="h-48 rounded-lg border border-gridline bg-cyber-black p-2">
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <XAxis dataKey="timestamp" hide />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#78909C', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Line type="monotone" dataKey="valor" stroke="#00E5FF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">Sin datos históricos</div>
          )}
        </div>
      </div>
    </div>
  );
}
