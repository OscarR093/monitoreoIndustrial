import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export function AuthLayout() {
  return (
    <div className="flex h-screen bg-cyber-black text-white">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-cyber-black">
        <Outlet />
      </main>
    </div>
  );
}
