import { useEffect, useState } from 'react';
import { icons, iconSize } from '../services/icons';

const AlertTriangle = icons.alert;
const Plug = icons.connected;
const WifiOff = icons.disconnected;
const RotateCw = icons.reconnecting;
const Expand = icons.expand;
const Shrink = icons.shrink;

export default function NavigationBar({
  plantas, areas, selectedPlanta, selectedArea,
  onPlantaChange, onAreaChange,
  wsStatus, alertCount, lastUpdate,
  onExpandAll, onCollapseAll,
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const statusConfig = {
    connected: { icon: Plug, color: 'text-industrial-green', label: 'Conectado' },
    reconnecting: { icon: RotateCw, color: 'text-industrial-amber animate-spin', label: 'Reconectando' },
    disconnected: { icon: WifiOff, color: 'text-industrial-red', label: 'Desconectado' },
  };
  const status = statusConfig[wsStatus] || statusConfig.disconnected;
  const StatusIcon = status.icon;

  return (
    <header className="flex items-center justify-between bg-panel border-b border-gridline px-4 py-2">
      <div className="flex items-center gap-4">
        <span className="font-mono text-sm font-bold text-cyan-tech tracking-wider">
          SCADA
        </span>

        <div className="flex items-center gap-2">
          <select
            value={selectedPlanta}
            onChange={(e) => onPlantaChange(e.target.value)}
            className="rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none"
          >
            <option value="">Planta</option>
            {plantas.map((p) => (
              <option key={p.id} value={p.codigo}>{p.nombre}</option>
            ))}
          </select>

          {selectedPlanta && (
            <select
              value={selectedArea}
              onChange={(e) => onAreaChange(e.target.value)}
              className="rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none"
            >
              <option value="">Área</option>
              {areas.map((a) => (
                <option key={a.id} value={a.codigo}>{a.nombre}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 text-xs ${status.color}`}>
            <StatusIcon size={iconSize.inline} />
            <span>{status.label}</span>
          </div>

          {alertCount > 0 && (
            <div className="flex items-center gap-1 rounded bg-industrial-amber/20 px-2 py-0.5 text-xs text-industrial-amber">
              <AlertTriangle size={iconSize.inline} />
              <span>{alertCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onExpandAll} className="rounded p-1 text-text-muted hover:bg-gridline hover:text-white transition-colors" title="Expandir Todo">
            <Expand size={iconSize.inline} />
          </button>
          <button onClick={onCollapseAll} className="rounded p-1 text-text-muted hover:bg-gridline hover:text-white transition-colors" title="Colapsar Todo">
            <Shrink size={iconSize.inline} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          {lastUpdate ? (
            <span className="font-mono text-cyan-tech">{lastUpdate.toLocaleTimeString()}</span>
          ) : (
            <span className="text-text-muted">--:--:--</span>
          )}
          <span className="font-mono text-text-muted">{time.toLocaleTimeString()}</span>
        </div>
      </div>
    </header>
  );
}
