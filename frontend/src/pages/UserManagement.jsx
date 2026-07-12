import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState('viewer');
  const [error, setError] = useState('');

  const canCreateAdmin = currentUser?.rol === 'superadmin';

  const loadUsers = async () => {
    try {
      const data = await api.get('/api/auth/users');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/auth/register', { username: newUser, tempPassword: newPass, rol: newRole });
      setNewUser('');
      setNewPass('');
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await api.delete(`/api/auth/users/${id}`);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const roleLabel = (rol) => {
    const labels = { superadmin: 'SuperAdmin', admin: 'Administrador', viewer: 'Visualizador' };
    return labels[rol] || rol;
  };

  return (
    <div className="p-6">
      <h1 className="font-mono text-xl font-bold text-white">Gestión de Usuarios</h1>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap gap-3 rounded-lg border border-slate-700 bg-slate-800 p-4">
        <input type="text" value={newUser} onChange={(e) => setNewUser(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          placeholder="Nombre de usuario" required />
        <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          placeholder="Contraseña temporal" required />
        <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none">
          <option value="viewer">Visualizador</option>
          {canCreateAdmin && <option value="admin">Administrador</option>}
        </select>
        <button type="submit"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors">
          Crear Usuario
        </button>
      </form>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        </div>
      ) : users.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-500">No se encontraron usuarios</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-white">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.rol === 'superadmin' ? 'bg-purple-500/20 text-purple-400' :
                      u.rol === 'admin' ? 'bg-sky-500/20 text-sky-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>{roleLabel(u.rol)}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{u.nombreCompleto || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    {u.debeCambiarInfo ? (
                      <span className="text-amber-400 text-xs">Pendiente</span>
                    ) : (
                      <span className="text-emerald-400 text-xs">Completado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== currentUser?.id && (
                      <button onClick={() => handleDelete(u.id)}
                        className="text-xs text-red-400 hover:text-red-300">Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
