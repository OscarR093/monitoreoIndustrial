import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { icons, iconSize } from '../services/icons';

const DashboardIcon = icons.dashboard;
const UsersIcon = icons.users;
const ChevronLeftIcon = icons.chevronLeft;
const MenuIcon = icons.menu;
const LogOutIcon = icons.logout;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => setOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isElevated = user?.rol === 'superadmin' || user?.rol === 'admin';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`${open ? 'w-52' : 'w-14'} flex flex-col bg-panel border-r border-gridline transition-all duration-200`}>
      <div className="flex items-center justify-between p-3 border-b border-gridline">
        {open && <span className="font-mono text-xs font-bold text-cyan-tech tracking-wider">SCADA</span>}
        <button
          onClick={() => setOpen(!open)}
          className="rounded p-1 text-text-muted hover:bg-gridline hover:text-white transition-colors"
        >
          {open ? <ChevronLeftIcon size={iconSize.inline} /> : <MenuIcon size={iconSize.inline} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        <Link to="/" className={`flex items-center gap-3 rounded px-3 py-2 text-sm text-text-muted hover:bg-cyber-black hover:text-white transition-colors ${!open && 'justify-center'}`}>
          <DashboardIcon size={iconSize.nav} />
          {open && 'Dashboard'}
        </Link>

        {isElevated && (
          <Link to="/users" className={`flex items-center gap-3 rounded px-3 py-2 text-sm text-text-muted hover:bg-cyber-black hover:text-white transition-colors ${!open && 'justify-center'}`}>
            <UsersIcon size={iconSize.nav} />
            {open && 'Usuarios'}
          </Link>
        )}
      </nav>

      <div className="border-t border-gridline p-3">
        <div className={`flex items-center gap-2 ${!open && 'justify-center'}`}>
          <div className="h-7 w-7 rounded-full bg-cyan-tech/20 flex items-center justify-center text-xs font-bold text-cyan-tech">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          {open && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-white">{user?.nombreCompleto || user?.username}</p>
              <p className="text-xs text-text-muted">{user?.rol}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`mt-2 w-full rounded px-2 py-1 text-xs text-text-muted hover:bg-cyber-black hover:text-industrial-red transition-colors ${!open && 'text-center'}`}
        >
          {open ? <span className="flex items-center gap-2"><LogOutIcon size={iconSize.inline} /> Cerrar sesión</span> : <LogOutIcon size={iconSize.inline} />}
        </button>
      </div>
    </aside>
  );
}
