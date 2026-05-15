import api from '../api/axios';

export type LoginRequest = {
  username: string;
  correo?: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  expiresIn: string;
  usuario: {
    id: number;
    username: string;
    nombre_completo: string;
    correo: string;
    rol_id: number;
    rol_nombre?: string;
    rol_nivel_acceso?: number;
    emp_id: number | null;
    permisos?: unknown[];
  };
};

export type RefreshSessionResponse = {
  valido: boolean;
  token?: string;
  usuario: LoginResponse['usuario'];
};

export const loginUsuario = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('auth/login', data);
  return response.data;
};

export const refrescarSesion = async (token: string): Promise<RefreshSessionResponse> => {
  const response = await api.post<RefreshSessionResponse>('auth/readtoken', { token });
  return response.data;
};

export const guardarSesion = (data: LoginResponse) => {
  localStorage.setItem('token', data.token);
  localStorage.setItem('usuario', JSON.stringify(data.usuario));
};
