import { useState, useEffect } from 'react';
import SensorCard from './SensorCard';
import { icons, iconSize } from '../services/icons';

const ChevronDownIcon = icons.chevronDown;
const ChevronRightIcon = icons.chevronRight;

const ZONE_ICONS = {
  'Temperaturas': icons.temperature,
  'Presiones': icons.gauge,
  'Eléctricos': icons.voltage,
  'Motores': icons.activity,
  'General': icons.settings,
};

export default function SensorZone({ name, sensores, realtimeData, storageKey, forceExpand, forceCollapse, onSensorUpdate }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(storageKey) === 'true'; }
    catch { return false; }
  });

  useEffect(() => {
    if (forceExpand > 0) setCollapsed(false);
  }, [forceExpand]);

  useEffect(() => {
    if (forceCollapse > 0) setCollapsed(true);
  }, [forceCollapse]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, String(collapsed)); }
    catch {}
  }, [collapsed, storageKey]);

  const activeCount = sensores.filter((s) => realtimeData[s.sensorId] != null).length;
  const ZoneIcon = ZONE_ICONS[name] || ZONE_ICONS['General'];

  return (
    <div className="mb-5">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-3 w-full rounded-t-lg border border-gridline bg-panel px-4 py-2.5 hover:border-cyan-tech/30 transition-colors group"
      >
        <ZoneIcon size={16} className="text-cyan-tech/70 group-hover:text-cyan-tech transition-colors" />
        <span className="text-sm font-semibold text-white uppercase tracking-wider">{name}</span>
        <span className="text-[10px] text-text-muted ml-auto font-mono">
          {activeCount}/{sensores.length} activos
        </span>
        {collapsed ? <ChevronRightIcon size={14} className="text-text-muted" /> : <ChevronDownIcon size={14} className="text-text-muted" />}
      </button>

      {!collapsed && (
        <div className="border-l border-r border-b border-gridline rounded-b-lg bg-cyber-black/30 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sensores.map((s) => (
              <SensorCard key={s.id} sensor={s} valor={realtimeData[s.sensorId]} onSensorUpdate={onSensorUpdate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
