import { useState, useEffect } from 'react';
import SensorCard from './SensorCard';
import { icons, iconSize } from '../services/icons';

const ChevronDownIcon = icons.chevronDown;
const ChevronRightIcon = icons.chevronRight;

export default function SensorZone({ name, sensores, realtimeData, storageKey }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch { return false; }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, collapsed);
    } catch {}
  }, [collapsed, storageKey]);

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full rounded px-3 py-2 text-sm font-medium text-text-muted hover:bg-panel hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRightIcon size={iconSize.inline} /> : <ChevronDownIcon size={iconSize.inline} />}
        <span>{name}</span>
        <span className="text-xs text-text-muted ml-auto">{sensores.length}</span>
      </button>

      {!collapsed && (
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sensores.map((s) => (
            <SensorCard key={s.id} sensor={s} valor={realtimeData[s.sensorId]} />
          ))}
        </div>
      )}
    </div>
  );
}
