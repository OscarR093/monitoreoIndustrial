import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { icons, iconSize } from '../services/icons';

const ActivityIcon = icons.activity;
const GaugeIcon = icons.gauge;
const ThermometerIcon = icons.temperature;
const ZapIcon = icons.voltage;

function Sparkline({ data }) {
  if (!data || data.length < 2) {
    return <div className="h-9 flex items-center justify-center text-[10px] text-text-muted/50">sin historial</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="valor" stroke="#00E5FF" strokeWidth={2} dot={false} />
      </LineChart>
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
    <ResponsiveContainer width="100%" height={50}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={15} outerRadius={22} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
          <Cell fill="#00E5FF" />
          <Cell fill="#1A2433" />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

function MiniBar({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-9 flex items-center justify-center text-[10px] text-text-muted/50">sin historial</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={36}>
      <BarChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Bar dataKey="valor" fill="#00E5FF" radius={[2, 2, 0, 0]} maxBarSize={8} />
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
    <div className={`rounded-lg border-l-4 ${STATUS[status]} bg-panel p-3.5 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gridline hover:border-cyan-tech/30 group`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted/70 font-semibold">{sensor.sensorId}</span>
        {tipoId === 1 && <ActivityIcon size={12} className="text-text-muted/40" />}
        {tipoId === 2 && <GaugeIcon size={12} className="text-text-muted/40" />}
        {tipoId === 3 && <ActivityIcon size={12} className="text-text-muted/40" />}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-[28px] font-bold text-white leading-none tabular-nums">
          {valor != null ? valor.toFixed(1) : '--'}
        </span>
        <span className="text-xs text-text-muted font-medium">{sensor.unidad?.simbolo || ''}</span>
      </div>

      <div className="mt-2">
        {loading && <div className="h-9 w-full rounded bg-gridline/50 animate-pulse" />}
        {!loading && tipoId === 1 && <Sparkline data={chartData} />}
        {!loading && tipoId === 2 && <MiniGauge value={valor || 0} max={100} />}
        {!loading && tipoId === 3 && <MiniBar data={chartData.slice(-8)} />}
      </div>

      <div className="mt-2 pt-2 border-t border-gridline/50">
        <p className="truncate text-[11px] text-text-muted font-medium">{sensor.nombre}</p>
      </div>

      <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg ${
        status === 'critical' ? 'bg-industrial-red' : status === 'warning' ? 'bg-industrial-amber' : 'bg-industrial-green/50'
      }`} />
    </div>
  );
}
