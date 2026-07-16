import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { icons, iconSize } from '../services/icons';

const { activity: Activity } = icons;

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      navigate(data.mustUpdateProfile ? '/complete-profile' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-panel p-8 shadow-2xl border border-gridline">
      <div className="mb-8 text-center">
        <Activity size={40} className="mx-auto text-cyan-tech mb-3" />
        <h1 className="font-mono text-2xl font-bold text-cyan-tech">Monitoreo Industrial</h1>
        <p className="mt-2 text-sm text-text-muted">Inicie sesión para acceder al sistema</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Usuario</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-gridline bg-cyber-black px-3 py-2 text-sm text-white placeholder-text-muted focus:border-cyan-tech focus:outline-none focus:ring-1 focus:ring-cyan-tech"
            placeholder="admin" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gridline bg-cyber-black px-3 py-2 text-sm text-white placeholder-text-muted focus:border-cyan-tech focus:outline-none focus:ring-1 focus:ring-cyan-tech"
            placeholder="••••••••" required />
        </div>

        {error && (
          <div className="rounded-lg border border-industrial-red/30 bg-industrial-red/10 px-3 py-2 text-sm text-industrial-red">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-cyan-tech/20 px-4 py-2 text-sm font-semibold text-cyan-tech hover:bg-cyan-tech/30 disabled:opacity-50 transition-colors border border-cyan-tech/30">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
