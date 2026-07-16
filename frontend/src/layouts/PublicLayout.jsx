import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cyber-black">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
