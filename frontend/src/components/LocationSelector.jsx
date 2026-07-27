import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { icons } from '../services/icons';
import { getAreaDisplayName, getPlantaDisplayName, getAreaIdentifier } from '../services/displayNames';

const EditIcon = icons.edit;
const XIcon = icons.close;

export default function LocationSelector({
  plantas, areas, selectedPlanta, selectedArea,
  onPlantaChange, onAreaChange,
}) {
  const { user } = useAuth();
  const showToast = useToast();
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin';

  const [localPlantas, setLocalPlantas] = useState(plantas);

  if (JSON.stringify(localPlantas.map((p) => p.id).sort()) !== JSON.stringify(plantas.map((p) => p.id).sort())) {
    setLocalPlantas(plantas);
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
      showToast(err.message);
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
      showToast(err.message);
    }
  };

  return (
    <div className="flex items-center gap-4 border-b border-gridline bg-panel px-5 py-3">
      <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Ubicación</span>

      <div className="flex items-center gap-2 rounded border border-gridline bg-cyber-black px-3 py-2">
        <label htmlFor="select-planta" className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Planta</label>
        <select
          id="select-planta"
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
                className="w-24 rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white placeholder:text-text-muted focus:border-acento focus:outline-none"
                placeholder="Nombre"
                aria-label="Nombre de planta"
              />
              <input
                type="text"
                value={editPlantaAlias}
                onChange={(e) => setEditPlantaAlias(e.target.value)}
                className="w-24 rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white placeholder:text-text-muted focus:border-acento focus:outline-none"
                placeholder="Alias"
                aria-label="Alias de planta"
              />
              <button onClick={handleSavePlanta} className="text-acento hover:text-white" aria-label="Guardar nombre de planta"><EditIcon size={14} /></button>
              <button onClick={() => setEditingPlantaId(null)} className="text-text-muted hover:text-white" aria-label="Cancelar edición"><XIcon size={14} /></button>
            </div>
          ) : (
            <button
              onClick={() => { setEditingPlantaId(selectedPlantaObj.id); setEditPlantaNombre(selectedPlantaObj.nombre || ''); setEditPlantaAlias(selectedPlantaObj.alias || ''); }}
              className="text-text-muted/60 hover:text-acento transition-colors"
              title="Editar nombre de planta"
              aria-label="Editar nombre de planta"
            >
              <EditIcon size={14} />
            </button>
          )
        )}
      </div>

      {selectedPlanta && (
        <div className="flex items-center gap-2 rounded border border-gridline bg-cyber-black px-3 py-2">
          <label htmlFor="select-area" className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Área</label>
          <select
            id="select-area"
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
                  className="w-32 rounded border border-gridline bg-cyber-black px-2 py-1 text-xs text-white placeholder:text-text-muted focus:border-acento focus:outline-none"
                  placeholder="Alias área"
                  aria-label="Alias de área"
                />
                <button onClick={handleSaveAreaAlias} className="text-acento hover:text-white" aria-label="Guardar alias de área"><EditIcon size={14} /></button>
                <button onClick={() => setEditingAreaId(null)} className="text-text-muted hover:text-white" aria-label="Cancelar edición"><XIcon size={14} /></button>
              </div>
            ) : (
                <button
                  onClick={() => { setEditingAreaId(selectedAreaObj.id); setEditAlias(selectedAreaObj.alias || ''); }}
                  className="text-text-muted/60 hover:text-acento transition-colors"
                  title={`Editar alias de ${getAreaIdentifier(selectedAreaObj)}`}
                  aria-label="Editar alias de área"
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
