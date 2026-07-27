import { useState, useEffect } from 'react';
import { icons } from '../services/icons';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SettingsIcon = icons.settings;
const LockIcon = icons.lock;
const BellIcon = icons.bell;
const UserIcon = icons.user;
const XIcon = icons.close;
const EditIcon = icons.edit;

const CHANNEL_ICONS = {
  telegram: icons.send,
  email: icons.mail,
  whatsapp: icons.message,
  sms: icons.smartphone,
};

const CHANNELS = [
  { tipo: 'telegram', label: 'Telegram', desc: 'Notificaciones vía Bot API', fields: [
    { key: 'botToken', label: 'Bot Token', placeholder: '123456:ABC-DEF1234gh...', helper: 'Obtenlo en @BotFather' },
    { key: 'chatId', label: 'Chat ID', placeholder: '123456789' },
  ]},
  { tipo: 'email', label: 'Email (Resend)', desc: 'API de envío transaccional', fields: [
    { key: 'apiKey', label: 'API Key', placeholder: 're_...', helper: 'https://resend.com/api-keys' },
    { key: 'fromEmail', label: 'Remitente', placeholder: 'alertas@miplanta.com' },
  ]},
  { tipo: 'whatsapp', label: 'WhatsApp', desc: 'Meta Business API', fields: [
    { key: 'phoneNumberId', label: 'Phone Number ID', placeholder: '12345...' },
    { key: 'accessToken', label: 'Access Token', placeholder: 'EAA...' },
  ]},
  { tipo: 'sms', label: 'SMS', desc: 'Twilio API', fields: [
    { key: 'accountSid', label: 'Account SID', placeholder: 'AC...' },
    { key: 'authToken', label: 'Auth Token', placeholder: '...'},
    { key: 'fromNumber', label: 'Número origen', placeholder: '+1234567890' },
  ]},
];

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin';

  return (
    <div className="p-6 bg-cyber-black min-h-full">
      <h1 className="font-mono text-xl font-bold text-white flex items-center gap-2 mb-6">
        <SettingsIcon size={20} className="text-acento" />
        Configuración
      </h1>

      <div className="space-y-5 max-w-2xl">
        <ProfileSection icon={UserIcon} />
        <SecuritySection icon={LockIcon} />
        {isAdmin && <AlarmChannelsSection icon={BellIcon} />}
      </div>
    </div>
  );
}

function ProfileSection({ icon }) {
  const { user, checkSession } = useAuth();
  const [nombre, setNombre] = useState(user?.nombreCompleto || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentPassword) { setMsg({ ok: false, text: 'Ingresa tu contraseña actual' }); return; }
    setSaving(true);
    setMsg(null);
    try {
      await api.put('/api/auth/me', { nombreCompleto: nombre, email: email || null, telefono: telefono || null, currentPassword });
      checkSession?.();
      setCurrentPassword('');
      setMsg({ ok: true, text: 'Perfil actualizado' });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <Card title="Perfil" icon={icon}>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre completo" value={nombre} onChange={setNombre} placeholder="Juan Pérez" />
          <Field label="Email" value={email} onChange={setEmail} placeholder="juan@miplanta.com" type="email" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Teléfono" value={telefono} onChange={setTelefono} placeholder="+52 123 456 7890" />
          <Field label="Contraseña actual" value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="••••••" />
        </div>
        <button type="submit" disabled={saving}
          className="w-full rounded bg-acento py-2 text-sm font-semibold text-cyber-black hover:bg-acento/80 disabled:opacity-50 transition-colors">
          {saving ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </form>
      {msg && <p className={`mt-2 text-xs ${msg.ok ? 'text-industrial-green' : 'text-industrial-red'}`}>{msg.text}</p>}
    </Card>
  );
}

function SecuritySection({ icon }) {
  const { user } = useAuth();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [pinSent, setPinSent] = useState(false);
  const [pin, setPin] = useState('');
  const [devPin, setDevPin] = useState(null);
  const [pinMsg, setPinMsg] = useState(null);
  const [pinSaving, setPinSaving] = useState(false);
  const [timer, setTimer] = useState(null);

  const handleSendPin = async () => {
    if (newPw !== confirmPw) { setMsg({ text: 'Las contraseñas no coinciden' }); return; }
    if (newPw.length < 4) { setMsg({ text: 'Mínimo 4 caracteres' }); return; }
    setMsg(null);
    setSaving(true);
    try {
      const data = await api.post('/api/auth/send-pin', { currentPassword: currentPw });
      setPinSent(true);
      if (data.pin) setDevPin(data.pin);
      setPinMsg({ text: data.emailSent ? 'PIN enviado a tu email' : 'Ingresa el PIN mostrado en consola del servidor' });
      setTimer(300);
    } catch (err) {
      setMsg({ text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyPin = async () => {
    if (pin.length !== 6) { setPinMsg({ text: 'El PIN debe tener 6 dígitos' }); return; }
    setPinSaving(true);
    try {
      await api.post('/api/auth/verify-pin', { pin, newPassword: newPw });
      setPinSent(false);
      setPin('');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setDevPin(null);
      setTimer(null);
      setMsg({ ok: true, text: 'Contraseña actualizada' });
    } catch (err) {
      setPinMsg({ text: err.message });
    } finally {
      setPinSaving(false);
      setTimeout(() => { setPinMsg(null); setMsg(null); }, 3000);
    }
  };

  useEffect(() => {
    if (!timer) return;
    if (timer <= 0) { setTimer(null); setPinMsg({ text: 'PIN expirado, solicita uno nuevo' }); return; }
    const id = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const fm = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <Card title="Seguridad" danger icon={icon}>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Field label="Contraseña actual" value={currentPw} onChange={setCurrentPw} type="password" placeholder="••••••" />
        <Field label="Nueva contraseña" value={newPw} onChange={setNewPw} type="password" placeholder="mín. 4 caracteres" />
        <Field label="Confirmar" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="repite la nueva" />
      </div>

      {!pinSent ? (
        <button onClick={handleSendPin} disabled={saving || !currentPw || !newPw || !confirmPw}
          className="w-full rounded border border-industrial-red/30 bg-industrial-red/10 py-2 text-sm font-semibold text-industrial-red hover:bg-industrial-red/20 disabled:opacity-40 transition-colors">
          {saving ? 'Verificando...' : 'Cambiar contraseña'}
        </button>
      ) : (
        <div className="rounded-lg border border-acento/30 bg-cyber-black p-4">
          <p className="text-xs text-text-muted mb-3">
            Ingresa el PIN de 6 dígitos {devPin ? null : 'enviado a tu email'}
            {devPin && <span className="text-acento ml-1">[DEV: {devPin}]</span>}
          </p>
          <div className="flex items-center gap-3">
            <input type="text" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6} placeholder="______" aria-label="Código PIN"
              className="w-32 rounded border border-gridline bg-cyber-black px-3 py-2 text-center font-mono text-lg tracking-[8px] text-acento placeholder:text-text-muted focus:border-acento focus:outline-none" />
            <span className="text-xs text-text-muted font-mono">{timer ? fm(timer) : '--:--'}</span>
            <button onClick={handleVerifyPin} disabled={pinSaving || pin.length !== 6}
              className="rounded bg-acento px-4 py-2 text-xs font-semibold text-cyber-black hover:bg-acento/80 disabled:opacity-50">
              {pinSaving ? '...' : 'Verificar'}
            </button>
            <button onClick={() => { setPinSent(false); setDevPin(null); setTimer(null); }}
              className="text-xs text-text-muted hover:text-white">Cancelar</button>
          </div>
          {pinMsg && <p className="mt-2 text-xs text-acento">{pinMsg.text}</p>}
          {timer && timer < 60 && (
            <button onClick={handleSendPin} className="mt-2 text-xs text-acento hover:text-white block">Reenviar código</button>
          )}
        </div>
      )}

      {msg && <p className={`mt-2 text-xs ${msg.ok ? 'text-industrial-green' : 'text-industrial-red'}`}>{msg.text}</p>}
    </Card>
  );
}

function AlarmChannelsSection({ icon }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(null);

  useEffect(() => {
    api.get('/api/configuracion-alarma')
      .then(setChannels)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getChannelState = (tipo) => {
    const c = channels.find((ch) => ch.tipo === tipo);
    return c || null;
  };

  if (loading) return (
    <div className="rounded-xl border border-gridline bg-panel p-5 animate-pulse">
      <div className="h-5 w-48 bg-gridline/50 rounded mb-4" />
      <div className="space-y-2"><div className="h-9 bg-gridline/50 rounded" /><div className="h-9 bg-gridline/50 rounded" /></div>
    </div>
  );

  return (
    <Card title="Canales de Alarma" icon={icon}>
      <div className="space-y-2">
        {CHANNELS.map((ch) => {
          const state = getChannelState(ch.tipo);
          const active = state?.activo || false;
          return (
            <button key={ch.tipo} onClick={() => setModalOpen(ch)}
              className="w-full flex items-center gap-3 rounded-lg border border-gridline bg-cyber-black px-4 py-3 text-left hover:border-acento/30 transition-colors group">
              {(() => { const Icon = CHANNEL_ICONS[ch.tipo]; return <Icon size={18} className={`shrink-0 ${active ? 'text-acento' : 'text-text-muted/50 group-hover:text-text-muted'}`} />; })()}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{ch.label}</p>
                <p className="text-[11px] text-text-muted truncate">{ch.desc}</p>
              </div>
              {active && <span className="text-[10px] text-industrial-green font-mono">ACTIVO</span>}
              <EditIcon size={14} className="text-text-muted/40 group-hover:text-acento shrink-0" />
            </button>
          );
        })}
      </div>

      {modalOpen && (
        <ChannelModal channel={modalOpen} existing={getChannelState(modalOpen.tipo)}
          onClose={() => setModalOpen(null)}
          onSaved={(saved) => {
            setChannels((prev) => {
              const idx = prev.findIndex((c) => c.tipo === saved.tipo);
              if (idx >= 0) { const cp = [...prev]; cp[idx] = saved; return cp; }
              return [...prev, saved];
            });
          }} />
      )}
    </Card>
  );
}

function ChannelModal({ channel, existing, onClose, onSaved }) {
  const ChannelIcon = CHANNEL_ICONS[channel.tipo];
  const [fields, setFields] = useState(() => {
    const vals = {};
    channel.fields.forEach((f) => {
      vals[f.key] = existing?.configJson?.[f.key] || '';
    });
    return vals;
  });
  const [activo, setActivo] = useState(existing?.activo || false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const configJson = JSON.stringify(fields);
      let result;
      if (existing) {
        await api.put(`/api/configuracion-alarma/${existing.id}`, { configJson, activo });
        result = { ...existing, configJson: fields, activo };
      } else {
        result = await api.post('/api/configuracion-alarma', { tipo: channel.tipo, configJson });
        result = { ...result, configJson: fields, activo };
      }
      onSaved(result);
      setMsg('Guardado correctamente');
      setTimeout(onClose, 1000);
    } catch (err) {
      setMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="w-full max-w-md rounded-xl border border-gridline bg-panel p-6" aria-labelledby="channel-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2" id="channel-modal-title">
            <ChannelIcon size={20} className="text-acento" />
            {channel.label}
          </h2>
          <button onClick={onClose} className="rounded p-1 min-w-[32px] min-h-[32px] flex items-center justify-center text-text-muted hover:bg-cyber-black hover:text-white" aria-label="Cerrar"><XIcon size={18} /></button>
        </div>

        <p className="text-xs text-text-muted mb-4">{channel.desc}</p>

        <div className="space-y-3">
          {channel.fields.map((f) => (
            <div key={f.key}>
              <label htmlFor={`channel-field-${f.key}`} className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">{f.label}</label>
              <input id={`channel-field-${f.key}`} type={f.key.includes('token') || f.key.includes('Token') || f.key.includes('key') ? 'password' : 'text'}
                value={fields[f.key] || ''} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                placeholder={f.placeholder} className="w-full rounded border border-gridline bg-cyber-black px-3 py-2 text-xs text-white placeholder:text-text-muted focus:border-acento focus:outline-none" />
              {f.helper && <p className="text-[10px] text-text-muted/60 mt-0.5">{f.helper}</p>}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gridline">
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="accent-acento" />
            Activo
          </label>
          <button onClick={handleSave} disabled={saving}
            className="rounded bg-acento px-5 py-2 text-sm font-semibold text-cyber-black hover:bg-acento/80 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        {msg && <p className={`mt-2 text-xs ${msg.includes('Error') ? 'text-industrial-red' : 'text-acento'}`}>{msg}</p>}
      </div>
    </div>
  );
}

function Card({ title, danger, icon: Icon, children }) {
  return (
    <div className={`rounded-xl border ${danger ? 'border-industrial-red/20' : 'border-gridline'} bg-panel p-5`}>
      <h2 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${danger ? 'text-industrial-red' : 'text-white'}`}>
        {Icon && <Icon size={16} />}
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type, placeholder }) {
  const id = `field-${label}`;
  return (
    <div>
      <label htmlFor={id} className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">{label}</label>
      <input id={id} type={type || 'text'} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} className="w-full rounded border border-gridline bg-cyber-black px-3 py-2 text-sm text-white placeholder:text-text-muted focus:border-acento focus:outline-none" />
    </div>
  );
}
