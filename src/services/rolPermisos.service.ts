import api from '../api/axios';
import type { RolPermiso, RolPermisoForm } from '../interfaces/rolPermisos';

const ENDPOINT = 'rolPermisos';

export const obtenerRolPermisos = async (): Promise<RolPermiso[]> => {
  const response = await api.get<RolPermiso[]>(`${ENDPOINT}/`);
  return response.data;
};

export const crearRolPermiso = async (data: RolPermisoForm): Promise<void> => {
  await api.post(`${ENDPOINT}/`, data);
};

export const actualizarRolPermiso = async (id: number, data: RolPermisoForm): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarRolPermiso = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};