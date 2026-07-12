import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import Login from './pages/Login';
import CompleteProfile from './pages/CompleteProfile';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';

function NotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="font-mono text-4xl font-bold text-slate-400">404</h1>
        <p className="mt-2 text-slate-500">Página no encontrada</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/complete-profile" element={
              <ProtectedRoute><CompleteProfile /></ProtectedRoute>
            } />
          </Route>

          <Route element={
            <ProtectedRoute><AuthLayout /></ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={
              <ProtectedRoute roles={['superadmin', 'admin']}><UserManagement /></ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
