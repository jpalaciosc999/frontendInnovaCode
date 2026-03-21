import api from '../api/axios';
import type { Rol, RolForm } from '../interfaces/roles';

const ENDPOINT = 'roles';

export const obtenerRoles = async (): Promise<Rol[]> => {
  const response = await api.get<Rol[]>(`/${ENDPOINT}`);
  return response.data;
};

export const crearRol = async (data: RolForm): Promise<void> => {
  await api.post(`/${ENDPOINT}`, data);
};

export const actualizarRol = async (id: number, data: RolForm): Promise<void> => {
  await api.put(`/${ENDPOINT}/${id}`, data);
};

export const eliminarRol = async (id: number): Promise<void> => {
  await api.delete(`/${ENDPOINT}/${id}`);
};