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
    emp_id: number | null;
  };
};

export const loginUsuario = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('auth/login', data);
  return response.data;
};

export const guardarSesion = (data: LoginResponse) => {
  localStorage.setItem('token', data.token);
  localStorage.setItem('usuario', JSON.stringify(data.usuario));
};
