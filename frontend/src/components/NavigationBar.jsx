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
    connected: { icon: Plug, color: 'text-industrial-green bg-industrial-green/10 border-industrial-green/30', label: 'CONECTADO' },
    reconnecting: { icon: RotateCw, color: 'text-industrial-amber bg-industrial-amber/10 border-industrial-amber/30 animate-spin', label: 'RECONECTANDO' },
    disconnected: { icon: WifiOff, color: 'text-industrial-red bg-industrial-red/10 border-industrial-red/30', label: 'DESCONECTADO' },
  };
  const status = statusConfig[wsStatus] || statusConfig.disconnected;
  const StatusIcon = status.icon;

  return (
    <header className="flex items-center justify-between bg-panel px-5 py-3 border-b-2 border-cyan-tech/20 shadow-lg shadow-cyan-tech/5">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-black text-cyan-tech tracking-[0.2em]">SCADA</span>
          <span className="h-4 w-px bg-gridline" />
          <span className="text-[10px] uppercase tracking-widest text-text-muted font-medium">Monitoreo Industrial</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded border border-gridline bg-cyber-black px-3 py-1.5">
            <label className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Planta</label>
            <select
              value={selectedPlanta}
              onChange={(e) => onPlantaChange(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none min-w-[100px]"
            >
              <option value="" className="bg-cyber-black">Seleccionar...</option>
              {plantas.map((p) => (
                <option key={p.id} value={p.codigo} className="bg-cyber-black">{p.nombre}</option>
              ))}
            </select>
          </div>

          {selectedPlanta && (
            <div className="flex items-center gap-2 rounded border border-gridline bg-cyber-black px-3 py-1.5">
              <label className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Área</label>
              <select
                value={selectedArea}
                onChange={(e) => onAreaChange(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none min-w-[100px]"
              >
                <option value="" className="bg-cyber-black">Seleccionar...</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.codigo} className="bg-cyber-black">{a.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider font-bold ${status.color}`}>
          <StatusIcon size={iconSize.inline} />
          <span>{status.label}</span>
        </div>

        {alertCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-industrial-amber/40 bg-industrial-amber/10 px-3 py-1">
            <AlertTriangle size={iconSize.inline} className="text-industrial-amber" />
            <span className="font-mono text-xs font-bold text-industrial-amber">{alertCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-industrial-amber/70">Alertas</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button onClick={onExpandAll} className="rounded p-1.5 text-text-muted hover:bg-cyber-black hover:text-cyan-tech transition-colors" title="Expandir zonas">
            <Expand size={iconSize.inline} />
          </button>
          <button onClick={onCollapseAll} className="rounded p-1.5 text-text-muted hover:bg-cyber-black hover:text-cyan-tech transition-colors" title="Colapsar zonas">
            <Shrink size={iconSize.inline} />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {lastUpdate ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-text-muted">Último dato</span>
              <span className="font-mono text-cyan-tech font-bold">{lastUpdate.toLocaleTimeString()}</span>
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
