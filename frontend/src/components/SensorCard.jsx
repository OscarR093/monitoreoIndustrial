import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { icons, iconSize } from '../services/icons';

const ThermometerIcon = icons.temperature;
const GaugeIcon = icons.gauge;
const ActivityIcon = icons.activity;
const ZapIcon = icons.voltage;

function Sparkline({ data }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="valor" stroke="#00E5FF" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MiniGauge({ value, max }) {
  const pct = Math.min((value || 0) / (max || 100), 1);
  const data = [
    { name: 'value', value: pct },
    { name: 'remaining', value: 1 - pct },
  ];
  return (
    <ResponsiveContainer width="100%" height={40}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={12} outerRadius={18} startAngle={90} endAngle={-270} dataKey="value">
          <Cell fill="#00E5FF" />
          <Cell fill="#1A2433" />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

function MiniBar({ data }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <BarChart data={data}>
        <Bar dataKey="valor" fill="#00E5FF" radius={[1, 1, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const STATUS = {
  normal: 'border-l-industrial-green',
  warning: 'border-l-industrial-amber',
  critical: 'border-l-industrial-red border-red-500/30 animate-pulse',
};

export default function SensorCard({ sensor, valor }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className={`rounded-lg border-l-4 ${STATUS[status]} bg-panel p-3 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-gridline`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-xs text-text-muted">{sensor.sensorId}</span>
        <span className="text-text-muted">
          {tipoId === 1 && <ActivityIcon size={iconSize.inline} />}
          {tipoId === 2 && <GaugeIcon size={iconSize.inline} />}
          {tipoId === 3 && <ActivityIcon size={iconSize.inline} />}
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold text-white">
          {valor != null ? valor.toFixed(1) : '--'}
        </span>
        <span className="text-xs text-text-muted">{sensor.unidad?.simbolo || ''}</span>
      </div>

      <div className="mt-1 h-8">
        {loading && <div className="h-8 w-full rounded bg-gridline animate-pulse" />}
        {!loading && chartData.length > 0 && tipoId === 1 && <Sparkline data={chartData} />}
        {!loading && tipoId === 2 && <MiniGauge value={valor || 0} max={100} />}
        {!loading && chartData.length > 0 && tipoId === 3 && <MiniBar data={chartData.slice(-6)} />}
        {!loading && chartData.length === 0 && tipoId !== 2 && (
          <div className="h-8 flex items-center justify-center text-xs text-text-muted">sin datos</div>
        )}
      </div>

      <p className="mt-1 truncate text-xs text-text-muted">{sensor.nombre}</p>
    </div>
  );
}
