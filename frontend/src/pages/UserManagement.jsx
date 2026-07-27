import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { icons, iconSize } from '../services/icons';

const { users: UsersIcon, alert: AlertTriangle } = icons;

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
    try { setUsers(await api.get('/api/auth/users')); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/api/auth/register', { username: newUser, tempPassword: newPass, rol: newRole });
      setNewUser(''); setNewPass(''); loadUsers();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try { await api.delete(`/api/auth/users/${id}`); loadUsers(); }
    catch (err) { setError(err.message); }
  };

  const roleLabel = (rol) => ({ superadmin: 'SuperAdmin', admin: 'Administrador', viewer: 'Visualizador' }[rol] || rol);

  return (
    <div className="p-6 bg-cyber-black min-h-full">
      <h1 className="font-mono text-xl font-bold text-white flex items-center gap-2">
        <UsersIcon size={iconSize.header} className="text-acento" />
        Gestión de Usuarios
      </h1>

      {error && (
        <div className="mt-4 rounded-lg border border-industrial-red/30 bg-industrial-red/10 px-3 py-2 text-sm text-industrial-red">
          <AlertTriangle size={iconSize.inline} className="inline mr-1" />{error}
        </div>
      )}

      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap gap-3 rounded-lg border border-gridline bg-panel p-4">
        <input type="text" value={newUser} onChange={(e) => setNewUser(e.target.value)}
          className="rounded-lg border border-gridline bg-cyber-black px-3 py-2 text-sm text-white placeholder:text-text-muted focus:border-acento focus:outline-none"
          placeholder="Nombre de usuario" aria-label="Nombre de usuario" required />
        <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
          className="rounded-lg border border-gridline bg-cyber-black px-3 py-2 text-sm text-white placeholder:text-text-muted focus:border-acento focus:outline-none"
          placeholder="Contraseña temporal" aria-label="Contraseña temporal" required />
        <select value={newRole} onChange={(e) => setNewRole(e.target.value)} aria-label="Rol del usuario"
          className="rounded-lg border border-gridline bg-cyber-black px-3 py-2 text-sm text-white focus:border-acento focus:outline-none">
          <option value="viewer">Visualizador</option>
          {canCreateAdmin && <option value="admin">Administrador</option>}
        </select>
        <button type="submit"
          className="rounded-lg bg-acento/20 px-4 py-2 text-sm font-semibold text-acento hover:bg-acento/30 transition-colors border border-acento/30">
          Crear Usuario
        </button>
      </form>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-acento border-t-transparent" />
        </div>
      ) : users.length === 0 ? (
        <p className="mt-8 text-center text-sm text-text-muted">No se encontraron usuarios</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gridline">
          <table className="w-full text-sm">
            <thead className="bg-panel">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gridline">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-panel/50">
                  <td className="px-4 py-3 font-mono text-white">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.rol === 'superadmin' ? 'bg-superadmin/20 text-superadmin' :
                      u.rol === 'admin' ? 'bg-acento/20 text-acento' :
                      'bg-text-muted/20 text-text-muted'
                    }`}>{roleLabel(u.rol)}</span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{u.nombreCompleto || '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    {u.debeCambiarInfo ? (
                      <span className="text-industrial-amber text-xs">Pendiente</span>
                    ) : (
                      <span className="text-industrial-green text-xs">Completado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== currentUser?.id && (
                      <button onClick={() => handleDelete(u.id)}
                        className="text-xs text-industrial-red hover:text-industrial-red/70">Eliminar</button>
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
