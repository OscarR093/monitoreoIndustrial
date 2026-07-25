import { useState, useEffect } from 'react';
import { icons, iconSize } from '../services/icons';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SettingsIcon = icons.settings;

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin';

  return (
    <div className="p-6 bg-cyber-black min-h-full">
      <h1 className="font-mono text-xl font-bold text-white flex items-center gap-2 mb-6">
        <SettingsIcon size={iconSize.header} className="text-cyan-tech" />
        Configuración
      </h1>

      <div className="space-y-6 max-w-2xl">
        <ProfileSection />
        {isAdmin && <AlarmChannelsSection />}
      </div>
    </div>
  );
}

function ProfileSection() {
  const { user, checkSession } = useAuth();
  const [nombre, setNombre] = useState(user?.nombreCompleto || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/api/auth/me', { nombreCompleto: nombre, email: email || null, telefono: telefono || null });
      checkSession?.();
      setMessage('Perfil actualizado');
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await api.put('/api/auth/me', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Contraseña actualizada');
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gridline bg-panel p-5">
      <h2 className="text-sm font-semibold text-white mb-4">Perfil</h2>

      <form onSubmit={handleSaveProfile} className="space-y-3 mb-6">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Nombre completo</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded border border-gridline bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyan-tech focus:outline-none" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border border-gridline bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyan-tech focus:outline-none" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Teléfono</label>
          <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full rounded border border-gridline bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyan-tech focus:outline-none" />
        </div>
        <button type="submit" disabled={saving} className="rounded bg-cyan-tech/20 px-4 py-1.5 text-xs text-cyan-tech hover:bg-cyan-tech/30 disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </form>

      <h3 className="text-sm font-semibold text-white mb-3">Cambiar contraseña</h3>
      <form onSubmit={handleChangePassword} className="space-y-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Contraseña actual</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full rounded border border-gridline bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyan-tech focus:outline-none" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Nueva contraseña</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full rounded border border-gridline bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyan-tech focus:outline-none" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Confirmar nueva contraseña</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full rounded border border-gridline bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyan-tech focus:outline-none" />
        </div>
        <button type="submit" disabled={saving} className="rounded bg-cyan-tech/20 px-4 py-1.5 text-xs text-cyan-tech hover:bg-cyan-tech/30 disabled:opacity-50">
          {saving ? 'Cambiando...' : 'Cambiar contraseña'}
        </button>
      </form>

      {message && <p className="mt-3 text-xs text-cyan-tech">{message}</p>}
    </div>
  );
}

function AlarmChannelsSection() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/api/configuracion-alarma')
      .then(setChannels)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getOrCreateChannel = (tipo) => {
    const existing = channels.find((c) => c.tipo === tipo);
    return existing || { tipo, activo: false, configJson: {} };
  };

  const handleSave = async (tipo, configJson, activo) => {
    setMessage('');
    const existing = channels.find((c) => c.tipo === tipo);

    try {
      if (existing) {
        await api.put(`/api/configuracion-alarma/${existing.id}`, { configJson: JSON.stringify(configJson), activo });
        setChannels((prev) => prev.map((c) => c.id === existing.id ? { ...c, configJson, activo } : c));
      } else {
        const created = await api.post('/api/configuracion-alarma', { tipo, configJson: JSON.stringify(configJson) });
        setChannels((prev) => [...prev, { ...created, configJson, activo: created.activo }]);
      }
      setMessage(`Canal ${tipo} guardado`);
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  if (loading) return <div className="rounded-xl border border-gridline bg-panel p-5 animate-pulse"><div className="h-6 w-48 bg-gridline/50 rounded mb-4" /></div>;

  return (
    <div className="rounded-xl border border-gridline bg-panel p-5">
      <h2 className="text-sm font-semibold text-white mb-4">Canales de Alarma</h2>

      <TelegramChannel channel={getOrCreateChannel('telegram')} onSave={handleSave} />
      <div className="my-4 border-t border-gridline" />
      <EmailChannel channel={getOrCreateChannel('email')} onSave={handleSave} />

      {message && <p className="mt-3 text-xs text-cyan-tech">{message}</p>}
    </div>
  );
}

function TelegramChannel({ channel, onSave }) {
  const [botToken, setBotToken] = useState(channel.configJson?.botToken || '');
  const [chatId, setChatId] = useState(channel.configJson?.chatId || '');
  const [activo, setActivo] = useState(channel.activo);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave('telegram', { botToken, chatId }, activo);
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-xs font-semibold text-white">Telegram</h3>
        <label className="flex items-center gap-1 text-xs text-text-muted">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="accent-cyan-tech" />
          Activo
        </label>
      </div>
      <div className="space-y-2">
        <input type="text" value={botToken} onChange={(e) => setBotToken(e.target.value)} placeholder="Bot Token" className="w-full rounded border border-gridline bg-cyber-black px-3 py-1.5 text-xs text-white focus:border-cyan-tech focus:outline-none" />
        <input type="text" value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="Chat ID" className="w-full rounded border border-gridline bg-cyber-black px-3 py-1.5 text-xs text-white focus:border-cyan-tech focus:outline-none" />
      </div>
      <button onClick={handleSave} disabled={saving} className="mt-2 rounded bg-cyan-tech/20 px-3 py-1 text-xs text-cyan-tech hover:bg-cyan-tech/30 disabled:opacity-50">
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
}

function EmailChannel({ channel, onSave }) {
  const [smtpHost, setSmtpHost] = useState(channel.configJson?.smtpHost || '');
  const [smtpPort, setSmtpPort] = useState(channel.configJson?.smtpPort || 587);
  const [username, setUsername] = useState(channel.configJson?.username || '');
  const [password, setPassword] = useState(channel.configJson?.password || '');
  const [fromEmail, setFromEmail] = useState(channel.configJson?.fromEmail || '');
  const [toEmail, setToEmail] = useState(channel.configJson?.toEmail || '');
  const [activo, setActivo] = useState(channel.activo);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave('email', { smtpHost, smtpPort, username, password, fromEmail, toEmail }, activo);
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-xs font-semibold text-white">Email (SMTP)</h3>
        <label className="flex items-center gap-1 text-xs text-text-muted">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="accent-cyan-tech" />
          Activo
        </label>
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="SMTP Host" className="flex-1 rounded border border-gridline bg-cyber-black px-3 py-1.5 text-xs text-white focus:border-cyan-tech focus:outline-none" />
          <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} placeholder="Puerto" className="w-24 rounded border border-gridline bg-cyber-black px-3 py-1.5 text-xs text-white focus:border-cyan-tech focus:outline-none" />
        </div>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full rounded border border-gridline bg-cyber-black px-3 py-1.5 text-xs text-white focus:border-cyan-tech focus:outline-none" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded border border-gridline bg-cyber-black px-3 py-1.5 text-xs text-white focus:border-cyan-tech focus:outline-none" />
        <input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="From Email" className="w-full rounded border border-gridline bg-cyber-black px-3 py-1.5 text-xs text-white focus:border-cyan-tech focus:outline-none" />
        <input type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} placeholder="To Email" className="w-full rounded border border-gridline bg-cyber-black px-3 py-1.5 text-xs text-white focus:border-cyan-tech focus:outline-none" />
      </div>
      <button onClick={handleSave} disabled={saving} className="mt-2 rounded bg-cyan-tech/20 px-3 py-1 text-xs text-cyan-tech hover:bg-cyan-tech/30 disabled:opacity-50">
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
}
