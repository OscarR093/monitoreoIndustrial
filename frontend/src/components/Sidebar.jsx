import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { icons, iconSize } from '../services/icons';

const DashboardIcon = icons.dashboard;
const UsersIcon = icons.users;
const SettingsIcon = icons.settings;
const ChevronLeftIcon = icons.chevronLeft;
const MenuIcon = icons.menu;
const LogOutIcon = icons.logout;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`${open ? 'w-52' : 'w-14'} flex flex-col bg-panel transition-all duration-200 border-r-2 border-acento/10`}>
      <div className="flex items-center justify-between px-3 py-3.5 border-b-2 border-acento/10">
        {open && <h1 className="font-mono text-sm font-black text-acento tracking-[0.15em]">SCADA</h1>}
        <button
          onClick={() => setOpen(!open)}
          className="rounded p-1 min-w-[32px] min-h-[32px] flex items-center justify-center text-text-muted hover:bg-cyber-black hover:text-acento transition-colors"
          aria-label={open ? 'Colapsar menú' : 'Expandir menú'}
        >
          {open ? <ChevronLeftIcon size={iconSize.inline} /> : <MenuIcon size={iconSize.inline} />}
        </button>
      </div>

      <nav className="flex-1 py-3 space-y-0.5 px-2">
        <div className={`px-3 pb-1 ${!open && 'hidden'}`}>
          <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-semibold">Navegación</span>
        </div>

        <Link to="/" className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
          isActive('/') ? 'bg-acento/10 text-acento border-l-2 border-acento' : 'text-text-muted hover:bg-cyber-black hover:text-white border-l-2 border-transparent'
        } ${!open && 'justify-center border-l-0'}`}>
          <DashboardIcon size={iconSize.nav} />
          {open && 'Dashboard'}
        </Link>

        {isElevated && (
          <Link to="/users" className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
            isActive('/users') ? 'bg-acento/10 text-acento border-l-2 border-acento' : 'text-text-muted hover:bg-cyber-black hover:text-white border-l-2 border-transparent'
          } ${!open && 'justify-center border-l-0'}`}>
            <UsersIcon size={iconSize.nav} />
            {open && 'Usuarios'}
          </Link>
        )}

        <Link to="/settings" className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
          isActive('/settings') ? 'bg-acento/10 text-acento border-l-2 border-acento' : 'text-text-muted hover:bg-cyber-black hover:text-white border-l-2 border-transparent'
        } ${!open && 'justify-center border-l-0'}`}>
          <SettingsIcon size={iconSize.nav} />
          {open && 'Configuración'}
        </Link>
      </nav>

      <div className="border-t-2 border-acento/10 p-3">
        <div className={`flex items-center gap-2.5 ${!open && 'justify-center'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
            user?.rol === 'superadmin' ? 'bg-superadmin/20 text-superadmin border border-superadmin/30' :
            user?.rol === 'admin' ? 'bg-acento/20 text-acento border border-acento/30' :
            'bg-text-muted/20 text-text-muted border border-text-muted/30'
          }`}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          {open && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold text-white">{user?.nombreCompleto || user?.username}</p>
              <p className="text-[10px] uppercase tracking-wider text-text-muted">{user?.rol}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`mt-2.5 w-full rounded px-2 py-1.5 text-xs text-text-muted hover:bg-cyber-black hover:text-industrial-red transition-colors ${!open && 'text-center'}`}
        >
          {open ? <span className="flex items-center gap-2"><LogOutIcon size={iconSize.inline} /> Cerrar sesión</span> : <LogOutIcon size={iconSize.inline} />}
        </button>
      </div>
    </aside>
  );
}
