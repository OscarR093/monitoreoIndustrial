import { useEffect, useState } from 'react';
import { icons, iconSize } from '../services/icons';

const AlertTriangle = icons.alert;
const Plug = icons.connected;
const WifiOff = icons.disconnected;
const RotateCw = icons.reconnecting;
const Expand = icons.expand;
const Shrink = icons.shrink;

export default function NavigationBar({
  wsStatus, alertCount, lastUpdate,
  onExpandAll, onCollapseAll,
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const statusConfig = {
    connected: { icon: Plug, color: 'text-industrial-green bg-industrial-green/10 border-industrial-green/30', label: 'CONECTADO' },
    reconnecting: { icon: RotateCw, color: 'text-industrial-amber bg-industrial-amber/10 border-industrial-amber/30 animate-spin', label: 'RECONECTANDO' },
    disconnected: { icon: WifiOff, color: 'text-industrial-red bg-industrial-red/10 border-industrial-red/30', label: 'DESCONECTADO' },
  };
  const status = statusConfig[wsStatus] || statusConfig.disconnected;
  const StatusIcon = status.icon;

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 bg-panel px-5 py-3 border-b-2 border-acento/20" role="banner">
      <div className="flex items-center gap-2">
        <h1 className="font-mono text-base font-black text-acento tracking-[0.2em]">SCADA</h1>
        <span className="h-4 w-px bg-gridline" />
        <span className="text-[10px] uppercase tracking-widest text-text-muted font-medium">Monitoreo Industrial</span>
      </div>

      <div className="flex items-center gap-5">
        <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider font-bold ${status.color}`}>
          <StatusIcon size={iconSize.inline} />
          <span>{status.label}</span>
        </div>

        {alertCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-industrial-amber/40 bg-industrial-amber/10 px-3 py-1 animate-alert-pulse">
            <AlertTriangle size={iconSize.inline} className="text-industrial-amber" />
            <span className="font-mono text-xs font-bold text-industrial-amber">{alertCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-industrial-amber/70">Alertas</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button onClick={onExpandAll} className="rounded p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-text-muted hover:bg-cyber-black hover:text-acento transition-colors" title="Expandir zonas" aria-label="Expandir todas las zonas">
            <Expand size={iconSize.inline} />
          </button>
          <button onClick={onCollapseAll} className="rounded p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-text-muted hover:bg-cyber-black hover:text-acento transition-colors" title="Colapsar zonas" aria-label="Colapsar todas las zonas">
            <Shrink size={iconSize.inline} />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {lastUpdate ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-text-muted">Último dato</span>
              <span className="font-mono text-acento font-bold">{lastUpdate.toLocaleTimeString()}</span>
            </div>
          ) : (
            <span className="font-mono text-text-muted text-xs">--:--:--</span>
          )}
          <span className="h-4 w-px bg-gridline" />
          <span className="font-mono text-sm text-white font-bold">{time.toLocaleTimeString()}</span>
        </div>
      </div>
    </header>
  );
}
