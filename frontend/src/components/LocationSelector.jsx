import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { icons } from '../services/icons';
import { getAreaDisplayName, getPlantaDisplayName, getAreaIdentifier } from '../services/displayNames';

const EditIcon = icons.edit;
const XIcon = icons.close;

export default function LocationSelector({
  plantas: plantasProp, areas, selectedPlanta, selectedArea,
  onPlantaChange, onAreaChange,
}) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin';

  const [localPlantas, setLocalPlantas] = useState(plantasProp);

  if (JSON.stringify(localPlantas.map((p) => p.id).sort()) !== JSON.stringify(plantasProp.map((p) => p.id).sort())) {
    setLocalPlantas(plantasProp);
  }

  const [editingPlantaId, setEditingPlantaId] = useState(null);
  const [editPlantaNombre, setEditPlantaNombre] = useState('');
  const [editPlantaAlias, setEditPlantaAlias] = useState('');

  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editAlias, setEditAlias] = useState('');
  const [localAreas, setLocalAreas] = useState(areas);

  if (JSON.stringify(localAreas.map((a) => a.id).sort()) !== JSON.stringify(areas.map((a) => a.id).sort())) {
    setLocalAreas(areas);
  }

  const selectedPlantaObj = localPlantas.find((p) => p.codigo === selectedPlanta);
  const selectedAreaObj = localAreas.find((a) => a.codigo === selectedArea);

  const handleSavePlanta = async () => {
    if (!selectedPlantaObj) return;
    try {
      await api.put(`/api/plantas/${selectedPlantaObj.id}`, {
        nombre: editPlantaNombre.trim() || null,
        alias: editPlantaAlias.trim() || null,
      });
      setLocalPlantas((prev) =>
        prev.map((p) => (p.id === selectedPlantaObj.id ? { ...p, nombre: editPlantaNombre.trim() || p.nombre, alias: editPlantaAlias.trim() || null } : p))
      );
      setEditingPlantaId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveAreaAlias = async () => {
    if (!selectedAreaObj) return;
    try {
      await api.put(`/api/areas/${selectedAreaObj.id}`, { alias: editAlias.trim() || null });
      setLocalAreas((prev) =>
        prev.map((a) => (a.id === selectedAreaObj.id ? { ...a, alias: editAlias.trim() || null } : a))
      );
      setEditingAreaId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex items-center gap-4 border-b border-gridline bg-panel px-5 py-3">
      <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Ubicación</span>

      <div className="flex items-center gap-2 rounded border border-gridline bg-cyber-black px-3 py-2">
        <label className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Planta</label>
        <select
          value={selectedPlanta}
          onChange={(e) => onPlantaChange(e.target.value)}
          className="bg-transparent text-sm text-white focus:outline-none min-w-[120px]"
        >
          <option value="" className="bg-cyber-black">Seleccionar...</option>
          {localPlantas.map((p) => (
            <option key={p.id} value={p.codigo} className="bg-cyber-black">{getPlantaDisplayName(p)}</option>
          ))}
        </select>

        {isAdmin && selectedPlantaObj && (
          editingPlantaId === selectedPlantaObj.id ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editPlantaNombre}
                onChange={(e) => setEditPlantaNombre(e.target.value)}
                className="w-24 rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none"
                placeholder="Nombre"
              />
              <input
                type="text"
                value={editPlantaAlias}
                onChange={(e) => setEditPlantaAlias(e.target.value)}
                className="w-24 rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none"
                placeholder="Alias"
              />
              <button onClick={handleSavePlanta} className="text-cyan-tech hover:text-white"><EditIcon size={14} /></button>
              <button onClick={() => setEditingPlantaId(null)} className="text-text-muted hover:text-white"><XIcon size={14} /></button>
            </div>
          ) : (
            <button
              onClick={() => { setEditingPlantaId(selectedPlantaObj.id); setEditPlantaNombre(selectedPlantaObj.nombre || ''); setEditPlantaAlias(selectedPlantaObj.alias || ''); }}
              className="text-text-muted/60 hover:text-cyan-tech transition-colors"
              title="Editar nombre de planta"
            >
              <EditIcon size={14} />
            </button>
          )
        )}
      </div>

      {selectedPlanta && (
        <div className="flex items-center gap-2 rounded border border-gridline bg-cyber-black px-3 py-2">
          <label className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Área</label>
          <select
            value={selectedArea}
            onChange={(e) => onAreaChange(e.target.value)}
            className="bg-transparent text-sm text-white focus:outline-none min-w-[120px]"
          >
            <option value="" className="bg-cyber-black">Seleccionar...</option>
            {localAreas.map((a) => (
              <option key={a.id} value={a.codigo} className="bg-cyber-black">{getAreaDisplayName(a)}</option>
            ))}
          </select>

          {isAdmin && selectedAreaObj && (
            editingAreaId === selectedAreaObj.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editAlias}
                  onChange={(e) => setEditAlias(e.target.value)}
                  className="w-32 rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white focus:border-cyan-tech focus:outline-none"
                  placeholder="Alias área"
                />
                <button onClick={handleSaveAreaAlias} className="text-cyan-tech hover:text-white"><EditIcon size={14} /></button>
                <button onClick={() => setEditingAreaId(null)} className="text-text-muted hover:text-white"><XIcon size={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingAreaId(selectedAreaObj.id); setEditAlias(selectedAreaObj.alias || ''); }}
                className="text-text-muted/60 hover:text-cyan-tech transition-colors"
                title={`Editar alias de ${getAreaIdentifier(selectedAreaObj)}`}
              >
                <EditIcon size={14} />
              </button>
            )
          )}
        </div>
      )}

      {!selectedArea && (
        <span className="text-xs text-text-muted">Seleccione planta y área para ver sensores</span>
      )}
    </div>
  );
}
