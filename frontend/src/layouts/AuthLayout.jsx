import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AuthLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isElevated = user?.rol === 'superadmin' || user?.rol === 'admin';

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-200`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {sidebarOpen && <span className="font-mono text-sm font-semibold text-sky-400">MONITOREO</span>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">
            <span>📊</span>
            {sidebarOpen && 'Dashboard'}
          </Link>

          {isElevated && (
            <Link to="/users" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">
              <span>👥</span>
              {sidebarOpen && 'Usuarios'}
            </Link>
          )}
        </nav>

        <div className="border-t border-slate-700 p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-sky-600 flex items-center justify-center text-xs font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{user?.nombreCompleto || user?.username}</p>
                <p className="text-xs text-slate-400">{user?.rol}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-red-400"
          >
            {sidebarOpen ? 'Cerrar sesión' : '⏻'}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
