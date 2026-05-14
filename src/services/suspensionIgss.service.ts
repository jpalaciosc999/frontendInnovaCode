import api from '../api/axios';
import type { SuspensionIgss, SuspensionIgssForm } from '../interfaces/suspensionIgss';

const ENDPOINT = 'SuspensionIgss';

export const obtenerSuspensionesIgss = async (): Promise<SuspensionIgss[]> => {
  const response = await api.get<SuspensionIgss[]>(`${ENDPOINT}/`);
  return response.data;
};

export const crearSuspensionIgss = async (data: SuspensionIgssForm): Promise<void> => {
  await api.post(`${ENDPOINT}/`, data);
};

export const actualizarSuspensionIgss = async (
  id: number,
  data: SuspensionIgssForm
): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarSuspensionIgss = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};
