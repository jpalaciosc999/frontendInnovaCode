import api from '../api/axios';
import type { Permiso, PermisoForm } from '../interfaces/permisos';

const ENDPOINT = 'permisos';

export const obtenerPermisos = async (): Promise<Permiso[]> => {
  const response = await api.get<Permiso[]>(`${ENDPOINT}/`);
  return response.data;
};

export const crearPermiso = async (data: PermisoForm): Promise<void> => {
  await api.post(`${ENDPOINT}/`, data);
};

export const actualizarPermiso = async (id: number, data: PermisoForm): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarPermiso = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};