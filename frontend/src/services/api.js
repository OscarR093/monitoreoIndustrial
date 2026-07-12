const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  const response = await fetch(url, config);

  if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/me')) {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    if (data.mustUpdateProfile && !path.includes('/auth/complete-profile')) {
      if (typeof window !== 'undefined') {
        window.location.href = '/complete-profile';
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de red' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export function getWsUrl(planta, area) {
  const base = API_BASE.replace('http', 'ws');
  return `${base}/ws/realtime?planta=${planta}&area=${area}`;
}

export function isAuthenticated() {
  return !!getCookie('jwt');
}
