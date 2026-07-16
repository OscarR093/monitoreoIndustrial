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
    <div className="rounded-xl bg-panel p-8 shadow-2xl border border-gridline">
      <div className="mb-8 text-center">
        <h1 className="font-mono text-2xl font-bold text-cyan-tech">Completar Perfil</h1>
        <p className="mt-2 text-sm text-text-muted">Debe actualizar su información antes de continuar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Nombre Completo</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-lg border border-gridline bg-cyber-black px-3 py-2 text-sm text-white placeholder-text-muted focus:border-cyan-tech focus:outline-none focus:ring-1 focus:ring-cyan-tech"
            placeholder="Juan Pérez" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gridline bg-cyber-black px-3 py-2 text-sm text-white placeholder-text-muted focus:border-cyan-tech focus:outline-none focus:ring-1 focus:ring-cyan-tech"
            placeholder="juan@empresa.com" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Teléfono</label>
          <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)}
            className="w-full rounded-lg border border-gridline bg-cyber-black px-3 py-2 text-sm text-white placeholder-text-muted focus:border-cyan-tech focus:outline-none focus:ring-1 focus:ring-cyan-tech"
            placeholder="+57 300 123 4567" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Nueva Contraseña</label>
          <input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)}
            className="w-full rounded-lg border border-gridline bg-cyber-black px-3 py-2 text-sm text-white placeholder-text-muted focus:border-cyan-tech focus:outline-none focus:ring-1 focus:ring-cyan-tech"
            placeholder="Mínimo 4 caracteres" required minLength={4} />
        </div>

        {error && (
          <div className="rounded-lg border border-industrial-red/30 bg-industrial-red/10 px-3 py-2 text-sm text-industrial-red">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-cyan-tech/20 px-4 py-2 text-sm font-semibold text-cyan-tech hover:bg-cyan-tech/30 disabled:opacity-50 transition-colors border border-cyan-tech/30">
          {loading ? 'Guardando...' : 'Completar y Continuar'}
        </button>
      </form>
    </div>
  );
}
