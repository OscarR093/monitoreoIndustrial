import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CompleteProfile() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { completeProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await completeProfile({ nombreCompleto: nombre, email, telefono, nuevaPassword });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-slate-800 p-8 shadow-2xl border border-slate-700">
      <div className="mb-8 text-center">
        <h1 className="font-mono text-2xl font-bold text-sky-400">Completar Perfil</h1>
        <p className="mt-2 text-sm text-slate-400">Debe actualizar su información antes de continuar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Nombre Completo</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Juan Pérez" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="juan@empresa.com" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Teléfono</label>
          <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="+57 300 123 4567" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Nueva Contraseña</label>
          <input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Mínimo 4 caracteres" required minLength={4} />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors">
          {loading ? 'Guardando...' : 'Completar y Continuar'}
        </button>
      </form>
    </div>
  );
}
