import { icons, iconSize } from '../services/icons';

const { settings: SettingsIcon } = icons;

export default function Settings() {
  return (
    <div className="p-6 bg-cyber-black min-h-full">
      <h1 className="font-mono text-xl font-bold text-white flex items-center gap-2">
        <SettingsIcon size={iconSize.header} className="text-cyan-tech" />
        Configuración
      </h1>
      <p className="mt-4 text-sm text-text-muted">Opciones de configuración del sistema estarán disponibles próximamente.</p>
    </div>
  );
}
