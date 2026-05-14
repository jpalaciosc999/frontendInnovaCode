import axios from 'axios';

export const AUTH_REQUIRED_EVENT = 'auth-required';
export const ACCESS_FORBIDDEN_EVENT = 'access-forbidden';

const statusMessages: Record<number, string> = {
  400: 'Filtros o datos invalidos',
  401: 'Token invalido o expirado',
  403: 'No tienes permisos',
  404: 'Ruta inexistente o recurso no encontrado',
  409: 'Conflicto de datos',
};

const api = axios.create({
  baseURL: 'http://localhost:4000/',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = status ? statusMessages[status] : undefined;

    if (message && error.response) {
      if (!error.response.data || typeof error.response.data !== 'object') {
        error.response.data = { error: message };
      } else if (!error.response.data.error && !error.response.data.message) {
        error.response.data.error = message;
      }
    }

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (status === 403) {
      window.dispatchEvent(new Event(ACCESS_FORBIDDEN_EVENT));
    }

    return Promise.reject(error);
  }
);

export default api;
